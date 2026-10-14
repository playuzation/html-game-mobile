// 진입점: 윷판(SVG) 그리기, 사람 입력, 컴퓨터 차례 진행 (트리의 루트)
import { YutGame, PIECES } from './game.js';
import { chooseMove } from './ai.js';
import { NODES, LINES, BIG, GOAL, nodeOf } from './board.js';
import { NAMES } from './yut.js';

const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const COLORS = ['#e8505b', '#3f8cff', '#2fbf71', '#f5a623'];
const ICONS = ['🐯', '🐰', '🐻', '🐶'];
const AI_NAMES = ['토끼', '곰', '멍멍이'];
const AI_DELAY = 750;

let game = null;
let level = 'normal';
let aiCount = 1;
let timer = null;
let selected = null; // 사람이 고른 결과 값

// ---------- 설정 ----------
function bindChoices(groupId, onPick) {
  $(groupId).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $(groupId).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onPick(b.dataset.v);
  });
}
bindChoices('opt-count', (v) => (aiCount = Number(v)));
bindChoices('opt-level', (v) => (level = v));
const openSetup = () => {
  clearTimeout(timer);
  $('result').hidden = true;
  $('setup').hidden = false;
};
$('again').addEventListener('click', openSetup);
$('restart').addEventListener('click', openSetup);
$('start').addEventListener('click', () => {
  clearTimeout(timer);
  game = new YutGame(['나', ...AI_NAMES.slice(0, aiCount)]);
  selected = null;
  $('setup').hidden = true;
  drawBoardBase();
  render();
  schedule();
});

// ---------- 진행 ----------
function schedule() {
  clearTimeout(timer);
  if (game.over) return showResult();
  if (game.turn === 0) return;
  timer = setTimeout(() => {
    if (game.phase === 'throw') {
      game.throw();
      animateSticks();
    } else {
      const m = chooseMove(game, game.turn, level);
      if (m) game.move(game.turn, m.v, m.key);
    }
    render();
    schedule();
  }, AI_DELAY);
}

$('throw').addEventListener('click', () => {
  if (!game || game.turn !== 0 || game.phase !== 'throw') return;
  game.throw();
  animateSticks();
  selected = null;
  render();
  schedule();
});

function humanMove(key) {
  if (!game || game.turn !== 0 || game.phase !== 'move') return;
  const v = currentValue();
  if (game.move(0, v, key)) {
    selected = null;
    render();
    schedule();
  }
}

// 고른 결과가 없거나 더 이상 쓸 수 없으면 첫 번째 결과
function currentValue() {
  const usable = new Set(game.options(0).map((o) => o.v));
  if (selected === null || !usable.has(selected)) selected = game.pending.find((v) => usable.has(v)) ?? null;
  return selected;
}

// ---------- 그리기 ----------
const el = (tag, attrs, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const P = (node) => NODES[node].map((v) => 8 + v * 0.84);

function drawBoardBase() {
  const base = $('base');
  base.innerHTML = '';
  for (const [a, b] of LINES) {
    const [x1, y1] = P(a);
    const [x2, y2] = P(b);
    el('line', { x1, y1, x2, y2, class: 'ln' }, base);
  }
  for (const n in NODES) {
    const [cx, cy] = P(n);
    el('circle', { cx, cy, r: BIG.has(n) ? 5.2 : 3.4, class: BIG.has(n) ? 'nd big' : 'nd' }, base);
  }
  const [sx, sy] = P('o0');
  const t = el('text', { x: sx - 14, y: sy + 6.5, class: 'lbl' }, base);
  t.textContent = '출발·도착';
}

function render() {
  const g = game;
  const myMove = g.turn === 0 && g.phase === 'move' && !g.over;
  const v = myMove ? currentValue() : null;
  const opts = myMove ? g.options(0).filter((o) => o.v === v) : [];
  const movable = new Map(opts.map((o) => [o.key, o]));

  // 플레이어 줄
  $('players').innerHTML = g.players
    .map((p, i) => {
      const wait = g.waiting(p).length;
      const done = g.done(p);
      const tokens = Array.from({ length: PIECES }, (_, k) =>
        `<i class="${k < done ? 'done' : k < done + wait ? 'wait' : 'on'}" style="--c:${COLORS[i]}"></i>`,
      ).join('');
      return `<div class="pl ${g.turn === i && !g.over ? 'turn' : ''}">
        <div class="nm">${ICONS[i]} ${p.name}</div><div class="tk">${tokens}</div></div>`;
    })
    .join('');

  // 말
  const layer = $('pieces');
  layer.innerHTML = '';
  const groups = new Map();
  g.players.forEach((p, i) =>
    p.pieces.forEach((q) => {
      const n = nodeOf(q.path);
      if (!n || n === GOAL) return;
      if (!groups.has(n)) groups.set(n, { i, count: 0 });
      groups.get(n).count++;
    }),
  );
  if (g.lastMove && g.lastMove.dest !== GOAL) {
    const [x, y] = P(g.lastMove.dest);
    el('circle', { cx: x, cy: y, r: 8, class: 'last' }, layer);
  }
  // 이동할 곳 미리보기
  for (const o of opts) {
    if (o.dest === GOAL) continue;
    const [x, y] = P(o.dest);
    const ghost = el('circle', { cx: x, cy: y, r: 6.5, class: 'ghost' }, layer);
    ghost.addEventListener('click', () => humanMove(o.key));
  }
  for (const [n, { i, count }] of groups) {
    const [x, y] = P(n);
    const gEl = el('g', { class: 'pc' + (i === 0 ? (movable.has(n) ? ' can' : '') : ' opp') }, layer);
    el('circle', { cx: x, cy: y, r: 5.6, fill: COLORS[i] }, gEl);
    const t = el('text', { x, y: y + 2.2, class: 'ic' }, gEl);
    t.textContent = ICONS[i];
    if (count > 1) {
      el('circle', { cx: x + 4.6, cy: y - 4.6, r: 3, class: 'bd' }, gEl);
      const c = el('text', { x: x + 4.6, y: y - 3.4, class: 'bdt' }, gEl);
      c.textContent = count;
    }
    if (i === 0) gEl.addEventListener('click', () => movable.has(n) && humanMove(n));
  }

  // 아래 패널
  const home = $('home');
  const homeOpt = movable.get('home');
  home.hidden = !homeOpt;
  if (homeOpt) home.textContent = `새 말 내보내기 → ${NAMES[v]}`;
  $('throw').disabled = !(g.turn === 0 && g.phase === 'throw' && !g.over);
  $('pending').innerHTML = g.pending
    .map((pv, k) => `<button type="button" data-k="${k}" class="${myMove && pv === v ? 'on' : ''}">${NAMES[pv]}</button>`)
    .join('');
  const goalOpt = opts.find((o) => o.dest === GOAL);
  $('goal').hidden = !goalOpt;
  if (goalOpt) $('goal').dataset.key = goalOpt.key;
  $('status').textContent = g.over
    ? ''
    : g.turn === 0
      ? g.phase === 'throw'
        ? g.pending.length
          ? '한 번 더! 윷을 던지세요'
          : '내 차례 — 윷을 던지세요'
        : `${NAMES[v]}(으)로 움직일 말을 누르세요`
      : `${g.current.name} 차례...`;
  $('log').textContent = g.log[g.log.length - 1] || '';
}

$('pending').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !game || game.turn !== 0 || game.phase !== 'move') return;
  selected = game.pending[Number(b.dataset.k)];
  render();
});
$('home').addEventListener('click', () => humanMove('home'));
$('goal').addEventListener('click', (e) => humanMove(e.currentTarget.dataset.key));

function animateSticks() {
  const r = game.lastThrow;
  const box = $('sticks');
  box.innerHTML = r.sticks.map((flat, k) => `<i class="${flat ? 'flat' : 'round'} ${k === 0 ? 'mark' : ''}"></i>`).join('');
  box.classList.remove('roll');
  void box.offsetWidth;
  box.classList.add('roll');
  const big = $('big');
  big.textContent = NAMES[r.value] + (r.value >= 4 ? '!' : '');
  big.classList.remove('show');
  void big.offsetWidth;
  big.classList.add('show');
}

function showResult() {
  const win = game.winner === 0;
  $('res-icon').textContent = win ? '🏆' : game.winner === null ? '🤝' : '😢';
  $('res-title').textContent = win ? '승리!' : game.winner === null ? '무승부' : `${game.players[game.winner].name} 승리`;
  $('res-sub').textContent = `완주한 내 말 ${game.done(game.players[0])}/${PIECES}`;
  setTimeout(() => ($('result').hidden = false), 900);
}
