// 규칙 검증: BPM 범위, 자물쇠 자리 순환, 판정·점수
// 실행: node games/bpm-lock/tools/test-game.mjs
import { BpmGame, turnDigit, digits, accuracy, MIN_BPM, MAX_BPM, ROUNDS, TRIES } from '../src/game.js';

const res = [];
const check = (n, ok, d = '') => res.push(`${ok ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);

// 목표 BPM 범위
let lo = 999;
let hi = 0;
for (let k = 0; k < 20000; k++) {
  const g = new BpmGame();
  lo = Math.min(lo, g.target);
  hi = Math.max(hi, g.target);
  if (!Number.isInteger(g.target)) throw new Error('정수 아님');
}
check('목표 BPM 이 30~300 정수', lo === MIN_BPM && hi === MAX_BPM, `최소 ${lo}, 최대 ${hi}`);

// 자물쇠 자리
check('일의 자리 9→0 순환 (자리올림 없음)', turnDigit(129, 2, 1) === 120);
check('십의 자리 0→9 순환', turnDigit(105, 1, -1) === 195);
check('백의 자리 증가', turnDigit(120, 0, 1) === 220);
check('자리 분해', digits(87).join('') === '087');

// 판정
const g = new BpmGame(() => 0.5); // target = 30 + floor(0.5*271) = 165
check('고정 난수 목표', g.target === 165, `${g.target}`);
check('범위 밖 입력은 무효(시도 차감 없음)', g.guess(305).valid === false && g.guess(12).valid === false && g.guesses.length === 0);
const r1 = g.guess(120);
check('낮게 입력 → 더 빠름 힌트', r1.direction === 'up' && !r1.finished && r1.left === 2, r1.label);
const r2 = g.guess(180);
check('높게 입력 → 더 느림 힌트', r2.direction === 'down' && !r2.finished, r2.label);
const r3 = g.guess(167);
check('±2 이내면 정답, 3번째 시도 배율 0.4', r3.ok && r3.finished && r3.score === 40, `점수 ${r3.score}`);
check('라운드 끝나면 추가 입력 무시', g.guess(165) === null);

const g2 = new BpmGame(() => 0.5);
const a = g2.guess(165);
check('첫 시도 정답 = 100점', a.ok && a.score === 100);
const g3 = new BpmGame(() => 0.5);
g3.guess(100);
g3.guess(100);
const c = g3.guess(150);
check('3번 모두 실패 → 마지막 정확도 × 0.4', !c.ok && c.finished && c.score === Math.round(accuracy(150, 165) * 0.4), `정확도 ${accuracy(150, 165)}, 점수 ${c.score}`);

// 전체 진행
const g4 = new BpmGame();
for (let r = 0; r < ROUNDS; r++) {
  for (let t = 0; t < TRIES && !g4.done; t++) g4.guess(g4.target);
  g4.next();
}
check(`${ROUNDS}라운드 만점 = ${ROUNDS * 100}`, g4.over && g4.total === ROUNDS * 100, `${g4.total}점`);
check('정확도 0 하한', accuracy(300, 30) === 0 && accuracy(30, 300) === 0);

console.log(res.join('\n'));
if (res.some((l) => l.startsWith('❌'))) process.exit(1);
