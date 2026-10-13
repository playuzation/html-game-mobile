// 규칙 검증: 컴퓨터끼리 대량으로 대전시켜 카드 보존·종료·규칙 위반이 없는지 확인한다
// 실행: node games/one-card/tools/simulate.mjs [판 수]
import { OneCardGame } from '../src/game.js';
import { chooseMove } from '../src/ai.js';
import { canPlay } from '../src/rules.js';

const GAMES = Number(process.argv[2]) || 3000;
const TOTAL = 54;
let wins = { normal: 0, easy: 0 };
let stalls = 0;
let humanBust = 0;
let maxTurns = 0;

function count(g) {
  const ids = [...g.deck, ...g.pile, ...g.players.flatMap((p) => p.hand)].map((c) => c.id);
  return new Set(ids).size === ids.length ? ids.length : -1;
}

for (let i = 0; i < GAMES; i++) {
  const n = 2 + (i % 3);
  const names = Array.from({ length: n + 1 }, (_, k) => `P${k}`);
  const levels = names.map((_, k) => (k % 2 ? 'normal' : 'easy'));
  const g = new OneCardGame(names);
  while (!g.over) {
    const pi = g.turn;
    const move = chooseMove(g, pi, levels[pi]);
    if (move) {
      if (!canPlay(move.card, g.state)) throw new Error('규칙 위반 카드');
      if (!g.play(pi, move.card.id, move.suit)) throw new Error('play 실패');
    } else g.draw(pi);
    if (g.oneCard !== null) g.declare(g.rng() < 0.7 ? g.oneCard : (g.oneCard + 1) % n);
    if (count(g) !== TOTAL) throw new Error(`카드 수 불일치 또는 중복: ${count(g)}`);
    if (g.players.some((p) => p.hand.length >= 20 && !p.out)) throw new Error('파산 처리 누락');
  }
  maxTurns = Math.max(maxTurns, g.turns);
  if (g.winner === null && g.players[0].out) humanBust++;
  else if (g.winner === null) stalls++;
  else wins[levels[g.winner]]++;
}

console.log(`${GAMES}판 완료 · 최대 ${maxTurns}턴 · 사람 자리(P0) 파산 ${humanBust}판 · 교착 ${stalls}판`);
console.log(`승리: 보통 AI ${wins.normal} / 쉬움 AI ${wins.easy}`);
if (stalls) throw new Error('교착 상태 발생');
console.log('✅ 카드 보존, 규칙 위반·교착 없음');
