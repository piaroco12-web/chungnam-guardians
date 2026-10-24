"""assets/img 의 PNG 그림을 WebP로 바꿔 학생 기기의 첫 접속 용량을 줄인다.

쓰는 법: (저장소 폴더에서) python tools/to_webp.py
  1. assets/img/<이름>.png → assets/img/<이름>.webp (투명 배경 유지, 품질 85)
  2. 원본 PNG는 art-src/img/ 로 옮겨 보관한다 (게임이 내려받지 않는다)
  3. assets/precache.json, assets/image-manifest.json 의 경로를 .webp로 고친다
새 그림(PNG)을 assets/img 에 넣은 뒤에도 이 명령을 한 번 실행하면 된다.
이미 WebP인 그림은 건드리지 않는다. 필요: pip install pillow
"""
import json, os, shutil, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG, SRC = ROOT / 'assets' / 'img', ROOT / 'art-src' / 'img'
QUALITY = 85


def convert(png: Path) -> Path:
    webp = png.with_suffix('.webp')
    im = Image.open(png)
    alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    im = im.convert('RGBA' if alpha else 'RGB')
    tmp = webp.with_suffix('.webp.tmp')
    im.save(tmp, format='WEBP', quality=QUALITY, method=6, alpha_quality=95)
    tmp.replace(webp)
    return webp


def main():
    pngs = sorted(IMG.glob('*.png'))
    if not pngs:
        print('바꿀 PNG가 없어요. 이미 모두 WebP예요.')
    SRC.mkdir(parents=True, exist_ok=True)
    before = after = 0
    for png in pngs:
        a = png.stat().st_size
        webp = convert(png)
        b = webp.stat().st_size
        before += a; after += b
        shutil.move(str(png), SRC / png.name)
        print(f'  ✓ {png.name:34} {a / 1e6:6.2f}MB → {b / 1e6:5.2f}MB')
    if pngs:
        print(f'\n그림 {len(pngs)}장: {before / 1e6:.1f}MB → {after / 1e6:.1f}MB (원본은 art-src/img/ 에 보관)')

    # 목록 파일 고치기
    pre_path = ROOT / 'assets' / 'precache.json'
    pre = json.loads(pre_path.read_text(encoding='utf-8'))
    fixed = []
    for p in pre:
        if p.startswith('assets/img/') and p.endswith('.png'):
            p = p[:-4] + '.webp'
        fixed.append(p)
    # assets/img 에 있는데 목록에 없는 그림도 넣는다 (오프라인에서도 보이게)
    have = set(fixed)
    for w in sorted(IMG.glob('*.webp')):
        rel = f'assets/img/{w.name}'
        if rel not in have:
            fixed.append(rel); print(f'  + 오프라인 목록에 추가: {rel}')
    missing = [p for p in fixed if not (ROOT / p).exists()]
    pre_path.write_text(json.dumps(fixed, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    man_path = ROOT / 'assets' / 'image-manifest.json'
    man = json.loads(man_path.read_text(encoding='utf-8'))
    for it in man.get('images', []):
        p = it.get('path', '')
        if p.startswith('assets/img/') and p.endswith('.png'):
            it['path'] = p = p[:-4] + '.webp'
        f = ROOT / p
        if f.exists():
            it['bytes'] = f.stat().st_size
            it['format'] = 'webp'
    man_path.write_text(json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    total = sum((ROOT / p).stat().st_size for p in fixed if (ROOT / p).exists())
    print(f'오프라인 목록 {len(fixed)}개 · {total / 1e6:.1f}MB')
    if missing:
        sys.exit('목록에 있지만 파일이 없는 그림: ' + ', '.join(missing))
    print('sw.js 의 VERSION 과 src/ui.js 의 VERSION 을 올려야 학생 기기가 새 그림을 받아요.')


if __name__ == '__main__':
    main()
