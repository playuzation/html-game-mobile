// 사격 연습 한 판: 과녁 배치, 판정, 점수와 시간 기록 (UI 없이 동작)
import { DEG, dirFrom, angleBetween } from './math.js';

export const RANGE = { yaw: 70 * DEG, pitchMin: -12 * DEG, pitchMax: 25 * DEG };
const MIN_GAP = 14 * DEG; // 과녁끼리 최소 간격
const MIN_FROM_AIM = 10 * DEG; // 조준선 바로 위에는 생기지 않게

export class Session {
  constructor({ maxTargets = 4, rng = Math.random, scored = true } = {}) {
    Object.assign(this, { maxTargets, rng, scored });
    this.targets = [];
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.time = 0; // 플레이 시간(초)
    this.lastHitAt = 0;
    this.best = Infinity; // 가장 빨랐던 한 발 간격
    this.running = false;
    this.nextId = 1;
  }

  start(aim = { yaw: 0, pitch: 0 }) {
    this.running = true;
    while (this.targets.length < this.maxTargets) if (!this.spawn(aim)) break; // 자리를 못 찾으면 멈춤
  }

  // 평균: 과녁 하나를 맞추는 데 걸린 시간 = 마지막 명중 시각 / 명중 수
  get avgHit() {
    return this.hits ? this.lastHitAt / this.hits : null;
  }

  get accuracy() {
    const shots = this.hits + this.misses;
    return shots ? this.hits / shots : null;
  }

  spawn(aim, fixed = null) {
    const aimDir = dirFrom(aim.yaw, aim.pitch);
    for (let tries = 0; tries < 60; tries++) {
      const yaw = fixed ? fixed.yaw : (this.rng() * 2 - 1) * RANGE.yaw;
      const pitch = fixed ? fixed.pitch : RANGE.pitchMin + this.rng() * (RANGE.pitchMax - RANGE.pitchMin);
      const dir = dirFrom(yaw, pitch);
      if (!fixed) {
        if (angleBetween(dir, aimDir) < MIN_FROM_AIM) continue;
        if (this.targets.some((t) => angleBetween(dir, t.dir) < MIN_GAP)) continue;
      }
      const dist = 10 + this.rng() * 6;
      const radius = 0.55 + this.rng() * 0.2;
      const t = { id: this.nextId++, yaw, pitch, dir, dist, radius, pos: { x: dir.x * dist, y: dir.y * dist, z: dir.z * dist }, born: this.time };
      this.targets.push(t);
      return t;
    }
    return null;
  }

  // 조준선 방향의 과녁 (각 반지름 안이면 명중). 여러 개면 가장 가까운 것
  targetAt(yaw, pitch) {
    const aim = dirFrom(yaw, pitch);
    let best = null;
    for (const t of this.targets) {
      const ang = angleBetween(aim, t.dir);
      if (ang <= Math.atan(t.radius / t.dist) && (!best || t.dist < best.dist)) best = t;
    }
    return best;
  }

  shoot(yaw, pitch) {
    if (!this.running) return null;
    const t = this.targetAt(yaw, pitch);
    if (t) {
      const gap = this.time - this.lastHitAt;
      this.hits++;
      if (this.scored) this.score++;
      this.best = Math.min(this.best, gap);
      this.lastHitAt = this.time;
      this.targets = this.targets.filter((x) => x !== t);
      this.spawn({ yaw, pitch });
      return { hit: true, target: t, gap };
    }
    this.misses++;
    if (this.scored) this.score--;
    return { hit: false };
  }

  update(dt) {
    if (this.running) this.time += dt;
  }
}
