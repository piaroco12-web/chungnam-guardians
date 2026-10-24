// 화면 모션: 「모션 견본집」의 견본을 라이브러리 없이 브라우저 기본 애니메이션(Web Animations)으로 옮김.
// 번호(M02 등)는 견본집 카드 번호. '움직임 줄이기' 설정이면 모두 건너뛴다.
import { save } from './save.js';
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EXPO = 'cubic-bezier(.16,1,.3,1)', CUBIC = 'cubic-bezier(.33,1,.68,1)', QUART = 'cubic-bezier(.25,1,.5,1)';
const rnd = (a, b) => a + Math.random() * (b - a);
const play = (el, kf, o) => (el && el.animate && !reduce() ? el.animate(kf, { fill: 'both', ...o }) : null);

// M02 흩어진 글자 모으기: 글자가 흩어진 자리에서 제자리로
export function scatterText(el) {
  if (!el || reduce()) return;
  const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  if (!node) return;
  const spans = [...node.textContent].map(ch => { const s = document.createElement('span'); s.textContent = ch; s.style.display = 'inline-block'; if (ch === ' ') s.style.width = '.3em'; return s; });
  const frag = document.createDocumentFragment(); spans.forEach(s => frag.appendChild(s));
  el.replaceChild(frag, node);
  spans.forEach((s, i) => play(s, [{ transform: `translate(${rnd(-160, 160)}px,${rnd(-120, 120)}px) rotate(${rnd(-90, 90)}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, easing: EXPO, delay: 200 + i * 70 }));
}

// M04 줄 서서 등장
export function stagger(els, step = 110, dy = 16) {
  [...els].forEach((el, i) => play(el, [{ transform: `translateY(${dy}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: CUBIC, delay: i * step }));
}

// M06 도장 쾅: 무대 위에 도장을 찍고 살짝 흔든 뒤 콜백
export function stamp(root, html, done) {
  const wrap = document.createElement('div'); wrap.className = 'stampwrap';
  wrap.innerHTML = `<div class="stamp ol">${html}</div>`;
  root.appendChild(wrap);
  const s = wrap.firstChild;
  const a = play(s, [{ transform: 'scale(2.4) rotate(-24deg)', opacity: 0 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.55,0,1,.45)' });
  const shake = () => play(root.parentElement || root, [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 260, fill: 'none' });
  const finish = () => setTimeout(() => { wrap.remove(); done && done(); }, 850);
  if (a) a.finished.then(() => { if (!save.settings.calm) shake(); finish(); }); else finish();
}

// M08 펼쳐지는 종이: 위를 기준으로 펼친 뒤 내용이 나타남
export function unfold(el) {
  if (!el) return;
  el.style.transformOrigin = 'top center';
  const a = play(el, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 700, easing: QUART });
  const kids = [...el.children];
  kids.forEach((k, i) => play(k, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 650 + i * 80, easing: 'linear' }));
  return a;
}

// M10 형광펜 칠하기: 문장 속 구절을 형광펜 띠로 감싸고 왼쪽부터 칠한다
export function highlight(p, phrase, delay = 900) {
  if (!p || !phrase || !p.innerHTML.includes(phrase)) return;
  p.innerHTML = p.innerHTML.replace(phrase, `<em class="hl"><i></i><span>${phrase}</span></em>`);
  const bar = p.querySelector('.hl i');
  if (reduce()) { bar.style.transform = 'scaleX(1)'; return; }
  play(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 700, easing: CUBIC, delay });
}

// M05 숫자 올라가기
export function countUp(el, to, ms = 1400, suffix = '') {
  if (!el) return;
  if (reduce()) { el.textContent = to.toLocaleString('ko-KR') + suffix; return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms), e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
    el.textContent = Math.round(to * e).toLocaleString('ko-KR') + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// M11 통통 버튼: 누르면 작아졌다 통통 튀며 돌아옴 (스프링 느낌의 키프레임)
export function bouncy(root) {
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b || b.disabled) return;
    play(b, [{ scale: 1 }, { scale: 0.9, offset: 0.15 }, { scale: 1.08, offset: 0.45 }, { scale: 0.97, offset: 0.7 }, { scale: 1 }], { duration: 480, easing: 'ease-out', fill: 'none' });
  });
}

// M12 젤리 카드: 옆으로 퍼졌다 출렁이며 돌아옴. 끝나면 콜백
export function jelly(el, done) {
  const a = play(el, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.2,.8)', offset: 0.18 }, { transform: 'scale(.9,1.1)', offset: 0.42 }, { transform: 'scale(1.05,.95)', offset: 0.65 }, { transform: 'scale(1,1)' }], { duration: 520, easing: 'ease-out', fill: 'none' });
  if (a) a.finished.then(() => done && done()); else done && done();
}

// M13 고개 젓기: 안 될 때 좌우로 흔들고 테두리를 잠깐 빨갛게
export function nope(el) {
  if (!el) return;
  el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 900);
  play(el, [0, -10, 10, -8, 8, -4, 4, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 450, fill: 'none' });
}

// M18 알림 미끄러져 오기는 style.css의 .toast 애니메이션으로 처리
