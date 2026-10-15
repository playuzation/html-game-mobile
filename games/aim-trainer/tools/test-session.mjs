// 판정·점수·시간 검증
// 실행: node games/aim-trainer/tools/test-session.mjs
import { Session, RANGE } from '../src/session.js';
import { DEG, dirFrom, angleBetween, toCamera } from '../src/math.js';

const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);

// 카메라 변환: 바라보는 방향은 화면 정중앙(x=0, y=0)으로
let ok = true;
for (let k = 0; k < 200; k++) {
  const yaw = (Math.random() * 2 - 1) * Math.PI;
  const pitch = (Math.random() * 2 - 1) * 1.2;
  const c = toCamera(dirFrom(yaw, pitch), { yaw, pitch });
  if (Math.abs(c.x) > 1e-9 || Math.abs(c.y) > 1e-9 || Math.abs(c.z - 1) > 1e-9) ok = false;
}
check('조준 방향이 화면 중앙에 투영', ok);

// 과녁 4개 유지, 범위·간격 조건
const s = new Session();
s.start();
check('과녁 4개 등장', s.targets.length === 4);
let inRange = true;
let gapOk = true;
for (let k = 0; k < 500; k++) {
  const t = s.targets[k % 4];
  s.update(0.5);
  s.shoot(t.yaw, t.pitch);
  if (s.targets.length !== 4) inRange = false;
  for (const a of s.targets) {
    if (Math.abs(a.yaw) > RANGE.yaw + 1e-9 || a.pitch < RANGE.pitchMin - 1e-9 || a.pitch > RANGE.pitchMax + 1e-9) inRange = false;
    for (const b of s.targets) if (a !== b && angleBetween(a.dir, b.dir) < 14 * DEG - 1e-9) gapOk = false;
  }
}
check('명중 후에도 항상 4개, 범위 안', inRange);
check('과녁끼리 14° 이상 떨어짐', gapOk);

// 점수: 명중 +1, 빗나감 -1
const s2 = new Session();
s2.start();
const t0 = s2.targets[0];
s2.update(1.5);
const r1 = s2.shoot(t0.yaw, t0.pitch);
s2.update(0.5);
const t1 = s2.targets[0];
s2.shoot(t1.yaw, t1.pitch);
s2.update(1);
s2.shoot(Math.PI, 0); // 뒤쪽 허공
check('명중 +1 · 빗나감 -1', r1.hit && s2.score === 1 && s2.hits === 2 && s2.misses === 1, `점수 ${s2.score}`);
check('플레이 시간', Math.abs(s2.time - 3) < 1e-9, `${s2.time}초`);
check('과녁당 평균 시간 = 마지막 명중 시각 / 명중 수', Math.abs(s2.avgHit - 1) < 1e-9, `${s2.avgHit}초 (1.5초, 0.5초)`);
check('정확도', Math.abs(s2.accuracy - 2 / 3) < 1e-9, `${(s2.accuracy * 100).toFixed(0)}%`);

// 가장자리 판정: 각 반지름 바로 안쪽은 명중, 바로 바깥은 빗나감
const s3 = new Session();
s3.start();
const t = s3.targets[0];
const edge = Math.atan(t.radius / t.dist);
const inHit = s3.targetAt(t.yaw + edge * 0.98 / Math.cos(t.pitch), t.pitch);
const outHit = s3.targetAt(t.yaw + edge * 1.05 / Math.cos(t.pitch), t.pitch);
check('과녁 가장자리 판정', inHit === t && outHit === null, `각 반지름 ${(edge / DEG).toFixed(2)}°`);

// 연습(튜토리얼) 모드는 점수 없음
const s4 = new Session({ maxTargets: 1, scored: false });
s4.start();
s4.shoot(Math.PI, 0);
check('튜토리얼은 점수 변동 없음', s4.score === 0 && s4.misses === 1);

// 자리를 찾지 못해도 멈추지 않음 (항상 같은 난수)
const s5 = new Session({ rng: () => 0.5 });
s5.start();
check('배치 실패 시 무한 반복 없음', s5.targets.length <= 4);

console.log(results.join('\n'));
if (results.some((l) => l.startsWith('❌'))) process.exit(1);
