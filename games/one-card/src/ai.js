// 컴퓨터 플레이어의 판단 (규칙 기반)
//   easy  : 낼 수 있는 카드 중 무작위
//   normal: 공격은 아껴서 막고, 다음 사람이 위험할 때 공격·건너뛰기, 많이 가진 무늬로 이어가기
import { SUITS, isJoker } from './cards.js';
import { attackValue } from './rules.js';

export function bestSuit(hand) {
  const count = Object.fromEntries(SUITS.map((s) => [s, 0]));
  hand.forEach((c) => c.suit && c.rank !== '7' && count[c.suit]++);
  return SUITS.reduce((a, b) => (count[b] > count[a] ? b : a));
}

// 반환: { card, suit } 또는 null(뽑기)
export function chooseMove(game, pi, level = 'normal') {
  const legal = game.legal(pi);
  if (!legal.length) return null;
  const hand = game.players[pi].hand;
  const pick = (card) => ({ card, suit: card.rank === '7' ? bestSuit(hand.filter((c) => c !== card)) : null });

  if (level === 'easy') return pick(legal[Math.floor(game.rng() * legal.length)]);

  // 공격받는 중: 조커는 마지막 수단, 약한 공격부터
  if (game.penalty > 0) {
    const sorted = [...legal].sort((a, b) => isJoker(a) - isJoker(b) || attackValue(a) - attackValue(b));
    return pick(sorted[0]);
  }

  const next = nextPlayer(game, pi);
  const danger = next.hand.length <= 2;
  const suitCount = (s) => hand.filter((c) => c.suit === s).length;

  const score = (c) => {
    let v = 0;
    const atk = attackValue(c);
    if (atk) v += danger ? 30 + atk : -4 - atk;
    if (isJoker(c)) v -= hand.length > 2 ? 12 : 0;
    if (c.rank === 'J' || c.rank === 'Q') v += danger ? 20 : 1;
    if (c.rank === 'K') v += hand.length > 2 ? 6 : -2;
    if (c.rank === '7') v -= legal.length > 1 ? 8 : 0;
    if (c.suit) v += suitCount(c.suit) * 2;
    if (hand.length === 2) v += atk ? 5 : 0; // 마지막 한 장을 남길 때는 공격으로 압박
    return v + game.rng();
  };
  return pick(legal.reduce((a, b) => (score(b) > score(a) ? b : a)));
}

function nextPlayer(game, pi) {
  const n = game.players.length;
  let t = pi;
  do t = (t + game.dir + n) % n;
  while (game.players[t].out);
  return game.players[t];
}
