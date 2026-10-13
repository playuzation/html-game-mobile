// 원카드 규칙 (순수 함수)
//   같은 무늬 또는 같은 숫자를 낸다. 조커는 언제나 낼 수 있다.
//   공격: A +3 (♠A +5), 2 +2, 흑백 조커 +5, 컬러 조커 +7 — 공격 카드로 막으면 누적
//   J 다음 사람 건너뛰기 · Q 방향 바꾸기 · K 한 장 더 · 7 무늬 바꾸기
import { isJoker } from './cards.js';

export const HAND_LIMIT = 20; // 이 장수 이상이 되면 파산
export const START_HAND = 7;

export function attackValue(c) {
  if (c.rank === 'BJ') return 5;
  if (c.rank === 'CJ') return 7;
  if (c.rank === 'A') return c.suit === 'S' ? 5 : 3;
  if (c.rank === '2') return 2;
  return 0;
}

// state: { top, suit(7로 지정된 무늬|null), penalty(누적 공격) }
export function canPlay(card, state) {
  const { top, suit, penalty } = state;
  if (penalty > 0) {
    if (!attackValue(card)) return false;
    if (isJoker(card)) return true;
    if (isJoker(top)) return false;
    return card.suit === top.suit || card.rank === top.rank;
  }
  if (isJoker(card)) return true;
  if (suit) return card.suit === suit || card.rank === '7';
  if (isJoker(top)) return true;
  return card.suit === top.suit || card.rank === top.rank;
}

export const isSpecial = (c) => isJoker(c) || attackValue(c) > 0 || ['J', 'Q', 'K', '7'].includes(c.rank);
