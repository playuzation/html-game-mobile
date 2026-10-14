// 진입점: 화면 배치·루프·HUD·조작키·강화 선택/결과 화면 (트리의 루트)
import { Game } from './game.js';
import { render, theme } from './renderer.js';
import { Input } from './input.js';
import { H } from './level.js';
import { FLOORS } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const input = new Input();
input.bindDpad($('dpad'));
input.bindButton($('btn-a'), 'a');
input.bindButton($('btn-b'), 'b');

let game = null;
const BEST_KEY = 'dungeon-dive-best';
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || null;
  } catch (e) {
    return null;
  }
};
let best = load();

// ---------- 조작키 토글 (터치 기기는 기본 표시) ----------
const PAD_KEY = 'dungeon-dive-pad';
let padOn = window.matchMedia('(pointer: coarse)').matches;
try {
  const saved = localStorage.getItem(PAD_KEY);
  if (saved !== null) padOn = saved === '1';
} catch (e) {}
function applyPad() {
  $('controls').hidden = !padOn;
  $('toggle').classList.toggle('on', padOn);
  resize();
}
$('toggle').addEventListener('click', () => {
  padOn = !padOn;
  try {
    localStorage.setItem(PAD_KEY, padOn ? '1' : '0');
  } catch (e) {}
  applyPad();
});

// ---------- 레이아웃 ----------
let W = 0;
let Hpx = 0;
const view = { x: 0, y: 0, s: 24, w: 0, h: 0 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  Hpx = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(Hpx * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = Hpx + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const top = $('hud').offsetHeight;
  const bottom = padOn && Hpx > W ? $('controls').offsetHeight : 0;
  const availH = Hpx - top - bottom;
  view.s = Math.max(10, Math.floor(Math.min(availH / H, W / 9)));
  view.h = view.s * H;
  view.w = W;
  view.x = 0;
  view.y = Math.round(top + (availH - view.h) / 2);
  $('msg').style.top = view.y + 26 + 'px';
}
window.addEventListener('resize', resize);

// ---------- 화면 전환 ----------
function show(id) {
  for (const s of ['start', 'pick', 'end']) $(s).hidden = s !== id;
}

function bestText() {
  return best ? `최고 기록: ${best.win ? '🏆 클리어' : best.floor + '층'} · 동전 ${best.coins}` : '아직 기록이 없어요';
}

function newRun() {
  game = new Game();
  input.clearPressed();
  show(null);
  hud();
}
$('go').addEventListener('click', newRun);
$('again').addEventListener('click', newRun);

function openPick() {
  $('pick-title').textContent = `${game.floor}층 돌파! 강화를 하나 고르세요`;
  $('choices').innerHTML = game.choices
    .map((u, i) => `<button type="button" data-i="${i}"><span class="ic">${u.icon}</span><b>${u.name}</b><small>${u.desc}</small></button>`)
    .join('');
  show('pick');
}
$('choices').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !game || game.state !== 'choose') return;
  game.choose(Number(b.dataset.i));
  input.clearPressed();
  show(null);
  hud();
});

function finish(win) {
  const rec = { floor: game.floor, coins: game.coins, kills: game.kills, win };
  const better = !best || (win && !best.win) || (win === best.win && (rec.floor > best.floor || (rec.floor === best.floor && rec.coins > best.coins)));
  if (better) {
    best = rec;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(rec));
    } catch (e) {}
  }
  $('end-icon').textContent = win ? '🏆' : '💀';
  $('end-title').textContent = win ? '던전 정복!' : `${game.floor}층에서 쓰러졌다`;
  const t = Math.floor(game.time);
  $('end-stats').innerHTML =
    `도달 <b>${game.floor}/${FLOORS}층</b> · 처치 <b>${game.kills}</b> · 동전 <b>${game.coins}</b><br>` +
    `시간 ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} · 강화 ${Object.values(game.stats.taken).reduce((a, b) => a + b, 0)}개` +
    (better ? '<br>✨ 새 최고 기록!' : '');
  $('end-best').textContent = bestText();
  setTimeout(() => show('end'), 700);
}

// ---------- HUD ----------
function hud() {
  if (!game) return;
  const s = game.stats;
  $('hearts').textContent = '❤️'.repeat(Math.max(0, s.hp)) + '🖤'.repeat(Math.max(0, s.maxHp - Math.max(0, s.hp)));
  $('floor').textContent = `${game.floor}/${FLOORS}층`;
  $('coins').textContent = `🪙 ${game.coins}`;
  $('kills').textContent = `⚔️ ${game.kills}`;
}

let msgTimer = null;
function toast(text) {
  $('msg').textContent = text;
  $('msg').hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => ($('msg').hidden = true), 1800);
}

// ---------- 루프 ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game) {
    game.update(dt, input);
    for (const ev of game.events.splice(0)) {
      if (ev.type === 'msg') toast(ev.text);
      if (ev.type === 'hurt' && navigator.vibrate) navigator.vibrate(60);
      if (ev.type === 'choose') openPick();
      if (ev.type === 'dead') finish(false);
      if (ev.type === 'win') finish(true);
    }
    hud();
    ctx.fillStyle = theme(game.floor).sky[0];
    ctx.fillRect(0, 0, W, Hpx);
    render(ctx, game, view, now / 1000);
  } else {
    ctx.fillStyle = '#120e22';
    ctx.fillRect(0, 0, W, Hpx);
  }
  requestAnimationFrame(frame);
}

$('start-best').textContent = bestText();
applyPad();
requestAnimationFrame(frame);
