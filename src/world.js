// 레인(줄) 생성 및 차/통나무 이동, 충돌 질의
import { COLS, WRAP_MARGIN, COLORS } from './config.js';

const PERIOD = COLS + WRAP_MARGIN * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wrap = (x) => ((((x + WRAP_MARGIN) % PERIOD) + PERIOD) % PERIOD) - WRAP_MARGIN;

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.lanes = new Map();
    this.top = -10;
    this.runType = 'grass';
    this.runLeft = 0;
    this.lastWaterDir = 1;
  }

  get(row) {
    while (this.top < row) this._generate(++this.top);
    return this.lanes.get(row);
  }

  _generate(row) {
    let lane;
    if (row < 0) lane = this._grass(row, 1);          // 출발선 뒤: 나무로 막힘
    else if (row < 4) lane = this._grass(row, 0, row === 0 ? 0 : 0.12);
    else {
      if (this.runLeft <= 0) this._nextRun();
      this.runLeft--;
      const d = Math.min(row / 150, 1);               // 난이도 0~1
      if (this.runType === 'road') lane = this._road(d);
      else if (this.runType === 'water') lane = this._water(d);
      else lane = this._grass(row, 0, 0.18);
    }
    this.lanes.set(row, lane);
    this.lanes.delete(row - 40);                      // 지나간 줄 정리
  }

  _nextRun() {
    const prev = this.runType;
    const r = Math.random();
    if (prev === 'grass') this.runType = r < 0.6 ? 'road' : 'water';
    else this.runType = r < 0.7 ? 'grass' : prev === 'road' ? 'water' : 'road';
    this.runLeft =
      this.runType === 'road' ? randInt(1, 4) : this.runType === 'water' ? randInt(1, 3) : randInt(1, 2);
  }

  _grass(row, fill, density = 0) {
    const trees = new Set();
    for (let c = 0; c < COLS; c++) {
      if (fill || (Math.random() < density && trees.size < 3)) trees.add(c);
    }
    return { type: 'grass', trees, shade: row & 1 };
  }

  _road(d) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const speed = rand(1.2, 2.4) * (1 + d * 1.2);
    const items = [];
    let pos = rand(0, 2);
    while (pos + 4 < PERIOD) {
      const w = Math.random() < 0.25 ? 2 : 1;
      items.push({ x: pos - WRAP_MARGIN, w, color: pick(COLORS.cars) });
      pos += w + rand(2.5, 5.5) * (1 - d * 0.35);
    }
    return { type: 'road', dir, speed, items };
  }

  _water(d) {
    this.lastWaterDir = -this.lastWaterDir;
    const dir = this.lastWaterDir;
    const speed = rand(0.8, 1.5) * (1 + d * 0.6);
    const items = [];
    let pos = rand(0, 1);
    while (pos + 3 < PERIOD) {
      const w = randInt(2, 4);
      items.push({ x: pos - WRAP_MARGIN, w });
      pos += w + rand(1, 2.2) * (1 + d * 0.4);
    }
    return { type: 'water', dir, speed, items };
  }

  update(dt, fromRow, toRow) {
    for (let r = fromRow; r <= toRow; r++) {
      const lane = this.get(r);
      if (!lane.items) continue;
      for (const it of lane.items) it.x = wrap(it.x + lane.dir * lane.speed * dt);
    }
  }

  isBlocked(row, col) {
    if (col < 0 || col >= COLS) return true;
    const lane = this.get(row);
    return lane.type === 'grass' && lane.trees.has(col);
  }

  // cx: 플레이어 중심 x (칸 단위)
  carHit(lane, cx) {
    return lane.items.some((it) => cx + 0.3 > it.x + 0.05 && cx - 0.3 < it.x + it.w - 0.05);
  }

  logAt(lane, cx) {
    return lane.items.find((it) => cx > it.x - 0.1 && cx < it.x + it.w + 0.1);
  }
}
