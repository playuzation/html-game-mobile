// 플레이어 위치/점프 상태
import { COLS, HOP_MS } from './config.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.floor(COLS / 2);   // 칸 단위 (통나무 위에서는 실수)
    this.row = 0;
    this.fromX = this.x;
    this.fromRow = 0;
    this.toX = this.x;
    this.hopT = 1;
    this.dir = 'up';
    this.queued = null;
    this.dead = null;                // null | 'car' | 'water' | 'eagle'
    this.deadT = 0;
  }

  get hopping() {
    return this.hopT < 1;
  }

  // 충돌 판정용 줄: 점프 전반부는 출발 줄, 후반부는 도착 줄
  get collisionRow() {
    return this.hopT < 0.5 ? this.fromRow : this.row;
  }

  // 화면 표시용 줄 (실수)
  get visualRow() {
    return this.fromRow + (this.row - this.fromRow) * this.hopT;
  }

  get lift() {
    return Math.sin(Math.PI * this.hopT) * 0.35;
  }

  startHop(toX, toRow, dir) {
    this.fromX = this.x;
    this.fromRow = this.row;
    this.toX = toX;
    this.row = toRow;
    this.dir = dir;
    this.hopT = 0;
  }

  // 착지한 프레임이면 true
  update(dt) {
    if (!this.hopping) return false;
    this.hopT = Math.min(1, this.hopT + (dt * 1000) / HOP_MS);
    this.x = this.fromX + (this.toX - this.fromX) * this.hopT;
    if (this.hopT < 1) return false;
    this.fromRow = this.row;
    return true;
  }
}
