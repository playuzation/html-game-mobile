// 플레이어 물리: 달리기, 다단 점프, 대시, 타일 충돌
// 충돌 대상은 world 객체(solid(x,y), bump(x,y))로 주입받는다
import { PHYS as P } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Player {
  constructor() {
    this.w = P.W;
    this.h = P.H;
    this.spawn(0, 0, 1);
  }

  spawn(cellX, cellY, facing) {
    this.x = cellX + (1 - this.w) / 2;
    this.y = cellY + 1 - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.onGround = true;
    this.coyote = 0;
    this.buffer = 0;
    this.airJumps = 0;
    this.dashT = 0;
    this.dashCd = 0;
    this.canAirDash = true;
    this.swingT = 0;
  }

  get cx() {
    return this.x + this.w / 2;
  }

  get dashing() {
    return this.dashT > 0;
  }

  tryDash() {
    if (this.dashT > 0 || this.dashCd > 0 || (!this.onGround && !this.canAirDash)) return false;
    if (!this.onGround) this.canAirDash = false;
    this.dashT = P.DASH_T;
    this.dashCd = P.DASH_T + P.DASH_CD;
    this.vy = 0;
    return true;
  }

  step(dt, input, jumpsMax, world) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir && !this.dashing) this.facing = dir;
    if (this.onGround) {
      this.coyote = P.COYOTE;
      this.airJumps = jumpsMax - 1;
      this.canAirDash = true;
    } else this.coyote -= dt;
    this.buffer -= dt;
    this.dashCd -= dt;
    this.swingT -= dt;

    if (this.dashing) {
      this.dashT -= dt;
      this.vx = this.facing * P.DASH_V;
      this.vy = 0;
      if (!this.dashing) this.vx = dir * P.RUN;
    } else {
      const acc = (this.onGround ? P.ACC_GROUND : P.ACC_AIR) * dt;
      this.vx += clamp(dir * P.RUN - this.vx, -acc, acc);
      this.vy = Math.min(this.vy + P.GRAV * dt, P.MAX_FALL);
      if (this.buffer > 0) {
        if (this.coyote > 0) this._jump();
        else if (this.airJumps > 0) {
          this.airJumps--;
          this._jump();
        }
      }
      if (!input.jumpHeld && this.vy < -P.JUMP_CUT) this.vy = -P.JUMP_CUT;
    }

    this.x += this.vx * dt;
    this._collideX(world);
    this.y += this.vy * dt;
    this._collideY(world);
  }

  _jump() {
    this.vy = -P.JUMP_V;
    this.buffer = 0;
    this.coyote = 0;
    this.onGround = false;
  }

  _rows() {
    return [Math.floor(this.y), Math.floor(this.y + this.h - 1e-6)];
  }

  _collideX(world) {
    if (this.vx === 0) return;
    const [y0, y1] = this._rows();
    const tx = this.vx > 0 ? Math.floor(this.x + this.w - 1e-6) : Math.floor(this.x);
    for (let ty = y0; ty <= y1; ty++) {
      if (!world.solid(tx, ty)) continue;
      if (this.dashing && world.bump(tx, ty)) continue; // 부서졌으면 통과
      this.x = this.vx > 0 ? tx - this.w : tx + 1;
      this.vx = 0;
      this.dashT = 0;
      return;
    }
  }

  _collideY(world) {
    const x0 = Math.floor(this.x);
    const x1 = Math.floor(this.x + this.w - 1e-6);
    if (this.vy !== 0) {
      const ty = this.vy > 0 ? Math.floor(this.y + this.h - 1e-6) : Math.floor(this.y);
      for (let tx = x0; tx <= x1; tx++) {
        if (!world.solid(tx, ty)) continue;
        this.y = this.vy > 0 ? ty - this.h : ty + 1;
        this.vy = 0;
        break;
      }
    }
    const below = Math.floor(this.y + this.h + 0.01);
    this.onGround = this.vy >= 0 && (world.solid(x0, below) || world.solid(x1, below));
  }
}
