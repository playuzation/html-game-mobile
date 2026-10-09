// 진입점: DOM/캔버스/루프/UI 연결 (트리의 루트)
import { Game } from './game.js';
import { render } from './renderer.js';
import { bindInput } from './input.js';
import { setupShare } from './share.js';
import { COLS } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const ui = {
  score: $('score'),
  best: $('best'),
  start: $('start'),
  over: $('over'),
  final: $('final'),
  retry: $('retry'),
};

const BEST_KEY = 'crossy-best';
let best = 0;
try {
  best = Number(localStorage.getItem(BEST_KEY)) || 0;
} catch (e) {}

const game = new Game();
let W = 0;
let H = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function showHud() {
  ui.score.textContent = game.score;
  ui.best.textContent = 'BEST ' + best;
}

function restart() {
  game.reset();
  ui.over.hidden = true;
  ui.start.hidden = false;
  showHud();
}

game.onDeath = () => {
  if (navigator.vibrate) navigator.vibrate(120);
  if (game.score > best) {
    best = game.score;
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch (e) {}
  }
  setTimeout(() => {
    ui.final.textContent = game.score;
    ui.over.hidden = false;
    showHud();
  }, 700);
};

bindInput(canvas, (dir) => {
  if (!ui.over.hidden) return;
  ui.start.hidden = true;
  game.move(dir);
});
ui.retry.addEventListener('click', restart);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && !ui.over.hidden) restart();
});
window.addEventListener('resize', resize);
setupShare($('share'), $('qr'), $('share-url'));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt, H / (W / COLS));
  render(ctx, game, W, H, now / 1000);
  ui.score.textContent = game.score;
  requestAnimationFrame(frame);
}

resize();
showHud();
requestAnimationFrame(frame);
