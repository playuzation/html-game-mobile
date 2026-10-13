// 카드 정의 (아무것도 import 하지 않는 리프 모듈)
// card = { id, suit: 'S'|'H'|'D'|'C'|null, rank: 'A'..'K' | 'BJ'(흑백 조커) | 'CJ'(컬러 조커) }

export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUIT_SYMBOL = { S: '♠', H: '♥', D: '◆', C: '♣' };
export const SUIT_NAME = { S: '스페이드', H: '하트', D: '다이아', C: '클로버' };

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ id: suit + rank, suit, rank });
  deck.push({ id: 'JOKER-B', suit: null, rank: 'BJ' }, { id: 'JOKER-C', suit: null, rank: 'CJ' });
  return deck;
}

export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const isJoker = (c) => c.suit === null;
export const isRed = (c) => c.suit === 'H' || c.suit === 'D' || c.rank === 'CJ';

export function label(c) {
  if (c.rank === 'BJ') return '흑백 조커';
  if (c.rank === 'CJ') return '컬러 조커';
  return SUIT_SYMBOL[c.suit] + c.rank;
}
