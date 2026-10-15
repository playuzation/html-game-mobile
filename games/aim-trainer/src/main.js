// 진입점: 튜토리얼 단계 진행, HUD, 감도 설정, 결과 화면 (트리의 루트)
import { Session } from './session.js';
import { render } from './renderer.js';
import { bindInput } from './input.js';
import { DEG } from './math.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');
const FOV = 75 * DEG; // 세로 시야각

const state = { cam: { yaw: 0, pitch: 0 }, session: new Session(), effects: [], lastShot: -1, step: 'intro', turned: 0 };
const store = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem('aim-' + k)) ?? d;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('aim-' + k, JSON.stringify(v));
    } catch (e) {}
  },
};
let sens = store.get('sens', 1);
let best = store.get('best', null);

// ---------- 레이아웃 ----------
const view = { W: 0, H: 0, cx: 0, cy: 0, f: 1, top: 0 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.W = window.innerWidth;
  view.H = window.innerHeight;
  canvas.width = Math.round(view.W * dpr);
  canvas.height = Math.round(view.H * dpr);
  canvas.style.width = view.W + 'px';
  canvas.style.height = view.H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view.top = $('hud').offsetHeight;
  view.cx = view.W / 2;
  view.cy = view.top + (view.H - view.top) / 2;
  view.f = (view.H - view.top) / 2 / Math.tan(FOV / 2);
}
window.addEventListener('resize', resize);

// ---------- 입력 ----------
bindInput(
  { surface: canvas, fire: $('fire') },
  {
    onLook(dx, dy) {
      if (state.step === 'intro' || state.step === 'end') return;
      // 화면 높이 기준 감도: 드래그한 픽셀만큼 시야가 따라오도록
      const k = (FOV / (view.H - view.top)) * sens;
      state.cam.yaw += dx * k;
      state.cam.pitch = Math.max(-60 * DEG, Math.min(60 * DEG, state.cam.pitch - dy * k));
      if (state.step === 'look') {
        state.turned += Math.abs(dx * k) + Math.abs(dy * k);
        if (state.turned > 45 * DEG) goStep('shoot');
      }
    },
    onFire,
    onLockChange: lockHint,
  },
);

// 데스크톱(마우스)에서 잠금이 풀려 있으면 안내
function lockHint() {
  const mouse = window.matchMedia('(pointer: fine)').matches;
  const locked = document.pointerLockElement === canvas;
  $('lockhint').hidden = !mouse || locked || state.step === 'intro' || state.step === 'end';
}

function onFire() {
  if (state.step !== 'shoot' && state.step !== 'play') return;
  const now = performance.now() / 1000;
  state.lastShot = now;
  const r = state.session.shoot(state.cam.yaw, state.cam.pitch);
  if (!r) return;
  if (r.hit) {
    state.effects.push({ kind: 'burst', pos: r.target.pos, t: now });
    if (state.session.scored) state.effects.push({ kind: 'plus', t: now });
    if (navigator.vibrate) navigator.vibrate(20);
    if (state.step === 'shoot') goStep('ready');
  } else if (state.session.scored) state.effects.push({ kind: 'minus', t: now });
  hud();
}

// ---------- 튜토리얼 단계 ----------
const STEPS = {
  look: '① 화면을 드래그해서 시점을 돌려 보세요 (PC: 화면 클릭 후 마우스)',
  shoot: '② 조준선(+)을 과녁에 맞추고 FIRE! — 초록색이 되면 명중 위치',
  ready: '③ 준비 완료! 이제 과녁 4개가 나옵니다. 맞추면 +1, 빗나가면 -1',
};

function goStep(step) {
  state.step = step;
  $('coach').hidden = !STEPS[step];
  $('coach').textContent = STEPS[step] || '';
  if (step === 'look') {
    state.turned = 0;
    state.session = new Session({ maxTargets: 0, scored: false });
  }
  if (step === 'shoot') {
    state.session = new Session({ maxTargets: 1, scored: false });
    state.session.running = true;
    state.session.spawn(state.cam, { yaw: state.cam.yaw + 25 * DEG, pitch: 5 * DEG });
  }
  if (step === 'ready') setTimeout(() => state.step === 'ready' && startPlay(), 1800);
  hud();
}

function startPlay() {
  state.session = new Session({ maxTargets: 4 });
  state.session.start(state.cam);
  state.effects = [];
  state.step = 'play';
  $('coach').hidden = true;
  $('end').hidden = true;
  hud();
}

$('tutorial').addEventListener('click', () => {
  $('intro').hidden = true;
  state.cam = { yaw: 0, pitch: 0 };
  goStep('look');
});
$('skip').addEventListener('click', () => {
  $('intro').hidden = true;
  state.cam = { yaw: 0, pitch: 0 };
  startPlay();
});
$('again').addEventListener('click', startPlay);
$('stop').addEventListener('click', finish);

// ---------- 감도 ----------
const slider = $('sens');
slider.value = sens;
const showSens = () => ($('sens-val').textContent = `${Number(sens).toFixed(1)}x`);
slider.addEventListener('input', () => {
  sens = Number(slider.value);
  store.set('sens', sens);
  showSens();
});
showSens();

// ---------- HUD ----------
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
function hud() {
  const s = state.session;
  const play = state.step === 'play';
  $('score').textContent = play ? s.score : '-';
  $('score').classList.toggle('neg', play && s.score < 0);
  $('time').textContent = play ? fmt(s.time) : '0:00.0';
  $('avg').textContent = play && s.avgHit !== null ? `${s.avgHit.toFixed(2)}초` : '-';
  $('detail').textContent = play
    ? `명중 ${s.hits} · 빗나감 ${s.misses} · 정확도 ${s.accuracy === null ? '-' : Math.round(s.accuracy * 100) + '%'}`
    : '튜토리얼';
  $('stop').hidden = !play;
  lockHint();
}

function finish() {
  if (state.step !== 'play') return;
  const s = state.session;
  s.running = false;
  state.step = 'end';
  if (document.pointerLockElement) document.exitPointerLock();
  const rec = { score: s.score, avg: s.avgHit, acc: s.accuracy, time: s.time };
  const better = s.hits > 0 && (!best || s.score > best.score);
  if (better) {
    best = rec;
    store.set('best', rec);
  }
  $('res-score').textContent = s.score;
  $('res-rows').innerHTML = [
    ['플레이 시간', fmt(s.time)],
    ['과녁당 평균', s.avgHit === null ? '-' : `${s.avgHit.toFixed(2)}초`],
    ['가장 빠른 명중', s.hits ? `${s.best.toFixed(2)}초` : '-'],
    ['명중 / 빗나감', `${s.hits} / ${s.misses}`],
    ['정확도', s.accuracy === null ? '-' : `${Math.round(s.accuracy * 100)}%`],
  ]
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
    .join('');
  $('res-best').textContent = better ? '✨ 최고 점수 갱신!' : best ? `최고 점수 ${best.score}점` : '';
  $('end').hidden = false;
  hud();
}

// 탭을 벗어나면 시간이 흐르지 않게
document.addEventListener('visibilitychange', () => {
  last = performance.now();
});

// ---------- 루프 ----------
let last = performance.now();
let hudT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!document.hidden) state.session.update(dt);
  const t = now / 1000;
  state.effects = state.effects.filter((e) => t - e.t < 0.8);
  render(ctx, state, view, t);
  if ((hudT += dt) > 0.1) {
    hudT = 0;
    hud();
  }
  requestAnimationFrame(frame);
}

$('best').textContent = best ? `최고 점수 ${best.score}점 · 과녁당 ${best.avg ? best.avg.toFixed(2) + '초' : '-'}` : '';
resize();
hud();
requestAnimationFrame(frame);
