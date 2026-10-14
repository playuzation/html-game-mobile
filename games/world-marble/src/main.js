// 진입점: 보드 그리기, 사람 입력, 컴퓨터 차례 진행, 말 이동 애니메이션 (트리의 루트)
import { MarbleGame } from './game.js';
import { decide, chooseTravel } from './ai.js';
import { TILES, SIZE, GROUP_COLORS, BUILD_NAMES, ownable, rent, upgradeCost, invested } from './board.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00'];
const ICONS = ['🐯', '🐰', '🐻', '🐶'];
const AI_NAMES = ['토끼', '곰', '멍멍이'];
const TILE_ICON = { start: '🏁', island: '🏝️', 'fund-get': '💰', space: '🚀', key: '🔑', 'fund-pay': '🧾' };
const BUILD_ICON = ['', '🏠', '🏢', '🏨'];
const STEP_MS = 110;
const AI_DELAY = 700;

let game = null;
let level = 'normal';
let aiCount = 2;
let rounds = 20;
let timer = null;
let busy = false; // 말이 움직이는 중
let shown = []; // 화면에 보이는 말 위치
let inspect = null;

// ---------- 설정 ----------
function bindChoices(id, onPick) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onPick(b.dataset.v);
  });
}
bindChoices('opt-count', (v) => (aiCount = Number(v)));
bindChoices('opt-rounds', (v) => (rounds = Number(v)));
bindChoices('opt-level', (v) => (level = v));
const openSetup = () => {
  clearTimeout(timer);
  $('result').hidden = true;
  $('setup').hidden = false;
};
$('restart').addEventListener('click', openSetup);
$('again').addEventListener('click', openSetup);
$('start').addEventListener('click', () => {
  clearTimeout(timer);
  game = new MarbleGame(['나', ...AI_NAMES.slice(0, aiCount)], { rounds });
  shown = game.players.map((p) => p.pos);
  busy = false;
  inspect = null;
  $('setup').hidden = true;
  buildBoard();
  render();
  schedule();
});

// ---------- 보드 ----------
function cellPos(i) {
  if (i <= 8) return [9, 9 - i];
  if (i <= 16) return [9 - (i - 8), 1];
  if (i <= 24) return [1, 1 + (i - 16)];
  return [1 + (i - 24), 9];
}

function buildBoard() {
  const board = $('board');
  board.querySelectorAll('.cell').forEach((c) => c.remove());
  TILES.forEach((t, i) => {
    const [r, c] = cellPos(i);
    const d = document.createElement('div');
    d.className = `cell ${t.type} ${i % 8 === 0 ? 'corner' : ''}`;
    d.style.gridArea = `${r} / ${c}`;
    d.dataset.i = i;
    if (t.type === 'city') d.style.setProperty('--g', GROUP_COLORS[t.group]);
    d.innerHTML = `<b class="band"></b><span class="ic">${TILE_ICON[t.type] || (t.type === 'tour' ? '✈️' : '')}</span>
      <span class="nm">${t.name}</span><span class="pr"></span><span class="tok"></span>`;
    board.appendChild(d);
  });
}

$('board').addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || !game || busy) return;
  const i = Number(cell.dataset.i);
  if (game.turn === 0 && game.phase === 'travel') {
    if (game.travel(i)) after();
    return;
  }
  inspect = i;
  render();
});

// ---------- 진행 ----------
function schedule() {
  clearTimeout(timer);
  if (busy) return;
  if (game.over) return showResult();
  if (game.turn === 0) return;
  timer = setTimeout(aiStep, AI_DELAY);
}

function aiStep() {
  const pi = game.turn;
  if (game.phase === 'roll') {
    game.roll();
    after();
  } else if (game.phase === 'travel') {
    game.travel(chooseTravel(game, pi, level));
    after();
  } else {
    game.decide(decide(game, pi, level));
    after();
  }
}

$('roll').addEventListener('click', () => {
  if (!game || busy || game.turn !== 0 || game.phase !== 'roll') return;
  inspect = null;
  game.roll();
  after();
});
$('yes').addEventListener('click', () => humanDecide(true));
$('no').addEventListener('click', () => humanDecide(false));
function humanDecide(yes) {
  if (!game || busy || game.turn !== 0 || !game.pending) return;
  game.decide(yes);
  after();
}

// 주사위로 움직였으면 한 칸씩 걸어가는 애니메이션 후 다음 진행
function after() {
  const w = game.walk;
  game.walk = null;
  if (!w) return sync();
  busy = true;
  let k = 0;
  const tick = () => {
    shown[w.pi] = (w.from + ++k) % SIZE;
    render();
    if (k < w.steps) timer = setTimeout(tick, STEP_MS);
    else {
      busy = false;
      sync();
    }
  };
  shown[w.pi] = w.from;
  render();
  timer = setTimeout(tick, STEP_MS);
}

function sync() {
  shown = game.players.map((p) => p.pos);
  render();
  schedule();
}

// ---------- 그리기 ----------
const won = (n) => `${n}만`;

function render() {
  const g = game;
  const rank = g.ranking();
  $('players').innerHTML = g.players
    .map((p, i) => {
      const r = rank.findIndex((x) => x.i === i) + 1;
      return `<div class="pl ${g.turn === i && !g.over ? 'turn' : ''} ${p.out ? 'out' : ''}" style="--c:${COLORS[i]}">
        <div class="nm">${ICONS[i]} ${p.name} <em>${p.out ? '파산' : r + '위'}</em></div>
        <div class="money">💵 ${won(p.cash)}</div><div class="asset">총자산 ${won(g.assets(i))}</div></div>`;
    })
    .join('');

  document.querySelectorAll('#board .cell').forEach((cell) => {
    const i = Number(cell.dataset.i);
    const o = g.owners[i];
    const owned = o.owner >= 0;
    cell.style.setProperty('--o', owned ? COLORS[o.owner] : 'transparent');
    cell.classList.toggle('owned', owned);
    cell.classList.toggle('pick', g.turn === 0 && g.phase === 'travel' && i !== 24 && !busy);
    cell.classList.toggle('here', shown[g.turn] === i && !g.over);
    const pr = cell.querySelector('.pr');
    if (ownable(i)) pr.textContent = owned ? BUILD_ICON[o.level] + won(rent(i, g.owners)) : won(TILES[i].price);
    else if (TILES[i].type === 'fund-get') pr.textContent = won(g.fund);
    cell.querySelector('.tok').innerHTML = g.players
      .map((p, k) => (!p.out && shown[k] === i ? `<i style="background:${COLORS[k]}">${ICONS[k]}</i>` : ''))
      .join('');
  });

  $('round').textContent = `라운드 ${g.round} / ${g.rounds}`;
  $('dice').textContent = g.dice ? `🎲 ${g.dice[0]} + ${g.dice[1]}` : '🎲';
  $('log').innerHTML = g.log.slice(-3).map((t) => `<div>${t}</div>`).join('');

  // 행동 영역
  const mine = g.turn === 0 && !g.over && !busy;
  $('roll').hidden = !(mine && g.phase === 'roll');
  $('roll').textContent = g.players[0].island ? '주사위 (더블이면 탈출)' : '주사위 굴리기';
  const ask = mine && g.pending;
  $('ask').hidden = !ask;
  if (ask) {
    const { tile, cost } = g.pending;
    const t = TILES[tile];
    const o = g.owners[tile];
    if (g.phase === 'buy') {
      const after = t.type === 'tour' ? Math.round(t.price * 0.5) : Math.round(t.price * 0.2);
      $('ask-text').innerHTML = `<b>${t.name}</b>을(를) ${won(cost)}에 살까요?<br><small>통행료 ${won(after)} · 남는 돈 ${won(g.players[0].cash - cost)}</small>`;
      $('yes').textContent = '구매';
    } else {
      $('ask-text').innerHTML = `<b>${t.name}</b>에 ${BUILD_NAMES[o.level + 1]}을(를) ${won(cost)}에 지을까요?<br><small>남는 돈 ${won(g.players[0].cash - cost)}</small>`;
      $('yes').textContent = '건설';
    }
  }
  $('hint').textContent = g.over
    ? ''
    : busy
      ? ''
      : g.turn === 0
        ? g.phase === 'travel'
          ? '🚀 우주여행! 갈 칸을 누르세요'
          : ''
        : `${g.current.name} 차례...`;

  // 칸 정보
  const info = $('info');
  if (inspect !== null && ownable(inspect)) {
    const t = TILES[inspect];
    const o = g.owners[inspect];
    const who = o.owner >= 0 ? `${g.players[o.owner].name} 소유 · ${t.type === 'city' ? BUILD_NAMES[o.level] : '관광지'}` : '주인 없음';
    const next = t.type === 'city' && o.owner >= 0 && o.level < 3 ? ` · 다음 건설 ${won(upgradeCost(inspect, o.level))}` : '';
    info.innerHTML = `<b>${t.name}</b> 땅값 ${won(t.price)}<br>${who}${o.owner >= 0 ? ` · 통행료 ${won(rent(inspect, g.owners))} · 가치 ${won(invested(inspect, o.level))}` : ''}${next}`;
    info.hidden = false;
  } else info.hidden = true;

  const card = g.card;
  $('card').hidden = !card;
  if (card) $('card').textContent = '🔑 ' + card.text;
}

function showResult() {
  const rank = game.ranking();
  const me = rank.findIndex((r) => r.i === 0) + 1;
  $('res-icon').textContent = me === 1 ? '🏆' : me === 2 ? '🥈' : me === 3 ? '🥉' : '😢';
  $('res-title').textContent = `${me}위!`;
  $('res-table').innerHTML = rank
    .map(
      (r, k) => `<tr class="${r.i === 0 ? 'me' : ''}"><td>${k + 1}</td><td>${ICONS[r.i]} ${r.name}</td>
      <td>${r.out ? '파산' : won(r.assets)}</td><td>${r.out ? '-' : won(r.cash)}</td></tr>`,
    )
    .join('');
  setTimeout(() => ($('result').hidden = false), 700);
}
