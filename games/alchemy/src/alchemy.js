// 조합 규칙과 진행 상태 (UI 없이 동작)
import { BASE, EMOJI, RECIPES } from './recipes.js';

const key = (a, b) => [a, b].sort().join('+');
const TABLE = new Map(RECIPES.map(([a, b, r]) => [key(a, b), r]));
export const ALL = [...new Set(RECIPES.map((r) => r[2]))]; // 만들 수 있는 것 전체
export const TARGET = 100;

export const emojiOf = (name) => EMOJI[name] || '❔';

export class Alchemy {
  constructor(saved = null) {
    this.found = saved?.length ? [...new Set([...BASE, ...saved])] : [...BASE];
  }

  get progress() {
    return this.found.filter((n) => !BASE.includes(n)).length;
  }

  get complete() {
    return this.progress >= TARGET;
  }

  has(name) {
    return this.found.includes(name);
  }

  // 결과: { result, isNew } 또는 null(조합 없음)
  combine(a, b) {
    const result = TABLE.get(key(a, b));
    if (!result) return null;
    const isNew = !this.has(result);
    if (isNew) this.found.push(result);
    return { result, isNew };
  }

  // 지금 가진 것으로 만들 수 있는데 아직 못 찾은 조합 하나
  hint(rng = Math.random) {
    const open = RECIPES.filter(([a, b, r]) => this.has(a) && this.has(b) && !this.has(r));
    return open.length ? open[Math.floor(rng() * open.length)] : null;
  }

  // 이 항목을 만드는 방법 (찾은 것만 공개)
  recipesFor(name) {
    return RECIPES.filter((r) => r[2] === name).map(([a, b]) => [a, b]);
  }
}
