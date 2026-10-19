// 규칙 검증: 목표 시간 범위·0.1초 단위, ±0.1초 경계 판정, 기록
// 실행: node games/time-hold/tools/test-rules.mjs
import { HoldGame, TOLERANCE } from '../src/rules.js';

const res = [];
const check = (n, ok, d = '') => res.push(`${ok ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);

// 목표: 1.0~10.0초, 0.1초 단위 91가지, 직전과 같은 값 없음
const g = new HoldGame();
const seen = new Set();
let repeat = false;
let stepOk = true;
for (let k = 0; k < 50000; k++) {
  const prev = g.target;
  const t = g.next();
  if (t === prev) repeat = true;
  if (Math.abs(t * 10 - Math.round(t * 10)) > 1e-9) stepOk = false;
  seen.add(t);
}
const list = [...seen].sort((a, b) => a - b);
check('목표 1.0~10.0초 · 0.1초 단위 91가지', seen.size === 91 && list[0] === 1 && list[90] === 10 && stepOk, `${list[0]}~${list[90]}초`);
check('같은 목표가 연달아 나오지 않음', !repeat);
check('고정 난수에서도 무한 반복 없음', new HoldGame(() => 0.999999).next() === 1);

// ±0.1초 경계 (부동소수 오차 없이)
const at = (target, held) => {
  const t = new HoldGame(() => (Math.round((target - 1) * 10) + 0.5) / 91);
  return t.target === target ? t.judge(held) : null;
};
const cases = [
  [3.4, 3.4, true], [3.4, 3.5, true], [3.4, 3.3, true], [3.4, 3.501, false], [3.4, 3.299, false],
  [1, 0.9, true], [1, 0.89, false], [10, 10.1, true], [10, 10.11, false], [7.7, 7.6, true],
];
let edgeOk = true;
for (const [t, h, want] of cases) if (at(t, h)?.pass !== want) edgeOk = false;
check(`±${TOLERANCE}초 경계 판정 ${cases.length}가지`, edgeOk);
const r = at(5.2, 5.37);
check('오차 부호: 길게 누르면 +', r.diff === 0.17 && !r.pass);
check('오차 부호: 짧게 누르면 -', at(5.2, 5.12).diff === -0.08);

// 기록 · 판정 한 번만
const s = new HoldGame(() => 0.5); // 5.5초
s.judge(5.55);
check('같은 문제 다시 판정해도 기록 그대로', s.judge(9).pass && s.rounds === 1);
s.next(); s.judge(s.target + 0.05);
s.next(); s.judge(s.target - 0.3);
s.next(); s.judge(s.target + 0.02);
check('성공·연속·최고 연속·최소 오차', s.rounds === 4 && s.passes === 3 && s.streak === 1 && s.bestStreak === 2 && s.bestDiff === 0.02, `${s.passes}/${s.rounds}`);

console.log(res.join('\n'));
if (res.some((l) => l.startsWith('❌'))) process.exit(1);
