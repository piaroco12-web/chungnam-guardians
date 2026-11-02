import assert from 'node:assert/strict';
import {cp, mkdir, readFile, readdir, rm, stat} from 'node:fs/promises';
import {dirname, isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist');
const config = await readFile(resolve(root, '_config.yml'), 'utf8');
// 이 저장소에서 사용하는 YAML 블록 목록만 읽는다. 지원하지 않는 형식은 조용히 배포하지 않는다.
const lines = config.split(/\r?\n/);
const start = lines.findIndex(line => /^exclude:\s*(?:#.*)?$/.test(line));
assert.ok(start >= 0, '_config.yml에 exclude 목록이 필요합니다.');
const excluded = ['.git', 'dist', '.gitignore', '_config.yml'];
for (const line of lines.slice(start + 1)) {
  if (!line.trim() || /^\s*#/.test(line)) continue;
  if (/^\S/.test(line)) break;
  const item = line.match(/^\s+-\s+([^#]+?)(?:\s+#.*)?$/);
  assert.ok(item, `지원하지 않는 exclude 형식: ${line}`);
  const path = item[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  assert.ok(path && !isAbsolute(path) && !path.split(/[\\/]/).includes('..'), '제외 경로는 저장소 안에 있어야 합니다.');
  excluded.push(path.replace(/\\/g, '/').replace(/\/$/, ''));
}
assert.ok(excluded.length > 4, '비어 있는 제외 목록은 허용하지 않습니다.');
const allowed = path => {
  const name = relative(root, path).split(sep).join('/');
  return !excluded.some(item => name === item || name.startsWith(item + '/'));
};
// 삭제 대상은 이 스크립트 위치로 결정한 저장소의 dist 폴더 하나로 제한한다.
assert.equal(dirname(out), root);
assert.equal(relative(root, out), 'dist');
await rm(out, {recursive: true, force: true});
await mkdir(out);
for (const name of await readdir(root)) {
  const source = resolve(root, name);
  if (allowed(source)) await cp(source, resolve(out, name), {recursive: true, filter: allowed});
}
for (const name of ['index.html', 'sw.js']) assert.ok((await stat(resolve(out, name))).isFile(), `${name} 누락`);
for (const name of ['src', 'data', 'assets']) assert.ok((await stat(resolve(out, name))).isDirectory(), `${name} 누락`);
for (const name of new Set([...excluded, 'art-src', 'tools', 'docs'])) {
  await assert.rejects(stat(resolve(out, name)), {code: 'ENOENT'}, `${name}은 배포에서 제외해야 합니다.`);
}
console.log('Cloudflare Pages 빌드 완료: dist/ (필수 파일 및 제외 목록 점검 통과)');
