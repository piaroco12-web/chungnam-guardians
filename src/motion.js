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

// 정화 축하: 짧게 떠오른 뒤 다음 화면으로, 화면 흔들림은 사용하지 않는다.
export function stamp(root, html, done) {
  const wrap = document.createElement('div'); wrap.className = 'stampwrap purification-overlay';
  wrap.innerHTML = `<div class="purification-panel">${html}</div>`;
  root.appendChild(wrap);
  const panel = wrap.firstChild;
  const quiet = save.settings.calm || reduce();
  if (!quiet) {
    play(panel, [{ transform: 'translateY(22px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: EXPO });
    const seal = panel.querySelector('.purification-seal');
    play(seal, [{ transform: 'translateY(-12px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: EXPO, delay: 80 });
  }
  let finished = false;
  setTimeout(() => {
    if (finished) return; finished = true;
    const active = wrap.isConnected; wrap.remove();
    if (active && done) done();
  }, quiet ? 1100 : 1500);
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
    if (save.settings.calm) return;
    const b = e.target.closest('.btn'); if (!b || b.disabled) return;
    play(b, [{ scale: 1 }, { scale: 0.9, offset: 0.15 }, { scale: 1.08, offset: 0.45 }, { scale: 0.97, offset: 0.7 }, { scale: 1 }], { duration: 480, easing: 'ease-out', fill: 'none' });
  });
}

// M12 젤리 카드: 옆으로 퍼졌다 출렁이며 돌아옴. 끝나면 콜백
export function jelly(el, done) {
  const a = play(el, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.2,.8)', offset: 0.18 }, { transform: 'scale(.9,1.1)', offset: 0.42 }, { transform: 'scale(1.05,.95)', offset: 0.65 }, { transform: 'scale(1,1)' }], { duration: 520, easing: 'ease-out', fill: 'none' });
  if (a) a.finished.then(() => done && done()); else done && done();
}

// 선택 카드 등장: 읽는 순서만 짧게 안내한다.
export function dealChoices(els) {
  if (save.settings.calm || reduce()) return;
  [...els].forEach((el, i) => play(el,
    [{ opacity: 0, transform: 'translateY(18px) rotateX(8deg) scale(.97)' }, { opacity: 1, transform: 'none' }],
    { duration: 340, delay: i * 65, easing: EXPO }));
}

// 선택 확정은 화면당 한 번만 실행한다. 화면이 닫히면 늦은 콜백은 버린다.
export function chooseCard(el, done) {
  const screen = el?.closest('.screen');
  if (!screen || screen.dataset.choicePending === 'true') return false;
  screen.dataset.choicePending = 'true';
  screen.querySelectorAll('button').forEach(b => { b.disabled = true; });
  el.classList.add('choice-picked');
  const quiet = save.settings.calm || reduce();
  let finished = false;
  const finish = () => { if (finished) return; finished = true; if (screen.isConnected) done?.(); };
  if (quiet) { screen.classList.add('selection-quiet'); finish(); return true; }
  screen.classList.add('selection-pending');
  const group = el.closest('.choices, .picks');
  group?.querySelectorAll('.choice, .pick').forEach(other => {
    if (other !== el) play(other, [{ opacity: 1 }, { opacity: .2, transform: 'translateY(8px) scale(.96)' }], { duration: 220, easing: CUBIC });
  });
  const burst = document.createElement('span'); burst.className = 'selection-burst'; burst.setAttribute('aria-hidden', 'true');
  const a = el.getBoundingClientRect(), b = screen.getBoundingClientRect();
  burst.style.left = (a.x + a.width / 2 - b.x) + 'px'; burst.style.top = (a.y + a.height * .42 - b.y) + 'px';
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('i'), angle = i * Math.PI / 4;
    p.style.setProperty('--dx', Math.cos(angle) * 78 + 'px'); p.style.setProperty('--dy', Math.sin(angle) * 78 + 'px');
    burst.appendChild(p);
  }
  screen.appendChild(burst);
  const animation = play(el, [{ transform: 'scale(1)' }, { transform: 'translateY(-5px) scale(1.055)', offset: .5 }, { transform: 'translateY(-3px) scale(1.025)' }], { duration: 330, easing: CUBIC, fill: 'forwards' });
  animation?.finished.then(finish).catch(finish);
  setTimeout(finish, 380);
  return true;
}

// M13 고개 젓기: 안 될 때 좌우로 흔들고 테두리를 잠깐 빨갛게
export function nope(el) {
  if (!el) return;
  el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 900);
  play(el, [0, -10, 10, -8, 8, -4, 4, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 450, fill: 'none' });
}

// M18 알림 미끄러져 오기는 style.css의 .toast 애니메이션으로 처리
