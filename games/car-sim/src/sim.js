// 시뮬레이션: 차 + 지도 충돌, 콘 밀기, 주차 연습 판정
import { Car } from './car.js';
import { BUILDINGS, CONES, SPOTS, SIZE, START, surfaceAt } from './world.js';

const CONE_R = 0.35;
const STEP = 1 / 120;

// 분리축(SAT): 볼록 다각형 a·b 가 겹치면 가장 얕은 밀어내기 벡터 {x,y} 반환
function sat(a, b) {
  let best = null;
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      let nx = q.y - p.y;
      let ny = p.x - q.x;
      const len = Math.hypot(nx, ny);
      nx /= len;
      ny /= len;
      const proj = (pts) => pts.reduce((m, t) => [Math.min(m[0], t.x * nx + t.y * ny), Math.max(m[1], t.x * nx + t.y * ny)], [Infinity, -Infinity]);
      const [a0, a1] = proj(a);
      const [b0, b1] = proj(b);
      const o = Math.min(a1, b1) - Math.max(a0, b0);
      if (o <= 0) return null;
      if (!best || o < best.o) {
        const ca = (a0 + a1) / 2;
        const cb = (b0 + b1) / 2;
        const s = ca < cb ? -1 : 1;
        best = { o, x: nx * s * o, y: ny * s * o };
      }
    }
  }
  return best;
}

const rectPoly = (r) => [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }];
const WALLS = [
  { x: -10, y: -10, w: SIZE + 20, h: 10 },
  { x: -10, y: SIZE, w: SIZE + 20, h: 10 },
  { x: -10, y: 0, w: 10, h: SIZE },
  { x: SIZE, y: 0, w: 10, h: SIZE },
];
const SOLIDS = [...BUILDINGS, ...WALLS].map((r) => ({ r, poly: rectPoly(r) }));

export class Sim {
  constructor() {
    this.car = new Car(START.x, START.y, START.heading);
    this.cones = CONES.map((c) => ({ ...c, vx: 0, vy: 0, down: false, hx: c.x, hy: c.y }));
    this.crashes = 0;
    this.coneHits = 0;
    this.parked = 0;
    this.events = [];
    this.acc = 0;
    this.lastCrash = -Infinity;
    this.time = 0;
    this.newTarget();
  }

  newTarget() {
    let i;
    do i = Math.floor(Math.random() * SPOTS.length);
    while (SPOTS[i] === this.target);
    this.target = SPOTS[i];
    this.targetTime = 0;
    this.holdT = 0;
  }

  update(dt, input) {
    this.acc = Math.min(this.acc + dt, 0.1);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this._step(STEP, input);
    }
  }

  _step(dt, input) {
    const car = this.car;
    this.time += dt;
    this.targetTime += dt;
    car.update(dt, input, surfaceAt(car.x, car.y));

    // 건물·외벽 충돌: 밀어내고 튕김
    const poly = car.corners();
    for (const s of SOLIDS) {
      const m = sat(poly, s.poly);
      if (!m) continue;
      car.x += m.x;
      car.y += m.y;
      const impact = Math.abs(car.v);
      car.v *= -0.25;
      if (impact > 1.5 && this.time - this.lastCrash > 0.6) {
        this.crashes++;
        this.lastCrash = this.time;
        this.events.push({ type: 'crash', impact });
      }
      break;
    }

    // 콘: 차에 닿으면 밀려나고 쓰러진다
    const vx = Math.cos(car.heading) * car.v;
    const vy = Math.sin(car.heading) * car.v;
    for (const c of this.cones) {
      const circle = Array.from({ length: 6 }, (_, k) => ({ x: c.x + Math.cos((k * Math.PI) / 3) * CONE_R, y: c.y + Math.sin((k * Math.PI) / 3) * CONE_R }));
      const m = sat(circle, poly);
      if (m) {
        c.x += m.x;
        c.y += m.y;
        c.vx = vx * 1.2 + m.x * 5;
        c.vy = vy * 1.2 + m.y * 5;
        if (!c.down) {
          c.down = true;
          this.coneHits++;
          this.events.push({ type: 'cone' });
        }
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= Math.exp(-3 * dt);
      c.vy *= Math.exp(-3 * dt);
    }

    // 주차 판정: 네 모서리가 칸 안 + 정지 + P + 0.5초 유지
    const t = this.target;
    const inside = poly.every((p) => p.x > t.x && p.x < t.x + t.w && p.y > t.y && p.y < t.y + t.h);
    this.inSpot = inside;
    if (inside && Math.abs(car.v) < 0.05 && car.gear === 'P') {
      this.holdT += dt;
      if (this.holdT > 0.5) {
        this.parked++;
        this.events.push({ type: 'parked', time: this.targetTime });
        this.newTarget();
      }
    } else this.holdT = 0;
  }

  resetCones() {
    this.cones.forEach((c) => Object.assign(c, { x: c.hx, y: c.hy, vx: 0, vy: 0, down: false }));
  }

  resetCar() {
    this.car = new Car(START.x, START.y, START.heading);
  }
}

