// 물리 검증: 가속·최고속도·제동거리·회전반경·후진·변속 제한·벽 관통 여부
// 실행: node games/car-sim/tools/test-physics.mjs
import { Car } from '../src/car.js';
import { Sim } from '../src/sim.js';
import { CAR } from '../src/config.js';
import { SPOTS } from '../src/world.js';

const dt = 1 / 120;
const results = [];
const check = (name, ok, detail) => results.push(`${ok ? '✅' : '❌'} ${name} — ${detail}`);
const drive = (car, sec, input, until = () => false) => {
  let t = 0;
  for (; t < sec && !until(car); t += dt) car.update(dt, input, 'road');
  return t;
};

// 0→100 km/h
let car = new Car(0, 0, 0);
car.shift('D');
const t100 = drive(car, 30, { throttle: 1, brake: 0, steer: 0 }, (c) => c.speedKmh >= 100);
check('0→100km/h 가속', t100 > 6 && t100 < 12, `${t100.toFixed(1)}초`);

// 최고 속도
drive(car, 120, { throttle: 1, brake: 0, steer: 0 });
check('최고 속도', car.speedKmh > 170 && car.speedKmh < 230, `${car.speedKmh.toFixed(0)} km/h, ${car.autoGear}단`);

// 100→0 제동 거리
car = new Car(0, 0, 0);
car.gear = 'D';
car.v = 100 / 3.6;
const x0 = car.x;
drive(car, 20, { throttle: 0, brake: 1, steer: 0 }, (c) => c.v === 0);
const dist = car.x - x0;
check('100km/h 제동 거리', dist > 35 && dist < 55, `${dist.toFixed(1)} m`);

// 저속 최소 회전반경 ≈ 축간거리 / tan(최대 조향각)
car = new Car(0, 0, 0);
car.gear = 'D';
car.steer = CAR.MAX_STEER;
car.v = 2;
const pts = [];
for (let t = 0; t < 8; t += dt) {
  car.v = 2;
  car.update(dt, { throttle: 0, brake: 0, steer: 1 }, 'road');
  pts.push([car.x, car.y]);
}
const xs = pts.map((p) => p[0]);
const ys = pts.map((p) => p[1]);
const r = (Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys)) / 4;
const expect = CAR.WHEELBASE / Math.tan(CAR.MAX_STEER);
check('최소 회전반경', Math.abs(r - expect) < 0.3, `${r.toFixed(2)} m (이론 ${expect.toFixed(2)} m)`);

// 후진 최고 속도 제한
car = new Car(0, 0, 0);
car.shift('R');
drive(car, 10, { throttle: 1, brake: 0, steer: 0 });
check('후진', car.v < 0 && car.speedKmh <= 21, `${car.speedKmh.toFixed(1)} km/h 후진`);

// 주행 중 P/R 변속 금지
car = new Car(0, 0, 0);
car.shift('D');
car.v = 10;
check('주행 중 P 변속 거부', !car.shift('P') && car.gear === 'D', `gear=${car.gear}`);

// P 에서는 움직이지 않음
car = new Car(0, 0, 0);
drive(car, 3, { throttle: 1, brake: 0, steer: 0 });
check('P 단에서 정지 유지', car.v === 0, `v=${car.v}`);

// 최고 속도로 외벽에 돌진해도 관통하지 않음
const sim = new Sim();
sim.car.x = 150;
sim.car.y = 393;
sim.car.heading = Math.PI / 2;
sim.car.gear = 'D';
sim.car.v = 55;
for (let t = 0; t < 2; t += 0.05) sim.update(0.05, { throttle: 1, brake: 0, steer: 0 });
check('외벽 관통 없음', sim.car.y < 400 && sim.crashes >= 1, `y=${sim.car.y.toFixed(2)}, 충돌 ${sim.crashes}회`);

// 주차 판정: 칸 중앙에 P 로 세우면 성공
const s2 = new Sim();
const t = s2.target;
s2.car.x = t.x + t.w / 2;
s2.car.y = t.y + t.h / 2;
s2.car.heading = Math.PI / 2;
s2.car.v = 0;
s2.car.gear = 'P';
s2.update(0.1, { throttle: 0, brake: 0, steer: 0 });
const before = s2.parked;
for (let k = 0; k < 10; k++) s2.update(0.1, { throttle: 0, brake: 0, steer: 0 });
check('주차 성공 판정', s2.parked === before + 1 && s2.target !== t, `주차 ${s2.parked}회`);

// 칸이 차보다 넉넉한지
check('주차 칸 크기', SPOTS[0].w > CAR.WIDTH + 0.6 && SPOTS[0].h > CAR.LENGTH + 0.6, `${SPOTS[0].w}×${SPOTS[0].h} m, ${SPOTS.length}칸`);

console.log(results.join('\n'));
if (results.some((l) => l.startsWith('❌'))) process.exit(1);
