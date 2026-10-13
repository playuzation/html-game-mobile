// 진입점: 캔버스/레이아웃/루프/HUD/조작키 토글 연결 (트리의 루트)
import { Game } from './game.js';
import { render } from './renderer.js';
import { Input } from './input.js';
import { ROOMS, ITEMS, COLS, ROWS, STAR_COUNT, OPTIMAL_MOVES } from './rooms.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const ui = {
  hud: $('hud'),
  room: $('room'),
  moves: $('moves'),
  stars: $('stars'),
  tools: $('tools'),
  map: $('map'),
  msg: $('msg'),
  controls: $('controls'),
  toggle: $('toggle'),
  end: $('end'),
  endStats: $('end-stats'),
};

const game = new Game();
const input = new Input();
input.bindDpad($('dpad'));
input.bindButton($('btn-a'), 'a');
input.bindButton($('btn-b'), 'b');

// --- 조작키 토글 (선택은 기기에 기억) ---
const PAD_KEY = 'star-keeper-pad';
let padOn = false;
try {
  padOn = localStorage.getItem(PAD_KEY) === '1';
} catch (e) {}
function applyPad() {
  ui.controls.hidden = !padOn;
  ui.toggle.classList.toggle('on', padOn);
  ui.toggle.setAttribute('aria-pressed', String(padOn));
  resize();
}
ui.toggle.addEventListener('click', () => {
  padOn = !padOn;
  try {
    localStorage.setItem(PAD_KEY, padOn ? '1' : '0');
  } catch (e) {}
  applyPad();
});

// --- 레이아웃: 세로 화면에서는 조작키 영역을 비워 두고 방을 그 위에 맞춘다 ---
let W = 0;
let H = 0;
const view = { x: 0, y: 0, s: 16 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const top = ui.hud.offsetHeight + 8;
  const portrait = H > W;
  const bottom = padOn && portrait ? ui.controls.offsetHeight : 8;
  const availW = W - 16;
  const availH = H - top - bottom;
  view.s = Math.max(8, Math.floor(Math.min(availW / COLS, availH / ROWS)));
  view.x = Math.round((W - view.s * COLS) / 2);
  view.y = Math.round(top + (availH - view.s * ROWS) / 2);
  ui.msg.style.top = view.y + 6 + 'px';
  ui.msg.style.maxWidth = Math.min(view.s * COLS - 12, 560) + 'px';
}
window.addEventListener('resize', resize);

// --- HUD ---
ui.map.innerHTML = ROOMS.map(() => '<i></i>').join('');
const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function updateHud() {
  ui.room.textContent = `${game.ri + 1}. ${ROOMS[game.ri].name}`;
  ui.moves.textContent = `이동 ${game.moves}`;
  ui.stars.textContent = `⭐ ${game.stars}/${STAR_COUNT}`;
  ui.tools.textContent = ['p', 'j', 'w', 'u', 'x', 't'].filter((k) => game.inv.has(k)).map((k) => ITEMS[k].icon).join('');
  [...ui.map.children].forEach((el, i) => el.classList.toggle('here', i === game.ri));
}
let lastMsg = null;
function updateMsg() {
  const text = game.msg ? game.msg.text : '';
  if (text === lastMsg) return;
  lastMsg = text;
  ui.msg.textContent = text;
  ui.msg.hidden = !text;
}

game.onEvent = (e) => {
  if (e === 'die' && navigator.vibrate) navigator.vibrate(80);
  if (e === 'end') {
    ui.endStats.innerHTML =
      `방 이동 <b>${game.moves}</b>회 (최소 ${OPTIMAL_MOVES}회)<br>` +
      `시간 <b>${fmtTime(game.time)}</b> · 실패 <b>${game.deaths}</b>회`;
    setTimeout(() => (ui.end.hidden = false), 1200);
  }
  updateHud();
};

$('retry').addEventListener('click', () => {
  game.reset();
  ui.end.hidden = true;
  updateHud();
});

// --- 루프 ---
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt, input);
  render(ctx, game, view, W, H, now / 1000);
  updateMsg();
  requestAnimationFrame(frame);
}

applyPad();
updateHud();
requestAnimationFrame(frame);
