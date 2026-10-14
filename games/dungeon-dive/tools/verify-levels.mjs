// 레벨 검증: 많은 시드로 1~10층을 만들어 모두 시작→출구가 이어지는지, 재생성이 얼마나 필요한지 확인
// 실행: node games/dungeon-dive/tools/verify-levels.mjs [시드 수]
import { generate } from '../src/level.js';
import { makeRng } from '../src/rng.js';
import { FLOORS } from '../src/config.js';
import { CHUNKS } from '../src/chunks.js';
import { reachable, H } from '../src/level.js';

const SEEDS = Number(process.argv[2]) || 500;

// 1) 각 조각이 단독으로(시작→조각→출구) 통과 가능한지 — 정방향/반전 모두
const pad = (rows) => rows.map((r) => '.' + r + '.');
let bad = 0;
CHUNKS.forEach((chunk, i) => {
  for (const flip of [false, true]) {
    const rows = pad(chunk.map((r) => (flip ? [...r].reverse().join('') : r)).map((r) => r.replace(/[cCebaB]/g, '.')));
    rows[0] = '#'.repeat(rows[0].length);
    rows[H - 1] = '#' + rows[H - 1].slice(1, -1) + '#';
    const level = { w: rows[0].length, grid: rows.map((r) => [...r]), start: { x: 0, y: H - 2 }, exit: { x: rows[0].length - 1, y: H - 2 } };
    if (!reachable(level)) {
      bad++;
      console.error(`❌ 조각 ${i}${flip ? ' (반전)' : ''} 통과 불가`);
    }
  }
});

// 2) 실제 생성
let total = 0;
let retries = 0;
let maxTries = 0;
for (let s = 1; s <= SEEDS; s++) {
  const rng = makeRng(s * 7919);
  for (let f = 1; f <= FLOORS; f++) {
    const level = generate(f, rng);
    total++;
    retries += level.tries - 1;
    maxTries = Math.max(maxTries, level.tries);
  }
}
console.log(`조각 ${CHUNKS.length}개 × 2방향 검사, 실패 ${bad}`);
console.log(`${total}개 층 생성 · 재생성 합계 ${retries}회 · 한 층 최대 시도 ${maxTries}회`);
if (bad) process.exit(1);
console.log('✅ 모든 층이 시작→출구로 이어짐');
