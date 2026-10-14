// 윷가락 던지기 (아무것도 import 하지 않는 리프 모듈)
// 윷가락 4개 중 평평한 면(배)이 위로 온 개수: 1 도 · 2 개 · 3 걸 · 4 윷 · 0 모
// 표시가 있는 가락 하나만 배가 나오면 빽도(-1)

export const NAMES = { '-1': '빽도', 1: '도', 2: '개', 3: '걸', 4: '윷', 5: '모' };
export const VALUES = [-1, 1, 2, 3, 4, 5];
export const PROB = { '-1': 1 / 16, 1: 3 / 16, 2: 6 / 16, 3: 4 / 16, 4: 1 / 16, 5: 1 / 16 };

export function throwYut(rng = Math.random) {
  const sticks = [0, 1, 2, 3].map(() => rng() < 0.5); // true = 배(평평한 면)
  const flats = sticks.filter(Boolean).length;
  let value = flats === 0 ? 5 : flats;
  if (flats === 1 && sticks[0]) value = -1;
  return { value, sticks };
}

export const isBonus = (v) => v === 4 || v === 5;
