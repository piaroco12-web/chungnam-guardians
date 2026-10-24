// 전투: 플레이어·적·보스·탄·무기·가호 효과를 한곳에서 돌린다.
// 시간은 dt(실제) × ts(슬로우 배율)로 흐른다. 플레이어 이동만 실제 시간.
import { W, H } from './view.js';
import { input, isActive, keyAxis, consumeDrag } from './input.js';
import { PILOTS, SHIPS, DIFFS, REGIONS, ENEMIES, BOSSES } from '../data/content.js';
import { BOONS, RARITY } from '../data/boons.js';
import { art } from './assets.js';
import { sfx } from './audio.js';
import { save } from './save.js';

export const STAGES = ['wave', 'wave', 'mid', 'wave', 'boss'];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const pick = a => a[Math.floor(Math.random() * a.length)];
const BOON = Object.fromEntries(BOONS.map(b => [b.id, b]));

export function newRun({ pilot, ship, diff, region = 0 }) {
  return {
    pilot, ship, diff, region, stage: 0, startRegion: region,
    hp: null, level: 1, xp: 0, coins: 0, kills: 0,
    weapons: { main: 1 }, upgrades: {}, evolved: [],
    boons: {}, duos: [], legend: null, gauge: 0,
    rerolls: save.meta.reroll, reviveLeft: save.meta.revive,
    cardsGained: [], bossesBeaten: [],
  };
}

export class Battle {
  constructor(run, hooks) {
    this.run = run; this.hooks = hooks;
    this.pilot = PILOTS.find(p => p.id === run.pilot);
    this.ship = SHIPS.find(s => s.id === run.ship);
    this.diff = DIFFS.find(d => d.id === run.diff);
    this.recalc();
    if (run.hp == null) run.hp = this.maxHp;
    this.p = { x: W / 2, y: H - 170, r: 11, inv: 0, bubble: 0, shields: this.maxShields, shieldT: 0, iceShell: this.has('gg_hit') ? 1 : 0, iceT: 0, slowDebuff: 0, flipT: 0, galeT: 0, shotN: 0 };
    this.t = 0; this.scroll = 0; this.ts = 1; this.wasActive = true;
    this.pb = []; this.eb = []; this.enemies = []; this.items = []; this.fx = []; this.texts = []; this.objs = []; this.hazards = []; this.overlays = [];
    this.timers = {}; this.real = []; this.boss = null; this.banner = null; this.shake = 0; this.flash = 0;
    this.pendingLevels = 0; this.paused = false; this.over = false;
    this.ultT = 0; this.ultKind = null;
    this.startStage();
  }

  // ───────── 능력치 ─────────
  has(id) { return id in this.run.boons; }
  rr(id) { return RARITY[this.run.boons[id]]?.mul || 1; }
  up(id) { return this.run.upgrades[id] || 0; }
  wl(id) { return this.run.weapons[id] || 0; }
  evo(id) { return this.run.evolved.includes(id); }
  duo(id) { return this.run.duos.includes(id); }

  recalc() {
    const u = id => this.up(id), m = save.meta;
    this.st = {
      atk: (1 + u('atk') * 0.1 + m.atk * 0.03),
      rate: 1 + u('rate') * 0.08,
      speed: 1 + u('speed') * 0.1,
      cd: Math.max(0.4, 1 - u('cd') * 0.06),
      size: 1 + u('size') * 0.1,
      area: 1 + u('area') * 0.1,
      dur: 1 + u('dur') * 0.12,
      magnet: 130 * (1 + u('magnet') * 0.25 + m.magnet * 0.1),
      crit: u('crit') * 0.05,
      elem: this.run.pilot === 'centeri' ? 1.3 : 1,
      elemDur: this.run.pilot === 'centeri' ? 1 : 0,
    };
    this.maxHp = this.pilot.hp + m.hp * 5 + u('hp') * 15;
    this.maxShields = (this.run.pilot === 'edui' ? 1 : 0) + (this.has('ta_hit') ? (this.rr('ta_hit') >= 2 ? 2 : 1) : 0);
    this.bulletElem = ['gy_bullet', 'gg_bullet', 'sh_bullet', 'bj_bullet', 'cg_bullet', 'ta_bullet'].find(id => this.has(id)) || null;
    this.slowBoon = ['gy_slow', 'gg_slow', 'sh_slow', 'bj_slow', 'cg_slow', 'ta_slow'].find(id => this.has(id)) || null;
    if (this.p) { this.p.shields = Math.min(this.p.shields, this.maxShields); if (this.has('gg_hit') && this.p.iceShell === undefined) this.p.iceShell = 1; }
  }

  // ───────── 스테이지 진행 ─────────
  get region() { return REGIONS[this.run.region]; }
  scaleHp() { return this.diff.hp * (1 + this.run.region * 0.45) * (1 + this.run.stage * 0.08); }

  startStage() {
    const kind = STAGES[this.run.stage];
    this.stageKind = kind;
    this.clearTimer = 0; this.vacuumT = 0;
    if (kind === 'wave') {
      const n = STAGES.slice(0, this.run.stage + 1).filter(s => s === 'wave').length;
      this.waveNo = n;
      this.queue = this.buildWave();
      this.waveT = 0;
      this.showBanner(`${this.region.name} · 웨이브 ${n}`, '');
      sfx.wave();
    } else {
      const id = kind === 'mid' ? this.region.mid : this.region.boss;
      this.queue = [];
      this.introT = 2.2;
      const b = BOSSES[id];
      this.showBanner('⚠ 경고 ⚠', `${b.name}\n${b.issue}`, 2.2, true);
      sfx.warn();
      this.pendingBoss = id;
    }
    this.hooks.hud();
  }

  buildWave() {
    const reg = this.region, q = [];
    const groups = 6 + this.run.region + (this.waveNo === 3 ? 2 : 0) + (this.diff.id === 'legend' || this.diff.id === 'hell' ? 2 : 0);
    let t = 1;
    for (let i = 0; i < groups; i++) {
      const type = pick(reg.enemies);
      const form = pick(['line', 'vee', 'column', 'random', 'sides']);
      const count = type === 'bug' ? 2 + Math.floor(this.run.region / 2) : 4 + Math.floor(Math.random() * 4) + Math.floor(this.run.region / 2);
      q.push({ t, type, form, count });
      t += rnd(2.4, 3.6) - this.run.region * 0.15;
    }
    return q;
  }

  spawnGroup(g) {
    const n = g.count;
    for (let i = 0; i < n; i++) {
      let x, y = -40 - i * 0, delay = 0;
      switch (g.form) {
        case 'line': x = 70 + (W - 140) * (n === 1 ? 0.5 : i / (n - 1)); break;
        case 'vee': x = W / 2 + (i - (n - 1) / 2) * 60; y = -40 - Math.abs(i - (n - 1) / 2) * 40; break;
        case 'column': x = g.x ?? (g.x = rnd(100, W - 100)); delay = i * 0.35; break;
        case 'sides': x = i % 2 ? 50 : W - 50; delay = Math.floor(i / 2) * 0.4; break;
        default: x = rnd(50, W - 50); delay = i * 0.25;
      }
      this.objs.push({ kind: 'spawnLater', t: delay, fn: () => this.spawnEnemy(g.type, x, y, i) });
    }
  }

  spawnEnemy(type, x, y, i = 0, extra = {}) {
    const d = ENEMIES[type];
    const hp = d.hp * this.scaleHp();
    const e = { type, x, y, x0: x, r: d.r, hp, maxHp: hp, speed: d.speed, t: 0, i, shootT: d.shoot ? rnd(0.5, d.shoot) : 0,
      chill: 0, chillT: 0, frozen: 0, burn: 0, burnDps: 0, hitCd: {}, flash: 0, ...extra };
    if (d.move === 'hover') e.ty = rnd(140, 360);
    this.enemies.push(e);
    return e;
  }

  spawnBoss(id) {
    const b = BOSSES[id];
    const isMid = this.stageKind === 'mid';
    const hp = b.hp * this.diff.hp * (1 + this.run.region * 0.35);
    const patterns = [...b.patterns];
    if (this.diff.id === 'hell') patterns.push('aimed');
    this.boss = { id, name: b.name, issue: b.issue, x: W / 2, y: -120, ty: isMid ? 270 : 290, r: b.r, hp, maxHp: hp, t: 0,
      patterns, pi: 0, pt: 0, acc: 0, acc2: 0, mid: isMid, flash: 0, chill: 0, chillT: 0, frozen: 0, burn: 0, burnDps: 0, hitCd: {}, dying: 0, isBoss: true };
    this.enemies.push(this.boss);
  }

  showBanner(title, sub = '', time = 1.8, warn = false) { this.banner = { title, sub, t: time, max: time, warn }; }

  stageCleared() {
    const kind = this.stageKind;
    this.run.stage++;
    if (kind === 'wave') { sfx.clear(); }
    if (this.run.stage >= STAGES.length) return; // 지역 보스는 onBossDefeated에서 처리
    this.real.push({ t: 1.2, fn: () => this.startStage() });
  }

  // 제단을 마친 뒤 다음 지역
  nextRegion() {
    for (const it of this.items) if (it.kind !== 'fake') this.collect(it); // 남은 보상은 자동으로 챙긴다
    this.items = []; this.pendingLevels = 0;
    this.run.region++; this.run.stage = 0;
    this.eb = []; this.pb = []; this.hazards = []; this.overlays = [];
    this.startStage();
  }

  // ───────── 메인 업데이트 ─────────
  update(rdt) {
    if (this.paused || this.over) return;
    const active = isActive();
    let ts = active ? 1 : this.diff.slow;
    if (this.ultT > 0 && this.ultKind === 'beam') ts = Math.max(ts, 0.6);
    if (active && !this.wasActive && this.slowBoon === 'cg_slow') this.p.galeT = 2 * this.rr('cg_slow');
    this.wasActive = active;
    this.ts += (ts - this.ts) * Math.min(1, rdt * 10);
    const dt = rdt * this.ts;
    this.t += dt; this.scroll += dt * 70;

    this.movePlayer(rdt);
    this.real = this.real.filter(r => { r.t -= rdt; if (r.t <= 0) { r.fn(); return false; } return true; });
    this.updateStage(dt, rdt);
    this.playerFire(dt);
    this.updateWeapons(dt);
    this.updateBoonTimers(dt, active);
    this.updateObjs(dt);
    this.updatePB(dt);
    this.updateEnemies(dt);
    this.updateEB(dt);
    this.updateHazards(dt);
    this.updateItems(dt);
    this.updateFx(dt);
    if (this.ultT > 0) this.updateUlt(dt);

    if (input.ultPressed) { input.ultPressed = false; this.tryUlt(); }
    if (this.banner) { this.banner.t -= rdt; if (this.banner.t <= 0) this.banner = null; }
    if (this.vacuumT > 0) this.vacuumT -= rdt;
    this.shake = Math.max(0, this.shake - rdt * 20); this.flash = Math.max(0, this.flash - rdt * 2);

    this.hudT = (this.hudT || 0) - rdt;
    if (this.hudT <= 0) { this.hudT = 0.1; this.hooks.hud(); }
    if (this.pendingLevels > 0 && !this.paused) { this.pendingLevels--; this.hooks.levelUp(); }
  }

  movePlayer(rdt) {
    const p = this.p, d = consumeDrag(), k = keyAxis();
    const sp = p.slowDebuff > 0 ? 0.5 : 1;
    let mx = d.x * 1.15 * sp + k.x * 420 * rdt * sp, my = d.y * 1.15 * sp + k.y * 420 * rdt * sp;
    if (p.flipT > 0) mx = -mx;
    p.x = clamp(p.x + mx, 24, W - 24); p.y = clamp(p.y + my, 140, H - 40);
    if (this.pullForce) { p.x += this.pullForce.x * rdt; p.y += this.pullForce.y * rdt; this.pullForce = null; p.x = clamp(p.x, 24, W - 24); p.y = clamp(p.y, 140, H - 40); }
  }

  updateStage(dt, rdt) {
    if (this.stageKind === 'wave') {
      this.waveT += dt;
      while (this.queue.length && this.queue[0].t <= this.waveT) this.spawnGroup(this.queue.shift());
      if (!this.queue.length && !this.enemies.length && !this.objs.some(o => o.kind === 'spawnLater')) {
        this.clearTimer += rdt;
        if (this.clearTimer > 0.1 && !this.vacuumT) this.vacuumT = 1.2;
        if (this.clearTimer > 1.2 && !this.clearing) { this.clearing = true; this.stageCleared(); this.real.push({ t: 1.3, fn: () => { this.clearing = false; } }); }
      }
    } else if (this.pendingBoss) {
      this.introT -= rdt; // 경고 연출은 실제 시간
      if (this.introT <= 0) { this.spawnBoss(this.pendingBoss); this.pendingBoss = null; }
    }
  }

  // ───────── 플레이어 공격 ─────────
  fireInterval() {
    const f = this.ship.fire;
    let rate = f.rate * this.st.rate;
    if (this.has('cg_bullet')) rate *= 1 + 0.2 * this.rr('cg_bullet');
    if (this.p.galeT > 0) rate *= 2;
    if (this.evo('evo_main') && this.ship.id === 'byeolbit') rate *= 1.3;
    return 1 / rate;
  }

  baseDmg() { return this.ship.fire.dmg * (1 + (this.wl('main') - 1) * 0.2) * this.st.atk; }

  playerFire(dt) {
    const p = this.p;
    if (p.galeT > 0) p.galeT -= dt;
    this.fireT = (this.fireT || 0) + dt;
    const iv = this.fireInterval();
    if (this.fireT < iv) return;
    this.fireT = 0;
    const f = this.ship.fire, laser = f.kind === 'laser';
    let count = f.count + (this.run.pilot === 'chungnami' ? 1 : 0);
    const speed = f.speed * this.st.speed * (this.run.pilot === 'chungnami' ? 1.2 : 1);
    let size = this.st.size * (this.slowBoon === 'sh_slow' && !isActive() ? 1 + 0.5 * this.rr('sh_slow') : 1);
    const dmg = this.baseDmg() * (laser && this.evo('evo_main') ? 1.5 : 1);
    const pierce = f.pierce + (this.has('sh_bullet') ? (this.rr('sh_bullet') >= 2 ? 2 : 1) : 0);
    const angles = [];
    const spacing = laser ? 16 : 14;
    for (let i = 0; i < count; i++) angles.push({ a: 0, ox: (i - (count - 1) / 2) * spacing });
    if (this.has('cg_bullet')) angles.push({ a: -0.14, ox: -8 }, { a: 0.14, ox: 8 });
    if (this.evo('evo_main') && this.ship.id === 'byeolbit') angles.push({ a: -0.22, ox: -10 }, { a: 0.22, ox: 10 });
    p.shotN++;
    const beam = this.has('ta_bullet') && p.shotN % 5 === 0;
    for (const s of angles) {
      this.pb.push({ x: p.x + s.ox, y: p.y - 30, vx: Math.sin(s.a) * speed, vy: -Math.cos(s.a) * speed, dmg: beam ? dmg * 3 * this.rr('ta_bullet') : dmg,
        r: (laser ? 7 : 6) * size * (laser && this.evo('evo_main') ? 2 : 1), pierce: beam ? 99 : pierce, kind: beam ? 'beam' : laser ? 'laser' : 'bullet',
        elem: this.bulletElem, hit: new Set(), main: true });
    }
    sfx.shoot();
    // 드론호 드론
  }

  nearestEnemy(x, y, maxD = 1e9) {
    let best = null, bd = maxD * maxD;
    for (const e of this.enemies) { if (e.decoy || e.dying) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd && e.y > -20) { bd = d; best = e; } }
    return best;
  }

  homing(x, y, dmg, opts = {}) {
    const a = -Math.PI / 2 + rnd(-0.5, 0.5);
    this.pb.push({ x, y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, dmg, r: opts.r || 6, pierce: 0, kind: opts.kind || 'homing', homing: true, elem: opts.elem || null, hit: new Set(), explode: opts.explode, color: opts.color });
  }

  updateWeapons(dt) {
    const st = this.st, p = this.p, T = this.timers;
    const tick = (k, iv) => { T[k] = (T[k] || 0) + dt; if (T[k] >= iv) { T[k] = 0; return true; } return false; };
    // 드론호 드론
    if (this.ship.drones) {
      const n = this.ship.drones + (this.evo('evo_main') ? 2 : 0);
      if (tick('drone', 1 / (this.ship.droneRate * st.rate))) {
        for (let i = 0; i < n; i++) { const pos = this.dronePos(i, n); this.homing(pos.x, pos.y, this.ship.droneDmg * st.atk * (1 + (this.wl('main') - 1) * 0.2), { kind: 'drone' }); }
      }
    }
    if (this.wl('missile') && tick('missile', (2 - this.wl('missile') * 0.15) * st.cd)) {
      const n = this.wl('missile') * (this.evo('evo_missile') ? 2 : 1);
      for (let i = 0; i < n; i++) this.homing(p.x + (i - (n - 1) / 2) * 12, p.y - 10, 20 * st.atk, { kind: 'missile', r: 7, explode: this.evo('evo_missile') ? 50 : 0 });
    }
    if (this.wl('shotgun') && tick('shotgun', 1.6 * st.cd)) {
      const ev = this.evo('evo_shotgun'), n = ev ? 12 : 4 + this.wl('shotgun');
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * (ev ? 0.09 : 0.16); this.pb.push({ x: p.x, y: p.y - 20, vx: Math.cos(a) * 700 * st.speed, vy: Math.sin(a) * 700 * st.speed, dmg: 9 * st.atk, r: 6 * st.size, pierce: ev ? 1 : 0, kind: 'pellet', hit: new Set(), elem: null }); }
    }
    if (this.wl('bomb') && tick('bomb', 2.5 * st.cd)) {
      this.objs.push({ kind: 'bomb', x: p.x, y: p.y - 30, t: 0.8, vy: -320, r: (70 + this.wl('bomb') * 10) * st.area, dmg: (30 + this.wl('bomb') * 5) * st.atk, cluster: this.evo('evo_bomb') });
    }
    if (this.wl('boomerang') && tick('boomer', 2 * st.cd)) {
      const ev = this.evo('evo_boomerang'), n = ev ? 3 : 1;
      for (let i = 0; i < n; i++) this.objs.push({ kind: 'boomerang', x: p.x, y: p.y, vx: (i - (n - 1) / 2) * 160, vy: -650 * st.speed, t: 0, r: 18 * (ev ? 2 : 1) * st.size, dmg: (18 + this.wl('boomerang') * 6) * st.atk, hitCd: new Map() });
    }
  }

  dronePos(i, n) {
    const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
    return { x: this.p.x + side * (48 + row * 26), y: this.p.y + 10 + row * 22 };
  }

  // 회전체 목록 (위성 무기 + 궤도 가호)
  orbits() {
    const list = [], st = this.st, t = this.t;
    const add = (kind, n, rad, spd, dmg, opts = {}) => { for (let i = 0; i < n; i++) { const a = t * spd + i * Math.PI * 2 / n; list.push({ kind, x: this.p.x + Math.cos(a) * rad, y: this.p.y + Math.sin(a) * rad, dmg, r: opts.r || 14, ...opts }); } };
    if (this.wl('satellite')) { const ev = this.evo('evo_satellite'); add('sat', ev ? 6 : this.wl('satellite'), ev ? 84 : 62, 3, (ev ? 18 : 12) * st.atk); }
    if (this.has('gy_orbit')) add('gy_orbit', 2, 74, 2.4, 14 * this.rr('gy_orbit') * st.atk, { elem: 'shock', r: 15 });
    if (this.has('gg_orbit')) add('gg_orbit', 3, 96, -2, 12 * this.rr('gg_orbit') * st.atk, { elem: 'chill', r: 14 });
    if (this.has('sh_orbit')) add('sh_orbit', 1, 70, 1.6, 10 * this.rr('sh_orbit') * st.atk, { r: 26, absorb: true, elem: 'wave' });
    if (this.has('bj_orbit')) add('bj_orbit', 4, 84, 2.8, 10 * this.rr('bj_orbit') * st.atk, { elem: 'burn', r: 13 });
    if (this.has('cg_orbit')) add('cg_orbit', 1, 58, -3.4, 8 * this.rr('cg_orbit') * st.atk, { r: 22, push: true, elem: this.duo('duo_blizzard') ? 'chill' : null });
    if (this.has('ta_orbit')) add('ta_orbit', 2, 52, 2, 6 * st.atk, { r: 13, absorb: true });
    return list;
  }

  // ───────── 가호 타이머 ─────────
  updateBoonTimers(dt, active) {
    const p = this.p, T = this.timers, st = this.st;
    const tick = (k, iv) => { T[k] = (T[k] || 0) + dt; if (T[k] >= iv) { T[k] = 0; return true; } return false; };
    // 보호막 충전
    if (p.shields < this.maxShields) { p.shieldT += dt; if (p.shieldT >= 12) { p.shieldT = 0; p.shields++; } }
    if (this.has('gg_hit') && p.iceShell < 1) { p.iceT += dt; if (p.iceT >= 20 / this.rr('gg_hit')) { p.iceT = 0; p.iceShell = 1; } }
    p.inv -= dt; p.bubble -= dt; p.slowDebuff -= dt; p.flipT -= dt;

    if (this.has('gy_auto') && tick('gy', 4 * st.cd)) {
      let t = null; for (const e of this.enemies) if (!e.decoy && e.y > 0 && (!t || e.hp > t.hp)) t = e;
      if (t) this.strike(t.x, t.y, 60 * this.rr('gy_auto') * st.atk);
    }
    if (this.has('gg_auto') && tick('gg', 5 * st.cd)) {
      const t = pick(this.enemies.filter(e => e.y > 0 && !e.decoy));
      if (t) this.explode(t.x, t.y, 90 * st.area, 40 * this.rr('gg_auto') * st.atk, { elem: 'chill', stacks: 2, color: '#bfefff' });
    }
    if (this.has('sh_auto') && tick('sh', 6 * st.cd)) { this.objs.push({ kind: 'tide', y: H + 20, healed: false }); sfx.wave(); }
    if (this.has('bj_auto') && tick('bj', 7 * st.cd)) { const dir = Math.random() < 0.5 ? 1 : -1; this.objs.push({ kind: 'phoenix', x: dir > 0 ? -60 : W + 60, y: rnd(140, 520), dir, hit: new Set(), dmg: 50 * this.rr('bj_auto') * st.atk, big: false }); sfx.fire(); }
    if (this.has('cg_auto') && tick('cg', 6 * st.cd)) this.addTornado(rnd(80, W - 80), H - 200);
    if (this.has('ta_auto') && tick('ta', 8 * st.cd)) this.items.push({ kind: 'heart', x: rnd(60, W - 60), y: -20, vy: 90, v: 8 * this.rr('ta_auto') });

    // 슬로우 가호
    if (!active) {
      if (this.slowBoon === 'gy_slow' && tick('gys', 0.12)) this.hazards.push({ kind: 'spark', x: p.x, y: p.y, r: 22, t: 2, dmg: 12 * this.rr('gy_slow') * st.atk, mine: true, hitCd: new Map() });
      if (this.slowBoon === 'ta_slow') this.heal(this.maxHp * 0.01 * this.rr('ta_slow') * dt / this.ts, false);
    }
    // 전설
    if (this.run.legend && tick('legend', 15)) this.castLegend(this.run.legend);
    // 회전체 충돌
    for (const o of this.orbits()) {
      for (const e of this.enemies) {
        if (e.decoy || e.dying) continue;
        if (dist2(o, e) < (o.r + e.r) ** 2) {
          const k = o.kind; if ((e.hitCd[k] || 0) > this.t) continue;
          e.hitCd[k] = this.t + 0.3;
          this.damage(e, o.dmg, { elem: o.elem, src: k });
          if (o.push && !e.isBoss) { const a = Math.atan2(e.y - o.y, e.x - o.x); e.x += Math.cos(a) * 26; e.y += Math.sin(a) * 26; }
        }
      }
      if (o.absorb) this.eb = this.eb.filter(b => { if (dist2(o, b) < (o.r + b.r) ** 2) { this.spark(b.x, b.y, '#bfefff', 4); return false; } return true; });
    }
  }

  addTornado(x, y, big = 1) {
    const st = this.st;
    let r = 110 * st.area * big;
    if (this.duo('duo_typhoon')) r *= 1.5;
    if (this.duo('duo_firetornado')) r *= 1.4;
    this.objs.push({ kind: 'tornado', x, y, r, t: 4 * st.dur, dps: 14 * this.rr('cg_auto') * st.atk * (big > 1 ? 2 : 1) });
  }

  strike(x, y, dmg) {
    this.fx.push({ kind: 'bolt', x, y, t: 0.25 });
    this.explode(x, y, 46, dmg, { elem: 'shock', always: true, color: '#fff27a', silent: true });
    if (this.duo('duo_heaven')) this.hazards.push({ kind: 'pillar', x, y, r: 34, t: 2.5, used: false });
    sfx.zap();
  }

  castLegend(id) {
    const st = this.st;
    this.flash = 0.6; sfx.ult();
    if (id === 'leg_gyeryong') for (let i = 0; i < 10; i++) this.objs.push({ kind: 'later', t: i * 0.14, fn: () => { const e = pick(this.enemies.filter(x => !x.decoy && x.y > 0)); const x = e ? e.x : rnd(40, W - 40), y = e ? e.y : rnd(100, 600); this.strike(x, y, 80 * st.atk); } });
    if (id === 'leg_geumgang') for (const e of this.enemies) if (!e.decoy) { e.frozen = Math.max(e.frozen, 2 + st.elemDur); this.spark(e.x, e.y, '#bfefff', 6); }
    if (id === 'leg_seohae') { this.eb = []; for (const e of [...this.enemies]) this.damage(e, 60 * st.atk, { elem: 'wave' }); this.objs.push({ kind: 'tide', y: H + 20, healed: false, legend: true }); }
    if (id === 'leg_baekje') this.objs.push({ kind: 'phoenix', x: W / 2, y: 260, dir: 0, big: true, t: 3, hit: new Set(), dmg: 40 * st.atk });
    if (id === 'leg_chilgap') for (let i = 0; i < 4; i++) this.addTornado(80 + i * 127, H - 120 - i * 60, 1.6);
    if (id === 'leg_taean') { this.heal(this.maxHp * 0.3); this.p.inv = Math.max(this.p.inv, 3); }
    this.texts.push({ x: W / 2, y: 420, s: '전설! ' + ({ leg_gyeryong: '천둥 강림', leg_geumgang: '백년 빙하', leg_seohae: '대해일', leg_baekje: '금동 봉황', leg_chilgap: '칠갑 대폭풍', leg_taean: '꽃지 노을' })[id], t: 1.4, c: '#ffe14a', big: true });
  }

  // ───────── 오브젝트 (폭탄·부메랑·해일·불새·회오리·예약 실행) ─────────
  updateObjs(dt) {
    const list = this.objs; this.objs = [];
    for (const o of list) {
      let alive = true;
      switch (o.kind) {
        case 'spawnLater': case 'later': o.t -= dt; if (o.t <= 0) { o.fn(); alive = false; } break;
        case 'bomb': o.y += o.vy * dt; o.vy *= 0.97; o.t -= dt;
          if (o.t <= 0) { this.explode(o.x, o.y, o.r, o.dmg, { color: '#ffb23d' }); if (o.cluster) for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; this.objs.push({ kind: 'later', t: 0.2, fn: () => this.explode(o.x + Math.cos(a) * 70, o.y + Math.sin(a) * 70, 40, o.dmg * 0.5, { color: '#ffd27a', silent: true }) }); } alive = false; }
          break;
        case 'boomerang': {
          o.t += dt; const back = o.t > 0.6;
          if (back) { const a = Math.atan2(this.p.y - o.y, this.p.x - o.x); o.vx += Math.cos(a) * 2400 * dt; o.vy += Math.sin(a) * 2400 * dt; const sp = Math.hypot(o.vx, o.vy); if (sp > 800) { o.vx *= 800 / sp; o.vy *= 800 / sp; } if (dist2(o, this.p) < 900 || o.t > 3) alive = false; }
          else { o.vy *= 0.94; }
          o.x += o.vx * dt; o.y += o.vy * dt;
          for (const e of this.enemies) if (!e.decoy && dist2(o, e) < (o.r + e.r) ** 2 && (o.hitCd.get(e) || 0) < this.t) { o.hitCd.set(e, this.t + 0.25); this.damage(e, o.dmg, {}); }
          break;
        }
        case 'tide': {
          const prev = o.y; o.y -= 900 * dt;
          for (const e of [...this.enemies]) if (e.y <= prev && e.y > o.y) { this.damage(e, 30 * this.rr('sh_auto') * this.st.atk * (o.legend ? 0 : 1), { elem: this.duo('duo_storm') ? 'shock' : 'wave', always: true }); }
          this.eb = this.eb.filter(b => !(b.y <= prev && b.y > o.y));
          if (!o.healed && this.p.y <= prev && this.p.y > o.y && this.duo('duo_yunseul')) { o.healed = true; this.heal(5); }
          if (o.y < -40) alive = false;
          break;
        }
        case 'phoenix':
          if (o.big) { o.t -= dt; if ((o.acc = (o.acc || 0) + dt) > 0.3) { o.acc = 0; for (const e of [...this.enemies]) this.damage(e, o.dmg * 0.3, { elem: 'burn', always: true }); } if (o.t <= 0) alive = false; }
          else { o.x += o.dir * 700 * dt; for (const e of [...this.enemies]) if (!o.hit.has(e) && Math.abs(e.x - o.x) < 40 && Math.abs(e.y - o.y) < 60) { o.hit.add(e); this.damage(e, o.dmg, { elem: 'burn', always: true }); } if (o.x < -100 || o.x > W + 100) alive = false; }
          break;
        case 'tornado': {
          o.t -= dt; o.y -= 70 * dt;
          if (this.enemies.length) { const tgt = this.nearestEnemy(o.x, o.y, 400); if (tgt) o.x += Math.sign(tgt.x - o.x) * 60 * dt; }
          for (const e of [...this.enemies]) {
            if (e.decoy) continue;
            const d = Math.hypot(e.x - o.x, e.y - o.y);
            if (d < o.r) {
              if (!e.isBoss) { e.x += (o.x - e.x) * 2.5 * dt; e.y += (o.y - e.y) * 2.5 * dt; }
              e.tornT = (e.tornT || 0) - dt;
              if (e.tornT <= 0) { e.tornT = 0.25; this.damage(e, o.dps * 0.25, { elem: this.duo('duo_firetornado') ? 'burn' : this.duo('duo_blizzard') ? 'chill' : null, always: true, src: 'tornado' }); }
            }
          }
          if (o.t <= 0) alive = false;
          break;
        }
      }
      if (alive) this.objs.push(o); // 순회 중 새로 생긴 오브젝트도 this.objs에 그대로 쌓인다
    }
  }

  // ───────── 플레이어 탄 ─────────
  updatePB(dt) {
    const keep = [];
    for (const b of this.pb) {
      if (b.homing) {
        const t = this.nearestEnemy(b.x, b.y, 600);
        if (t) { const a = Math.atan2(t.y - b.y, t.x - b.x), sp = 520; b.vx += (Math.cos(a) * sp - b.vx) * Math.min(1, dt * 5); b.vy += (Math.sin(a) * sp - b.vy) * Math.min(1, dt * 5); }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let alive = b.y > -60 && b.y < H + 60 && b.x > -60 && b.x < W + 60;
      if (alive) for (const e of this.enemies) {
        if (e.dying || b.hit.has(e)) continue;
        const rr = (b.r + e.r) ** 2;
        const hitIt = (b.kind === 'laser' || b.kind === 'beam') ? (Math.abs(b.x - e.x) < b.r + e.r && Math.abs(b.y - e.y) < 30 + e.r) : dist2(b, e) < rr;
        if (!hitIt) continue;
        b.hit.add(e);
        if (e.decoy) { this.spark(b.x, b.y, '#fff', 3); alive = false; break; }
        this.damage(e, b.dmg, { elem: b.elem, src: b.main ? 'main' : b.kind, kb: b.main && this.has('sh_bullet') });
        if (b.explode) this.explode(b.x, b.y, b.explode * this.st.area, 15 * this.st.atk, { color: '#ffb23d', silent: true });
        if (b.pierce-- <= 0) { alive = false; break; }
      }
      if (alive) keep.push(b);
    }
    this.pb = keep;
  }

  // ───────── 피해·상태이상 ─────────
  damage(e, amt, o = {}) {
    if (e.dying || e.hp <= 0 || e.decoy) return;
    let dmg = amt;
    const elemental = o.elem && o.elem !== 'gale';
    if (elemental && (o.always || o.src !== 'main')) dmg *= this.st.elem;
    if (e.armor && !o.elem) dmg *= 0.8;
    let crit = false;
    if (this.st.crit && Math.random() < this.st.crit) { dmg *= 2; crit = true; }
    if (e.frozen > 0 && o.elem === 'shock' && this.duo('duo_icebolt')) dmg *= 2;
    e.hp -= dmg; e.flash = 0.08;
    if (e.isBoss) this.addGauge(0.03);
    if (dmg >= 30 || crit) this.texts.push({ x: e.x + rnd(-14, 14), y: e.y - e.r, s: '-' + Math.round(dmg), t: 0.7, c: crit ? '#ffe14a' : '#fff' });
    sfx.hit();
    // 상태이상
    if (o.elem) this.applyElem(e, o.elem, dmg, o);
    if (o.kb) this.knock(e, 14);
    if (e.hp <= 0) this.kill(e, o);
  }

  applyElem(e, elem, dmg, o) {
    const st = this.st;
    switch (elem) {
      case 'shock': {
        const chance = o.always ? 1 : 0.25 * this.rr('gy_bullet');
        if (o.src === 'chain' || Math.random() > chance) break;
        const near = this.enemies.filter(x => x !== e && !x.decoy && !x.dying && dist2(x, e) < 170 ** 2).sort((a, b) => dist2(a, e) - dist2(b, e)).slice(0, 2);
        for (const n of near) { this.fx.push({ kind: 'chain', x1: e.x, y1: e.y, x2: n.x, y2: n.y, t: 0.18 }); this.damage(n, dmg * 0.5, { elem: 'shock', src: 'chain' }); }
        if (e.burn > 0 && this.duo('duo_thunderfire') && !e.tfCd) { e.tfCd = 1; this.explode(e.x, e.y, 80, 40 * st.atk, { color: '#ff9a3c', silent: true }); }
        sfx.zap();
        break;
      }
      case 'chill': {
        e.chill += o.stacks || 1; e.chillT = 3;
        if (e.chill >= 3) { e.chill = 0; e.frozen = (1.5 * this.rr('gg_bullet') + st.elemDur) * (e.isBoss ? 0.4 : 1); sfx.ice(); }
        break;
      }
      case 'burn': e.burn = 3 + st.elemDur; e.burnDps = Math.max(e.burnDps, dmg * 0.3 * Math.max(this.rr('bj_bullet'), 1)); break;
      case 'wave': this.knock(e, this.duo('duo_typhoon') ? 28 : 14); break;
    }
    if (this.duo('duo_steam') && (e.chill > 0 || e.frozen > 0) && e.burn > 0 && !e.steamCd) {
      e.steamCd = 2; e.chill = 0; e.frozen = 0; e.burn = 0;
      this.explode(e.x, e.y, 100, 50 * st.atk, { color: '#ffffff', silent: true });
    }
  }

  knock(e, d) { if (!e.isBoss) e.y -= d * (this.duo('duo_typhoon') ? 2 : 1); }

  explode(x, y, r, dmg, o = {}) {
    this.fx.push({ kind: 'ring', x, y, r, t: 0.35, max: 0.35, c: o.color || '#ffb23d' });
    for (const e of [...this.enemies]) if (!e.decoy && dist2(e, { x, y }) < (r + e.r) ** 2) this.damage(e, dmg, { elem: o.elem, always: true, stacks: o.stacks });
    if (!o.silent) sfx.boom(r > 90);
  }

  kill(e, o) {
    e.hp = 0;
    if (e.isBoss) { this.bossDown(e); return; }
    this.enemies = this.enemies.filter(x => x !== e);
    this.run.kills++;
    this.addGauge(e.type === 'bug' ? 8 : 2);
    this.spark(e.x, e.y, ENEMIES[e.type].color, 14);
    sfx.boom(false);
    const xp = ENEMIES[e.type].xp;
    this.items.push({ kind: 'xp', x: e.x, y: e.y, v: xp, vy: 0 });
    if (Math.random() < 0.3) this.items.push({ kind: 'coin', x: e.x + rnd(-10, 10), y: e.y, v: 1, vy: 0 });
    if (ENEMIES[e.type].explode && this.diff.id !== 'sprout') this.ring(e.x, e.y, 6, 150, '#ff4d5e');
    if (e.burn > 0 && this.duo('duo_glowfire')) this.heal(1);
    if (!isActive() && this.slowBoon === 'bj_slow') this.explode(e.x, e.y, 80 * this.st.area, 30 * this.rr('bj_slow') * this.st.atk, { color: '#ff7a3d', silent: true });
  }

  bossDown(b) {
    b.dying = 1.6; b.hp = 0;
    this.eb = []; this.hazards = this.hazards.filter(h => h.mine); this.overlays = [];
    this.enemies.filter(e => !e.isBoss).forEach(e => { this.spark(e.x, e.y, '#fff', 8); });
    this.enemies = [b];
    this.addGauge(b.mid ? 30 : 0);
    this.flash = 0.8; this.shake = 12; sfx.boom(true);
    for (let i = 0; i < (b.mid ? 12 : 20); i++) this.items.push({ kind: 'coin', x: b.x + rnd(-60, 60), y: b.y + rnd(-40, 40), v: 1, vy: rnd(-200, -40) });
    for (let i = 0; i < 6; i++) this.items.push({ kind: 'xp', x: b.x + rnd(-60, 60), y: b.y + rnd(-40, 40), v: 5, vy: rnd(-150, -20) });
    this.run.kills++;
  }

  addGauge(n) { this.run.gauge = Math.min(100, this.run.gauge + n); }

  heal(n, text = true) {
    const before = this.run.hp;
    this.run.hp = Math.min(this.maxHp, this.run.hp + n);
    if (text && this.run.hp - before >= 1) this.texts.push({ x: this.p.x, y: this.p.y - 40, s: '+' + Math.round(this.run.hp - before), t: 0.8, c: '#2fd35b' });
  }

  // ───────── 적 ─────────
  updateEnemies(dt) {
    const p = this.p;
    for (const e of [...this.enemies]) {
      e.flash -= dt;
      if (e.steamCd) e.steamCd = Math.max(0, e.steamCd - dt);
      if (e.tfCd) e.tfCd = Math.max(0, e.tfCd - dt);
      if (e.chillT > 0) { e.chillT -= dt; if (e.chillT <= 0) e.chill = 0; }
      if (e.burn > 0) { e.burn -= dt; e.hp -= e.burnDps * dt; if (e.hp <= 0 && !e.dying) { this.kill(e, { elem: 'burn' }); continue; } }
      if (e.isBoss) { this.updateBoss(e, dt); continue; }
      if (e.decoy) { this.updateDecoy(e, dt); continue; }
      const slow = e.frozen > 0 ? 0 : 1 - Math.min(0.45, e.chill * 0.15);
      if (e.frozen > 0) e.frozen -= dt;
      const ed = ENEMIES[e.type], edt = dt * slow;
      e.t += edt;
      switch (ed.move) {
        case 'down': e.y += e.speed * edt; break;
        case 'dive':
          if (e.y < 220 && !e.dash) e.y += e.speed * 0.7 * edt;
          else { if (!e.dash) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.dash = { x: Math.cos(a), y: Math.sin(a) }; } e.x += e.dash.x * e.speed * 1.6 * edt; e.y += e.dash.y * e.speed * 1.6 * edt; }
          break;
        case 'sine': e.y += e.speed * edt; e.x = e.x0 + Math.sin(e.t * 2 + e.i) * 60; break;
        case 'snake': e.y += e.speed * edt; e.x = clamp(e.x0 + Math.sin(e.t * 3 + e.i * 0.6) * 110, 20, W - 20); break;
        case 'hover':
          if (e.y < e.ty && e.t < 9) e.y += e.speed * 1.5 * edt;
          else if (e.t < 9) e.x = clamp(e.x0 + Math.sin(e.t * 1.3 + e.i) * 90, 30, W - 30);
          else e.y += e.speed * 2 * edt;
          break;
      }
      if (ed.shoot && e.y > 30 && e.y < H * 0.7 && e.frozen <= 0) {
        e.shootT -= edt;
        if (e.shootT <= 0) { e.shootT = ed.shoot * rnd(0.8, 1.3); if (e.type === 'bug') this.fan(e.x, e.y, 3, 0.35, 190); else this.aim(e.x, e.y, 210); }
      }
      if (dist2(e, p) < (e.r * 0.8 + p.r) ** 2) { this.hurt(15); if (ed.explode) this.kill(e, {}); }
      if (e.y > H + 60 || e.x < -80 || e.x > W + 80) this.enemies = this.enemies.filter(x => x !== e);
    }
  }

  updateDecoy(e, dt) {
    e.t += dt; e.x = clamp(e.x0 + Math.sin(e.t * 1.4 + e.i * 2) * 90, 60, W - 60);
    e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 1.4; this.fan(e.x, e.y + 20, 5, 0.5, 200, '#d8a7ff'); }
    e.life -= dt; if (e.life <= 0) { this.enemies = this.enemies.filter(x => x !== e); this.spark(e.x, e.y, '#d8a7ff', 10); }
  }

  // ───────── 적 탄 ─────────
  ebSpeed() { let m = this.diff.bspd; if (!isActive() && this.slowBoon === 'gg_slow') m *= 1 - 0.3 * this.rr('gg_slow'); return m; }
  shot(x, y, a, sp, o = {}) { const s = sp * this.diff.bspd; this.eb.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: o.r || 8, c: o.c || '#ff3d5a', t: 0, ...o }); }
  aim(x, y, sp, o) { this.shot(x, y, Math.atan2(this.p.y - y, this.p.x - x), sp, o); }
  fan(x, y, n, spread, sp, c) { const base = Math.atan2(this.p.y - y, this.p.x - x); for (let i = 0; i < n; i++) this.shot(x, y, base + (i - (n - 1) / 2) * spread / Math.max(1, n - 1) * 2, sp, { c }); }
  ring(x, y, n, sp, c, off = 0) { for (let i = 0; i < n; i++) this.shot(x, y, off + i / n * Math.PI * 2, sp, { c }); }

  updateEB(dt) {
    const m = this.ebSpeed() / this.diff.bspd, p = this.p;
    const keep = [];
    for (const b of this.eb) {
      b.t += dt;
      if (b.burst && b.t >= b.burst) { this.ring(b.x, b.y, 8, 160, b.c); continue; }
      if (b.curve) { const a = Math.atan2(b.vy, b.vx) + b.curve * dt, s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; }
      if (b.grav) b.vy += b.grav * dt;
      b.x += b.vx * dt * m; b.y += b.vy * dt * m;
      if (dist2(b, p) < (b.r * 0.75 + p.r) ** 2) { this.hurt(b.dmg || 12); if (b.fake) p.slowDebuff = 3; continue; }
      if (b.y > -50 && b.y < H + 50 && b.x > -50 && b.x < W + 50) keep.push(b);
    }
    this.eb = keep;
  }

  updateHazards(dt) {
    const p = this.p;
    this.hazards = this.hazards.filter(h => {
      h.t -= dt;
      if (h.kind === 'spark') { for (const e of this.enemies) if (!e.decoy && dist2(h, e) < (h.r + e.r) ** 2 && (h.hitCd.get(e) || 0) < this.t) { h.hitCd.set(e, this.t + 0.3); this.damage(e, h.dmg, { elem: 'shock', src: 'chain' }); } }
      else if (h.kind === 'pillar') { if (!h.used && dist2(h, p) < (h.r + 20) ** 2) { h.used = true; if (p.shields < Math.max(1, this.maxShields)) p.shields++; sfx.shield(); this.texts.push({ x: p.x, y: p.y - 40, s: '보호막 +1', t: 0.8, c: '#bfefff' }); } }
      else if (h.kind === 'vine') { h.len = Math.min(h.max, (h.len || 0) + 900 * dt); if (h.t > 0.3 && Math.abs(p.x - h.x) < 16 + p.r && p.y > h.y && p.y < h.y + h.len) this.hurt(14); }
      else if (h.kind === 'beam') { if (h.warn > 0) h.warn -= dt; else if (Math.abs(p.x - h.x) < h.w / 2 + p.r && p.y > h.y) this.hurt(16); }
      return h.t > 0;
    });
    this.overlays = this.overlays.filter(o => (o.t -= dt) > 0);
  }

  hurt(n) {
    const p = this.p;
    if (p.inv > 0 || p.bubble > 0 || this.over) return;
    if (this.has('cg_hit') && Math.random() < Math.min(0.35, 0.15 * this.rr('cg_hit'))) { p.inv = 0.4; this.texts.push({ x: p.x, y: p.y - 40, s: '회피!', t: 0.6, c: '#6fdc6a' }); return; }
    if (p.shields > 0) { p.shields--; p.inv = 0.8; sfx.shield(); this.spark(p.x, p.y, '#bfefff', 12); return; }
    if (this.has('gg_hit') && p.iceShell > 0) { p.iceShell = 0; p.inv = 0.8; sfx.ice(); this.spark(p.x, p.y, '#bfefff', 12); return; }
    n *= 1 + this.run.region * 0.1;
    this.run.hp -= n; p.inv = 1; this.shake = 8; sfx.hurt();
    if (save.settings.vibe && navigator.vibrate) { try { navigator.vibrate(60); } catch { /* 무시 */ } }
    this.texts.push({ x: p.x, y: p.y - 40, s: '-' + Math.round(n), t: 0.7, c: '#ff5a72' });
    // 피격 반응 가호
    if (this.has('gy_hit')) this.explode(p.x, p.y, 200, 40 * this.rr('gy_hit') * this.st.atk, { elem: 'shock', color: '#fff27a' });
    if (this.has('sh_hit')) p.bubble = 3 * this.rr('sh_hit');
    if (this.has('bj_hit')) this.explode(p.x, p.y, 150, 60 * this.rr('bj_hit') * this.st.atk, { elem: 'burn', color: '#ff7a3d' });
    if (this.run.hp <= 0) {
      if (this.run.reviveLeft > 0) { this.run.reviveLeft--; this.run.hp = this.maxHp * 0.5; p.inv = 3; this.eb = []; this.showBanner('부활!', '한 번 더 힘내요', 1.5); sfx.levelup(); return; }
      this.run.hp = 0; this.over = true; sfx.over();
      this.objs = []; setTimeout(() => this.hooks.death(), 900);
    }
  }

  // ───────── 아이템 ─────────
  updateItems(dt) {
    const p = this.p, mag = this.st.magnet;
    this.items = this.items.filter(it => {
      if (it.kind === 'heart' || it.kind === 'fake') { it.y += (it.vy || 90) * dt; }
      else { it.vy = (it.vy || 0) + 400 * dt; it.y += Math.min(it.vy, 150) * dt; }
      const d2 = dist2(it, p);
      const pull = it.kind !== 'fake' && it.kind !== 'heart' && (d2 < mag * mag || this.vacuum || this.vacuumT > 0);
      if (pull) { const a = Math.atan2(p.y - it.y, p.x - it.x), sp = 700; it.x += Math.cos(a) * sp * dt; it.y += Math.sin(a) * sp * dt; }
      if (d2 < 30 * 30) { this.collect(it); return false; }
      return it.y < H + 30;
    });
  }

  collect(it) {
    const r = this.run;
    if (it.kind === 'xp') { r.xp += it.v; sfx.xp(); while (r.xp >= this.xpNeed()) { r.xp -= this.xpNeed(); r.level++; this.pendingLevels++; } }
    else if (it.kind === 'coin') { r.coins += it.v; sfx.coin(); }
    else if (it.kind === 'heart') { this.heal(it.v); sfx.pick(); }
    else if (it.kind === 'fake') { this.p.slowDebuff = 3; this.texts.push({ x: this.p.x, y: this.p.y - 40, s: '가짜 아이템! 느려짐', t: 1, c: '#ff8a3d' }); sfx.hurt(); }
  }
  xpNeed() { return 10 + this.run.level * 8; }

  // ───────── 필살기 ─────────
  tryUlt() {
    if (this.run.gauge < 100 || this.over || this.ultT > 0) return;
    this.run.gauge = 0; sfx.ult(); this.flash = 0.7;
    const st = this.st;
    if (this.ship.id === 'byeolbit') {
      this.eb = []; this.hazards = this.hazards.filter(h => h.mine);
      this.fx.push({ kind: 'ring', x: this.p.x, y: this.p.y, r: 900, t: 0.6, max: 0.6, c: '#bfe8ff' });
      for (const e of [...this.enemies]) this.damage(e, 120 * st.atk, {});
      this.ultT = 0.6; this.ultKind = 'wave';
    } else if (this.ship.id === 'drone') { this.ultT = 5; this.ultKind = 'drones'; }
    else { this.ultT = 3; this.ultKind = 'beam'; }
    this.hooks.hud();
  }

  updateUlt(dt) {
    this.ultT -= dt;
    const st = this.st;
    if (this.ultKind === 'drones') {
      this.timers.ud = (this.timers.ud || 0) + dt;
      if (this.timers.ud > 0.18) { this.timers.ud = 0; for (let i = 0; i < 6; i++) { const a = this.t * 3 + i * Math.PI / 3; this.homing(this.p.x + Math.cos(a) * 80, this.p.y + Math.sin(a) * 50, 14 * st.atk, { kind: 'drone' }); } }
    }
    if (this.ultKind === 'beam') {
      this.timers.ub = (this.timers.ub || 0) + dt;
      if (this.timers.ub > 0.1) { this.timers.ub = 0; for (const e of [...this.enemies]) if (!e.decoy && Math.abs(e.x - this.p.x) < 45 + e.r && e.y < this.p.y) this.damage(e, 16 * st.atk, {}); this.eb = this.eb.filter(b => !(Math.abs(b.x - this.p.x) < 45 && b.y < this.p.y)); }
    }
    if (this.ultT <= 0) this.ultKind = null;
  }

  // ───────── 보스 ─────────
  updateBoss(b, dt) {
    b.flash -= dt;
    if (b.dying) {
      b.dying -= dt / Math.max(0.3, this.ts); // 정화 연출은 슬로우와 상관없이 실제 시간으로
      if (Math.random() < 0.3) this.texts.push({ x: b.x + rnd(-60, 60), y: b.y + rnd(-40, 40), s: '♥', t: 0.8, c: '#ff8acb' });
      if (b.dying <= 0) {
        this.enemies = [];
        this.boss = null;
        this.vacuum = true;
        this.real.push({ t: 0.9, fn: () => { this.vacuum = false; this.hooks.bossDefeated(b.id, !b.mid); } });
      }
      return;
    }
    if (b.y < b.ty) { b.y += 120 * dt; return; }
    let bdt = dt;
    if (b.frozen > 0) { b.frozen -= dt; bdt = dt * 0.2; }
    b.t += bdt;
    const pat = b.patterns[b.pi];
    if (pat !== 'swipe') b.x = W / 2 + Math.sin(b.t * 0.6) * 120;
    b.pt += bdt;
    BOSS_PATTERNS[pat](this, b, bdt);
    if (b.pt > 5.5) { b.pt = 0; b.acc = 0; b.acc2 = 0; b.pi = (b.pi + 1) % b.patterns.length; b.sub = null; this.enemies.filter(e => e.decoy).forEach(e => { e.life = 0; }); }
    if (dist2(b, this.p) < (b.r * 0.8 + this.p.r) ** 2) this.hurt(20);
  }

  // ───────── 효과 ─────────
  spark(x, y, c, n) { for (let i = 0; i < n; i++) { const a = rnd(0, 7), s = rnd(60, 260); this.fx.push({ kind: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rnd(0.3, 0.6), c, r: rnd(2, 5) }); } }
  updateFx(dt) {
    this.fx = this.fx.filter(f => { f.t -= dt; if (f.kind === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.92; f.vy *= 0.92; } return f.t > 0; });
    this.texts = this.texts.filter(t => { t.t -= dt; t.y -= 40 * dt; return t.t > 0; });
    if (this.fx.length > 500) this.fx.splice(0, this.fx.length - 500);
  }
}

// ───────── 보스 패턴 ─────────
// 각 함수는 매 프레임 호출된다. b.pt는 패턴 시작 후 경과 시간, b.acc는 자유 누산기.
const every = (b, key, iv, dt) => { b[key] = (b[key] || 0) + dt; if (b[key] >= iv) { b[key] -= iv; return true; } return false; };

export const BOSS_PATTERNS = {
  // 레벨업 블랙홀
  pull(g, b, dt) {
    const a = Math.atan2(b.y - g.p.y, b.x - g.p.x);
    g.pullForce = { x: Math.cos(a) * 110, y: Math.sin(a) * 110 };
    if (every(b, 'acc', 1.1, dt)) g.ring(b.x, b.y, 14, 150, '#c9a7ff', b.t);
  },
  spiral(g, b, dt) { if (every(b, 'acc', 0.11, dt)) { b.acc2 = (b.acc2 || 0) + 0.32; g.shot(b.x, b.y, b.acc2, 190, { c: '#ffe14a' }); g.shot(b.x, b.y, b.acc2 + Math.PI, 190, { c: '#ffe14a' }); } },
  // 무한스크롤러
  wall(g, b, dt) {
    if (every(b, 'acc', 1.5, dt)) { const gap = rnd(80, W - 80); for (let x = 20; x < W; x += 34) if (Math.abs(x - gap) > 62) g.shot(x, b.y + 40, Math.PI / 2, 170, { c: '#ff5a8a', r: 9 }); }
  },
  summonNotify(g, b, dt) {
    if (every(b, 'acc', 1.4, dt)) { g.spawnEnemy('notify', b.x - 70, b.y + 30); g.spawnEnemy('notify', b.x + 70, b.y + 30); }
    if (every(b, 'acc2', 0.9, dt)) g.aim(b.x, b.y + 40, 200);
  },
  swipe(g, b, dt) {
    b.x = W / 2 + Math.sin(b.pt * 2.2) * 190;
    if (every(b, 'acc', 0.16, dt)) g.shot(b.x, b.y + 50, Math.PI / 2, 260, { c: '#ff5a8a' });
    if (b.pt < 0.2) g.shake = 6;
  },
  // 대필봇
  copyLine(g, b, dt) {
    if (every(b, 'acc', 1.0, dt)) { const a = Math.atan2(g.p.y - b.y, g.p.x - b.x); for (let i = 0; i < 5; i++) g.objs.push({ kind: 'later', t: i * 0.09, fn: () => g.shot(b.x, b.y + 30, a, 260, { c: '#f2f2f2', r: 9 }) }); }
  },
  summonClone(g, b, dt) {
    if (every(b, 'acc', 2.2, dt)) for (let i = 0; i < 3; i++) g.spawnEnemy('spam', b.x + (i - 1) * 70, b.y + 40, i);
    if (every(b, 'acc2', 0.8, dt)) g.fan(b.x, b.y, 3, 0.3, 190, '#f2f2f2');
  },
  // 딥페이커
  decoy(g, b, dt) {
    if (!b.sub) { b.sub = 1; for (const s of [-1, 1]) g.enemies.push({ decoy: true, boss: b.id, x: b.x + s * 140, x0: b.x + s * 140, y: b.y, r: b.r * 0.7, t: 0, i: s, shootT: 0.8, life: 5.2, hp: 1, hitCd: {} }); }
    if (every(b, 'acc', 1.4, dt)) g.fan(b.x, b.y + 30, 5, 0.5, 200, '#d8a7ff');
  },
  fan(g, b, dt) { if (every(b, 'acc', 0.9, dt)) { g.fan(b.x, b.y + 30, 9, 0.7, 200, '#d8a7ff'); } },
  flip(g, b, dt) {
    if (!b.sub) { b.sub = 1; g.p.flipT = 3; g.showBanner('좌우 반전!', '가짜에 속지 마세요', 1.2); }
    if (every(b, 'acc', 0.5, dt)) g.aim(b.x, b.y + 30, 170, { c: '#d8a7ff' });
  },
  // 악플 먹구름
  rain(g, b, dt) { if (every(b, 'acc', 0.09, dt)) g.shot(rnd(10, W - 10), b.y + 40, Math.PI / 2 + rnd(-0.15, 0.15), rnd(170, 240), { c: '#b06cff', r: 7 }); },
  zigzag(g, b, dt) {
    if (every(b, 'acc', 1.3, dt)) { const x = clamp(g.p.x + rnd(-40, 40), 30, W - 30); g.hazards.push({ kind: 'beam', x, y: b.y, w: 34, t: 1.4, warn: 0.7 }); }
  },
  // 따돌림 가시덩굴
  vine(g, b, dt) {
    if (every(b, 'acc', 1.6, dt)) { const x = rnd(110, W - 110); g.hazards.push({ kind: 'vine', x, y: b.y, max: H, t: 3.2 }); }
    if (every(b, 'acc2', 0.8, dt)) g.aim(b.x, b.y + 30, 180, { c: '#7ad16a' });
  },
  lockfruit(g, b, dt) { if (every(b, 'acc', 1.2, dt)) for (const s of [-1, 0, 1]) g.shot(b.x, b.y + 30, Math.PI / 2 + s * 0.5, 160, { c: '#ffd23d', r: 12, burst: 1.0 }); },
  aimed(g, b, dt) { if (every(b, 'acc', 0.7, dt)) g.fan(b.x, b.y + 30, 3, 0.2, 230); },
  // 잭팟 슬롯킹
  roulette(g, b, dt) {
    if (!b.sub || every(b, 'acc2', 2.6, dt)) { b.sub = pick(['spiral', 'fan', 'rain']); g.texts.push({ x: b.x, y: b.y - b.r - 10, s: '🎰 ' + ({ spiral: '나선', fan: '부채', rain: '소나기' })[b.sub], t: 1, c: '#ffe14a' }); }
    BOSS_PATTERNS[b.sub](g, b, dt);
  },
  coinshot(g, b, dt) { if (every(b, 'acc', 1.1, dt)) for (let i = 0; i < 14; i++) g.shot(b.x, b.y + 30, Math.PI / 2 + rnd(-0.9, 0.9), rnd(140, 260), { c: '#ffb23d', r: 8 }); },
  // 피싱 문어
  tentacle(g, b, dt) { if (every(b, 'acc', 1.2, dt)) for (let i = 0; i < 8; i++) g.shot(b.x, b.y, i / 8 * Math.PI * 2 + b.t, 160, { c: '#ff8a3d', curve: 0.9 }); },
  fakeitem(g, b, dt) {
    if (every(b, 'acc', 1.6, dt)) for (let i = 0; i < 2; i++) g.items.push({ kind: 'fake', x: rnd(60, W - 60), y: b.y, vy: 120 });
    if (every(b, 'acc2', 0.8, dt)) g.aim(b.x, b.y + 30, 190, { c: '#ff8a3d' });
  },
  ink(g, b, dt) {
    if (!b.sub) { b.sub = 1; for (let i = 0; i < 3; i++) g.overlays.push({ kind: 'ink', x: rnd(80, W - 80), y: rnd(300, 700), r: rnd(70, 110), t: 4.5 }); }
    if (every(b, 'acc', 0.6, dt)) g.aim(b.x, b.y + 30, 200, { c: '#ff8a3d' });
  },
  // 스모그 대왕
  fog(g, b, dt) {
    if (!b.sub) { b.sub = 1; for (let i = 0; i < 2; i++) g.overlays.push({ kind: 'fog', x: rnd(60, W - 60), y: rnd(320, 640), r: rnd(110, 150), t: 5 }); }
    if (every(b, 'acc', 1.0, dt)) g.ring(b.x, b.y, 12, 140, '#9aa3b5', b.t);
  },
  bottles(g, b, dt) { if (every(b, 'acc', 0.3, dt)) g.shot(rnd(20, W - 20), -10, Math.PI / 2, rnd(140, 220), { c: '#7ad1ff', r: 13, grav: 40 }); },
  // 폭주 AI 코어
  biasLaser(g, b, dt) {
    if (every(b, 'acc', 1.8, dt)) { const left = g.p.x < W / 2; g.hazards.push({ kind: 'beam', x: left ? W * 0.25 : W * 0.75, y: b.y, w: W * 0.36, t: 1.8, warn: 0.9 }); }
    if (every(b, 'acc2', 0.7, dt)) g.aim(b.x, b.y + 30, 210, { c: '#ff3d5a' });
  },
  dataStorm(g, b, dt) { if (every(b, 'acc', 0.08, dt)) { b.acc3 = (b.acc3 || 0) + 0.27; g.shot(b.x, b.y, b.acc3, 180, { c: '#3fe0c0', r: 7 }); g.shot(b.x, b.y, -b.acc3 * 1.3, 160, { c: '#ff3d5a', r: 7 }); } },
  chaos(g, b, dt) {
    if (!b.sub) b.sub = pick(['wall', 'rain', 'tentacle', 'coinshot', 'spiral', 'lockfruit']);
    BOSS_PATTERNS[b.sub](g, b, dt);
  },
};
