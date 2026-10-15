// 진입점: 화면 배치·루프·계기판·버튼 연결 (트리의 루트)
import { Sim } from './sim.js';
import { render } from './renderer.js';
import { Controls } from './controls.js';
import { RPM } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');
let sim = new Sim();
const opts = { rotate: true, input: { throttle: 0, brake: 0, steer: 0 } };

const controls = new Controls(
  { wheel: $('wheel'), gas: $('gas'), brake: $('brake'), gears: $('gears') },
  (g) => {
    if (!sim.car.shift(g)) toast('정지한 뒤에 바꿀 수 있어요 (브레이크!)');
    gearUi();
  },
);

function gearUi() {
  $('gears').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.g === sim.car.gear));
}

$('cam').addEventListener('click', () => {
  opts.rotate = !opts.rotate;
  $('cam').textContent = opts.rotate ? '🧭 차량 기준' : '🧭 북쪽 고정';
});
$('reset').addEventListener('click', () => {
  sim.resetCar();
  sim.resetCones();
  gearUi();
  toast('출발 위치로 돌아왔어요');
});

// ---------- 레이아웃 ----------
let W = 0;
let H = 0;
const view = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, W: 0, H: 0 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const top = $('top').offsetHeight;
  const bottom = H > W ? $('panel').offsetHeight : 0;
  Object.assign(view, { x: 0, y: top, w: W, h: H - top - bottom, W, H });
  view.cx = W / 2;
  view.cy = top + view.h / 2;
}
window.addEventListener('resize', resize);

let toastTimer = null;
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), 1800);
}

// ---------- 계기판 ----------
function dash() {
  const c = sim.car;
  $('speed').textContent = Math.round(c.speedKmh);
  $('gear').textContent = c.gear === 'D' ? `D${c.autoGear}` : c.gear;
  $('rpm-bar').style.width = `${Math.min(100, (c.rpm / RPM.MAX) * 100)}%`;
  $('rpm-bar').classList.toggle('red', c.rpm > RPM.SHIFT);
  $('rpm').textContent = `${(c.rpm / 1000).toFixed(1)}k rpm`;
  $('odo').textContent = `${(c.odo / 1000).toFixed(2)} km`;
  $('stats').textContent = `🅿️ ${sim.parked} · 💥 ${sim.crashes} · 🔶 ${sim.coneHits}`;
  $('wheel').style.transform = `rotate(${controls.wheelDeg}deg)`;
  const hint = sim.inSpot && sim.car.gear !== 'P' ? (Math.abs(sim.car.v) > 0.05 ? '칸 안에 들어왔어요! 멈추세요' : 'P 로 바꾸면 주차 완료') : '';
  $('hint').textContent = hint;
  $('hint').hidden = !hint;
}

// ---------- 루프 ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  opts.input = controls.read(dt);
  sim.update(dt, opts.input);
  for (const ev of sim.events.splice(0)) {
    if (ev.type === 'crash') {
      toast(`💥 충돌! (${Math.round(ev.impact * 3.6)} km/h)`);
      if (navigator.vibrate) navigator.vibrate(Math.min(200, ev.impact * 15));
    }
    if (ev.type === 'parked') toast(`🅿️ 주차 성공! ${ev.time.toFixed(1)}초 — 다음 칸으로`);
  }
  render(ctx, sim, view, opts, now / 1000);
  dash();
  requestAnimationFrame(frame);
}

resize();
gearUi();
toast('기어를 D 로 바꾸고 가속 페달을 밟아 보세요');
requestAnimationFrame(frame);
