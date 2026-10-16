// 조합표 검증: 만들 수 있는 것이 정확히 100개인지, 모두 기본 원소에서 도달 가능한지,
// 같은 재료 쌍이 서로 다른 결과를 내지 않는지, 이모지가 빠진 항목이 없는지
// 실행: node games/alchemy/tools/verify-recipes.mjs
import { BASE, EMOJI, RECIPES } from '../src/recipes.js';
import { TARGET } from '../src/alchemy.js';

const problems = [];
const key = (a, b) => [a, b].sort().join('+');
const pairs = new Map();
for (const [a, b, r] of RECIPES) {
  for (const x of [a, b, r]) if (!EMOJI[x]) problems.push(`이모지 없음: ${x}`);
  const k = key(a, b);
  if (pairs.has(k) && pairs.get(k) !== r) problems.push(`재료 충돌: ${k} → ${pairs.get(k)} / ${r}`);
  pairs.set(k, r);
  if (BASE.includes(r)) problems.push(`기본 원소를 만드는 조합: ${k}`);
}

const results = new Set(RECIPES.map((r) => r[2]));
const unused = Object.keys(EMOJI).filter((n) => !BASE.includes(n) && !results.has(n));
if (unused.length) problems.push(`만들 방법이 없는 항목: ${unused.join(', ')}`);

// 기본 원소에서 출발해 더 이상 새로 생기지 않을 때까지 조합
const have = new Set(BASE);
const order = [];
for (let changed = true; changed; ) {
  changed = false;
  for (const [a, b, r] of RECIPES) {
    if (have.has(a) && have.has(b) && !have.has(r)) {
      have.add(r);
      order.push(r);
      changed = true;
    }
  }
}
const unreachable = [...results].filter((r) => !have.has(r));
if (unreachable.length) problems.push(`도달 불가: ${unreachable.join(', ')}`);

const emojis = Object.values(EMOJI);
const dupEmoji = emojis.filter((e, i) => emojis.indexOf(e) !== i);
if (dupEmoji.length) problems.push(`겹치는 이모지: ${dupEmoji.join(' ')}`);

console.log(`기본 원소 ${BASE.length}개 · 조합 ${RECIPES.length}개 · 만들 수 있는 것 ${results.size}개 (목표 ${TARGET})`);
console.log(`도달 가능 ${order.length}개`);
if (results.size !== TARGET) problems.push(`만들 수 있는 개수가 ${TARGET}개가 아님: ${results.size}`);
problems.forEach((p) => console.error('❌ ' + p));
if (problems.length) process.exit(1);
console.log('✅ 100개 모두 기본 원소 5개에서 만들 수 있음 · 재료 충돌 없음');
