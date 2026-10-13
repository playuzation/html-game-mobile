// 진입점: 화면 그리기, 사람 입력, 컴퓨터 차례 진행, 원카드 외치기 타이머 (트리의 루트)
import { OneCardGame } from './game.js';
import { chooseMove, bestSuit } from './ai.js';
import { canPlay } from './rules.js';
import { SUITS, SUIT_SYMBOL, SUIT_NAME, isRed, isJoker } from './cards.js';

const $ = (id) => document.getElementById(id);
const AI_NAMES = ['루나', '토토', '모모'];
const AI_DELAY = 850;
const ONE_CARD_LIMIT = 3000; // 사람이 원카드를 외쳐야 하는 시간
const REACT = { easy: [1400, 3200], normal: [500, 1500] }; // 컴퓨터가 원카드를 외치는 반응 시간

let game = null;
let level = 'normal';
let aiCount = 2;
let aiTimer = null;
let oneTimer = null;
let oneKey = null;

// ---------- 설정 화면 ----------
function bindChoices(groupId, onPick) {
  const group = $(groupId);
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    group.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onPick(b.dataset.v);
  });
}
bindChoices('opt-count', (v) => (aiCount = Number(v)));
bindChoices('opt-level', (v) => (level = v));
$('start').addEventListener('click', start);
const openSetup = () => {
  clearTimeout(aiTimer);
  clearTimeout(oneTimer);
  $('result').hidden = true;
  $('setup').hidden = false;
};
$('again').addEventListener('click', openSetup);
$('restart').addEventListener('click', openSetup);

function start() {
  clearTimeout(aiTimer);
  clearTimeout(oneTimer);
  oneKey = null;
  game = new OneCardGame(['나', ...AI_NAMES.slice(0, aiCount)]);
  $('setup').hidden = true;
  $('result').hidden = true;
  render();
  schedule();
}

// ---------- 진행 ----------
function schedule() {
  clearTimeout(aiTimer);
  watchOneCard();
  if (game.over) return showResult();
  if (game.turn !== 0) aiTimer = setTimeout(aiTurn, AI_DELAY);
}

function aiTurn() {
  const pi = game.turn;
  const move = chooseMove(game, pi, level);
  if (move) game.play(pi, move.card.id, move.suit);
  else game.draw(pi);
  render();
  schedule();
}

function humanPlay(card) {
  if (game.over || game.turn !== 0 || !canPlay(card, game.state)) return;
  if (card.rank === '7') return pickSuit(card);
  game.play(0, card.id);
  render();
  schedule();
}

function humanDraw() {
  if (game.over || game.turn !== 0) return;
  game.draw(0);
  render();
  schedule();
}

function pickSuit(card) {
  const box = $('suits');
  box.innerHTML = SUITS.map(
    (s) => `<button data-s="${s}" class="${s === 'H' || s === 'D' ? 'red' : ''}">${SUIT_SYMBOL[s]}<small>${SUIT_NAME[s]}</small></button>`,
  ).join('');
  const rec = bestSuit(game.players[0].hand.filter((c) => c !== card));
  box.querySelector(`[data-s="${rec}"]`).classList.add('rec');
  $('suit-pick').hidden = false;
  box.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('suit-pick').hidden = true;
    game.play(0, card.id, b.dataset.s);
    render();
    schedule();
  };
}
$('suit-cancel').addEventListener('click', () => ($('suit-pick').hidden = true));

// ---------- 원카드 외치기 ----------
function watchOneCard() {
  const target = game.oneCard;
  const key = target === null ? null : `${target}:${game.log.length}`;
  if (key === oneKey) return;
  clearTimeout(oneTimer);
  oneKey = key;
  renderOneButton();
  if (target === null) return;

  if (target === 0) {
    // 사람이 제때 못 외치면 컴퓨터가 먼저 외친다
    oneTimer = setTimeout(() => resolveOne(firstAi()), ONE_CARD_LIMIT);
  } else {
    const [a, b] = REACT[level];
    oneTimer = setTimeout(() => resolveOne(target), a + Math.random() * (b - a));
  }
}

function firstAi() {
  return game.players.findIndex((p, i) => i > 0 && !p.out);
}

function resolveOne(caller) {
  if (game.oneCard === null) return;
  const res = game.declare(caller);
  if (caller === 0) toast(res === 'safe' ? '📣 원카드!' : '🎯 먼저 외쳤다! 상대 +1장');
  else if (res === 'caught') toast('😵 늦었다! +1장');
  oneKey = null;
  render();
  schedule();
}
$('one').addEventListener('click', () => resolveOne(0));

function renderOneButton() {
  const btn = $('one');
  const t = game && !game.over ? game.oneCard : null;
  btn.hidden = t === null;
  btn.classList.toggle('mine', t === 0);
  btn.querySelector('small').textContent = t === 0 ? '빨리 외치세요!' : `${game?.players[t]?.name ?? ''}보다 먼저!`;
}

// ---------- 그리기 ----------
function cardHtml(c, extra = '') {
  if (isJoker(c)) {
    return `<div class="card joker ${c.rank === 'CJ' ? 'red' : ''} ${extra}"><span class="rk">JOKER</span><span class="big">🃏</span></div>`;
  }
  const s = SUIT_SYMBOL[c.suit];
  return `<div class="card ${isRed(c) ? 'red' : ''} ${extra}"><span class="rk">${c.rank}<br>${s}</span><span class="big">${s}</span></div>`;
}

function render() {
  const g = game;
  // 상대
  $('opps').innerHTML = g.players
    .slice(1)
    .map((p, k) => {
      const i = k + 1;
      const backs = Array.from({ length: Math.min(p.hand.length, 12) }, () => '<i></i>').join('');
      return `<div class="opp ${g.turn === i && !g.over ? 'turn' : ''} ${p.out ? 'out' : ''}">
        <div class="avatar">${['🦊', '🐻', '🐰'][k]}</div>
        <div class="name">${p.name}</div>
        <div class="backs">${backs}</div>
        <div class="cnt">${p.out ? '파산' : p.hand.length + '장'}</div>
      </div>`;
    })
    .join('');

  // 중앙
  $('pile').innerHTML = cardHtml(g.top, 'top');
  $('deck-count').textContent = g.deck.length;
  $('dir').textContent = g.dir > 0 ? '⟳' : '⟲';
  const chips = [];
  if (g.suit) chips.push(`<span class="chip ${g.suit === 'H' || g.suit === 'D' ? 'red' : ''}">${SUIT_SYMBOL[g.suit]} 지정</span>`);
  if (g.penalty) chips.push(`<span class="chip atk">공격 +${g.penalty}</span>`);
  $('chips').innerHTML = chips.join('');
  $('log').textContent = g.log[g.log.length - 1] || '';

  // 내 패
  const me = g.players[0];
  const myTurn = g.turn === 0 && !g.over;
  const hand = $('hand');
  const cw = 62;
  const avail = hand.clientWidth - 16;
  const gap = me.hand.length > 1 ? Math.min(6, (avail - cw) / (me.hand.length - 1) - cw) : 0;
  hand.style.setProperty('--gap', gap + 'px');
  hand.innerHTML = sortHand(me.hand)
    .map((c) => cardHtml(c, myTurn && canPlay(c, g.state) ? 'legal' : myTurn ? 'dim' : '').replace('<div', `<div data-id="${c.id}"`))
    .join('');

  const legal = myTurn ? g.legal(0).length : 0;
  $('deck').classList.toggle('active', myTurn);
  $('status').textContent = g.over
    ? ''
    : myTurn
      ? g.penalty
        ? legal
          ? `공격 +${g.penalty}! 공격 카드로 막거나 덱을 눌러 받기`
          : `막을 카드가 없어요 — 덱을 눌러 ${g.penalty}장 받기`
        : legal
          ? '내 차례 — 밝은 카드를 내거나 덱에서 뽑기'
          : '낼 카드가 없어요 — 덱을 눌러 한 장 뽑기'
      : `${g.current.name} 차례...`;
  $('me-cnt').textContent = `${me.hand.length}장`;
  $('me').classList.toggle('turn', myTurn);
  renderOneButton();
}

const ORDER = Object.fromEntries(SUITS.map((s, i) => [s, i]));
const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function sortHand(hand) {
  return [...hand].sort((a, b) => {
    if (isJoker(a) || isJoker(b)) return isJoker(a) - isJoker(b);
    return ORDER[a.suit] - ORDER[b.suit] || RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
  });
}

$('hand').addEventListener('click', (e) => {
  const el = e.target.closest('.card');
  if (!el || !game) return;
  const card = game.players[0].hand.find((c) => c.id === el.dataset.id);
  if (card) humanPlay(card);
});
$('deck').addEventListener('click', humanDraw);
window.addEventListener('resize', () => game && render());

let toastTimer = null;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 1400);
}

function showResult() {
  clearTimeout(oneTimer);
  renderOneButton();
  const me = game.players[0];
  const win = game.winner === 0;
  $('res-icon').textContent = win ? '🏆' : me.out ? '💥' : game.winner === null ? '🤝' : '😢';
  $('res-title').textContent = win
    ? '승리!'
    : me.out
      ? '파산... 패배'
      : game.winner === null
        ? '무승부'
        : `${game.players[game.winner].name} 승리`;
  $('res-sub').textContent = win ? '모든 카드를 털어냈어요' : `남은 카드 ${me.hand.length}장`;
  setTimeout(() => ($('result').hidden = false), 900);
}
