// 보드 칸 정의와 금액 규칙 (아무것도 import 하지 않는 리프 모듈)
// 금액 단위: 만원
//
//  16 기금수령 17 ─ 23 → 24 우주여행
//   ↑                       ↓
//  9 ─ 15                 25 ─ 31
//   ↑                       ↓
//  8 무인도 ← 7 ─ 1 ← 0 출발

export const START_CASH = 300;
export const SALARY = 20;
export const FUND_FEE = 15;
export const ISLAND_TURNS = 3;
export const BUILD_NAMES = ['땅', '별장', '빌딩', '호텔'];
const UPGRADE_RATE = [0.5, 1, 1.5]; // 별장·빌딩·호텔 건설비 (땅값 대비)
const RENT_RATE = [0.2, 0.8, 2, 3.5]; // 통행료 (땅값 대비, 단계별)
const GROUP_BONUS = 1.5; // 같은 색 도시를 모두 가지면 통행료 1.5배

export const GROUP_COLORS = ['#f06292', '#ffb74d', '#81c784', '#4fc3f7', '#ba68c8', '#e57373', '#7986cb', '#a1887f'];

const city = (name, price, group) => ({ type: 'city', name, price, group });
const tour = (name, price) => ({ type: 'tour', name, price });
const key = () => ({ type: 'key', name: '황금열쇠' });

export const TILES = [
  { type: 'start', name: '출발' },
  city('타이베이', 5, 0), key(), city('베이징', 8, 0), city('마닐라', 8, 0), tour('제주도', 20), city('싱가포르', 10, 1), city('카이로', 10, 1),
  { type: 'island', name: '무인도' },
  city('아테네', 14, 2), key(), city('코펜하겐', 16, 2), city('스톡홀름', 16, 2), tour('콩코드', 20), city('베른', 18, 3), city('베를린', 18, 3),
  { type: 'fund-get', name: '복지기금' },
  city('오타와', 22, 4), key(), city('부에노스', 24, 4), city('상파울루', 24, 4), city('시드니', 26, 5), tour('부산', 30), city('하와이', 26, 5),
  { type: 'space', name: '우주여행' },
  city('리스본', 28, 6), tour('퀸엘리자베스', 30), city('마드리드', 30, 6), key(), city('도쿄', 32, 7), { type: 'fund-pay', name: '기금납부' }, city('서울', 40, 7),
];

export const SIZE = TILES.length; // 32

export const ownable = (i) => TILES[i].type === 'city' || TILES[i].type === 'tour';

export function upgradeCost(i, level) {
  return Math.round(TILES[i].price * UPGRADE_RATE[level]);
}

// 땅값 + 지금까지 지은 건물값
export function invested(i, level) {
  let v = TILES[i].price;
  for (let l = 0; l < level; l++) v += upgradeCost(i, l);
  return v;
}

// owners: [{ owner, level }] (칸별)
export function rent(i, owners) {
  const t = TILES[i];
  const o = owners[i];
  if (t.type === 'tour') return Math.round(t.price * 0.5);
  let r = t.price * RENT_RATE[o.level];
  const group = TILES.map((x, k) => k).filter((k) => TILES[k].group === t.group && TILES[k].type === 'city');
  if (group.every((k) => owners[k].owner === o.owner)) r *= GROUP_BONUS;
  return Math.round(r);
}
