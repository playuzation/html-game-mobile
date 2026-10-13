// 게임 규칙: 이동, 충돌, 카메라, 점수
import { COLS, DIRS, CAMERA_OFFSET, CREEP_SPEED } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';

export class Game {
  constructor() {
    this.world = new World();
    this.player = new Player();
    this.onDeath = null;
    this.reset();
  }

  reset() {
    this.world.reset();
    this.player.reset();
    this.camY = -CAMERA_OFFSET;   // 화면 맨 아래에 보이는 줄
    this.score = 0;
    this.started = false;
  }

  move(dir) {
    const p = this.player;
    if (p.dead) return;
    if (p.hopping) {
      p.queued = dir;
      return;
    }
    const [dx, dr] = DIRS[dir];
    const tx = Math.round(p.x) + dx;
    const tr = p.row + dr;
    p.dir = dir;
    if (this.world.isBlocked(tr, tx)) return;
    this.started = true;
    p.startHop(tx, tr, dir);
  }

  update(dt, visibleRows) {
    const p = this.player;
    this.world.update(dt, Math.floor(this.camY) - 1, Math.ceil(this.camY + visibleRows) + 1);

    if (p.dead) {
      p.deadT += dt;
      return;
    }

    if (p.update(dt)) {
      this.score = Math.max(this.score, p.row);
      if (p.queued) {
        const q = p.queued;
        p.queued = null;
        this.move(q);
      }
    }

    const lane = this.world.get(p.collisionRow);
    const cx = p.x + 0.5;
    if (lane.type === 'road' && this.world.carHit(lane, cx)) return this._die('car');
    if (lane.type === 'water' && !p.hopping) {
      if (!this.world.logAt(lane, cx)) return this._die('water');
      p.x += lane.dir * lane.speed * dt;
      if (p.x < -0.4 || p.x > COLS - 0.6) return this._die('water');
    }

    // 카메라: 플레이어를 따라가되, 시작 후에는 천천히 강제 전진
    if (this.started) this.camY += CREEP_SPEED * dt;
    const target = p.visualRow - CAMERA_OFFSET;
    if (target > this.camY) this.camY += (target - this.camY) * Math.min(1, dt * 5);
    if (p.row < this.camY - 0.3) this._die('eagle');
  }

  _die(cause) {
    const p = this.player;
    p.dead = cause;
    p.deadT = 0;
    if (this.onDeath) this.onDeath(cause);
  }
}
