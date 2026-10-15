// 자동차 물리: 자전거 모델(앞바퀴 조향) + 출력 제한 가속 + 공기/구름 저항 + 자동 변속
// input: { throttle 0~1, brake 0~1, steer -1~1 }, gear: 'P' | 'R' | 'N' | 'D'
import { CAR as C, GEARS, RPM } from './config.js';

export class Car {
  constructor(x, y, heading) {
    Object.assign(this, { x, y, heading, v: 0, steer: 0, gear: 'P', autoGear: 1, rpm: RPM.IDLE, odo: 0 });
  }

  get speedKmh() {
    return Math.abs(this.v) * 3.6;
  }

  // 정지했을 때만 P·R 로 바꿀 수 있다
  shift(g) {
    if (g === this.gear) return true;
    if ((g === 'P' || g === 'R' || this.gear === 'R' || this.gear === 'P') && Math.abs(this.v) > 0.5) return false;
    this.gear = g;
    return true;
  }

  update(dt, input, surface) {
    // 조향: 빠를수록 최대 조향각을 줄여 안정성 확보
    const limit = C.MAX_STEER / (1 + (this.v * this.v) / 400);
    const target = input.steer * limit;
    this.steer += Math.max(-C.STEER_RATE * dt, Math.min(C.STEER_RATE * dt, target - this.steer));

    const speed = Math.abs(this.v);
    const dir = Math.sign(this.v);
    const roll = surface === 'grass' ? C.GRASS_ROLL : C.ROLL;
    let a = 0;

    if (this.gear === 'D' || this.gear === 'R') {
      const sgn = this.gear === 'D' ? 1 : -1;
      // 엔진: 저속은 접지 한계, 고속은 출력 한계 (P = F·v)
      const engine = Math.min(C.MAX_ACCEL, C.POWER / (C.MASS * Math.max(speed, 1)));
      const creep = input.throttle < 0.05 && input.brake < 0.05 && speed < C.IDLE_CREEP ? 0.6 : 0;
      a += sgn * (engine * input.throttle + creep);
      if (this.gear === 'R' && speed > C.REVERSE_MAX && dir < 0) a = Math.max(a, 0);
    }
    // 저항 (진행 방향 반대)
    const resist = (C.DRAG * speed * speed) / C.MASS + (speed > 0.01 ? roll : 0);
    const brake = input.brake * C.BRAKE + (this.gear === 'P' ? C.BRAKE : 0);
    const decel = resist + brake;
    let v = this.v + a * dt;
    // 감속은 속도를 0 너머로 뒤집지 않는다
    if (Math.abs(v) <= decel * dt && Math.abs(a) <= decel) v = 0;
    else v -= Math.sign(v) * decel * dt;
    this.v = v;

    // 자전거 모델
    const yaw = (this.v * Math.tan(this.steer)) / C.WHEELBASE;
    this.heading += yaw * dt;
    this.x += Math.cos(this.heading) * this.v * dt;
    this.y += Math.sin(this.heading) * this.v * dt;
    this.odo += Math.abs(this.v) * dt;

    // 자동 변속기와 회전수 (표시용)
    const kmh = this.speedKmh;
    if (this.gear === 'D') {
      while (this.autoGear < GEARS.length && kmh > GEARS[this.autoGear - 1] * 0.95) this.autoGear++;
      while (this.autoGear > 1 && kmh < GEARS[this.autoGear - 2] * 0.7) this.autoGear--;
      const lo = this.autoGear > 1 ? GEARS[this.autoGear - 2] * 0.55 : 0;
      const hi = GEARS[this.autoGear - 1];
      const f = Math.min(1, Math.max(0, (kmh - lo) / (hi - lo)));
      this.rpm = Math.max(RPM.IDLE + input.throttle * 1200 * (kmh < 5 ? 1 : 0), RPM.IDLE + f * (RPM.SHIFT - RPM.IDLE));
    } else if (this.gear === 'R') {
      this.autoGear = 1;
      this.rpm = RPM.IDLE + (kmh / 20) * 3000;
    } else {
      this.autoGear = 1;
      this.rpm += ((RPM.IDLE + input.throttle * (RPM.MAX - RPM.IDLE)) - this.rpm) * Math.min(1, dt * 6);
    }
  }

  // 차체 네 모서리 (충돌·주차 판정)
  corners() {
    const c = Math.cos(this.heading);
    const s = Math.sin(this.heading);
    const hl = C.LENGTH / 2;
    const hw = C.WIDTH / 2;
    return [[hl, hw], [hl, -hw], [-hl, -hw], [-hl, hw]].map(([a, b]) => ({ x: this.x + c * a - s * b, y: this.y + s * a + c * b }));
  }
}
