// 플레이어: 달리기·다단 점프·발판 내려가기·칼 공격·피격 무적
import { PHYS as P, COMBAT as C } from './config.js';
import { moveBody } from './physics.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Player {
  constructor(stats) {
    this.stats = stats;
    this.w = P.W;
    this.h = P.H;
  }

  spawn(cx, cy) {
    Object.assign(this, {
      x: cx + (1 - this.w) / 2, y: cy + 1 - this.h, vx: 0, vy: 0, facing: 1,
      onGround: true, coyote: 0, buffer: 0, airJumps: 0, dropT: 0,
      atkT: 0, atkCd: 0, swing: 0, invuln: 0,
    });
  }

  get cx() {
    return this.x + this.w / 2;
  }

  // 공격 판정 상자 (공격 중일 때만)
  get hitbox() {
    if (this.atkT <= 0) return null;
    const r = C.ATK_RANGE * this.stats.range;
    return { x: this.facing > 0 ? this.x + this.w : this.x - r, y: this.y - 0.15, w: r, h: this.h + 0.3 };
  }

  update(dt, input, level) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir && this.atkT <= 0) this.facing = dir;
    if (this.onGround) {
      this.coyote = P.COYOTE;
      this.airJumps = this.stats.jumps - 1;
    } else this.coyote -= dt;
    this.buffer -= dt;
    this.dropT -= dt;
    this.atkT -= dt;
    this.atkCd -= dt;
    this.invuln -= dt;

    const speed = P.RUN * this.stats.speed;
    const acc = (this.onGround ? P.ACC_GROUND : P.ACC_AIR) * dt;
    this.vx += clamp(dir * speed - this.vx, -acc, acc);
    this.vy = Math.min(this.vy + P.GRAV * dt, P.MAX_FALL);

    if (this.buffer > 0) {
      if (input.down && this.onGround) {
        this.dropT = 0.25; // 발판 아래로 내려가기
        this.buffer = 0;
      } else if (this.coyote > 0) this._jump();
      else if (this.airJumps > 0) {
        this.airJumps--;
        this._jump();
      }
    }
    if (!input.jumpHeld && this.vy < -P.JUMP_CUT) this.vy = -P.JUMP_CUT;
    moveBody(this, dt, level);
  }

  _jump() {
    this.vy = -P.JUMP_V;
    this.buffer = 0;
    this.coyote = 0;
    this.onGround = false;
  }

  attack() {
    if (this.atkCd > 0) return false;
    this.atkT = C.ATK_TIME;
    this.atkCd = C.ATK_COOLDOWN;
    this.swing++;
    return true;
  }

  hurt(dmg, fromX) {
    if (this.invuln > 0) return false;
    this.stats.hp -= dmg;
    this.invuln = C.INVULN;
    this.vx = (this.cx < fromX ? -1 : 1) * C.KNOCK_X;
    this.vy = -C.KNOCK_Y;
    return true;
  }
}
