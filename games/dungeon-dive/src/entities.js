// 적·투사체. ctx = { level, player, shoot(proj), floor }
import { PHYS as P } from './config.js';
import { moveBody } from './physics.js';
import { tileAt, isSolid } from './level.js';

const scale = (floor) => 1 + (floor - 1) * 0.15;

class Enemy {
  constructor(type, x, y, w, h, hp, floor) {
    Object.assign(this, { type, w, h, vx: 0, vy: 0, facing: -1, flash: 0, dead: false, onGround: false, hitSwing: -1, t: 0 });
    this.x = x + (1 - w) / 2;
    this.y = y + 1 - h;
    this.maxHp = this.hp = Math.round(hp * scale(floor));
    this.damage = 1;
    this.stompable = true;
  }

  get cx() {
    return this.x + this.w / 2;
  }

  hit(dmg, fromX) {
    this.hp -= dmg;
    this.flash = 0.15;
    if (this.type !== 'B') this.vx = (this.cx < fromX ? -1 : 1) * 4;
    if (this.hp <= 0) this.dead = true;
  }

  _gravity(dt, level) {
    this.vy = Math.min(this.vy + P.GRAV * dt, P.MAX_FALL);
    return moveBody(this, dt, level);
  }
}

// 슬라임: 좌우로 순찰, 벽이나 낭떠러지에서 돈다
export class Slime extends Enemy {
  constructor(x, y, floor) {
    super('e', x, y, 0.8, 0.6, 2, floor);
    this.speed = 1.5 + floor * 0.1;
  }
  update(dt, { level }) {
    this.flash -= dt;
    const ahead = Math.floor(this.facing > 0 ? this.x + this.w + 0.05 : this.x - 0.05);
    const below = Math.floor(this.y + this.h + 0.1);
    const ground = tileAt(level, ahead, below);
    if (this.onGround && !isSolid(ground) && ground !== '=') this.facing *= -1;
    this.vx += (this.facing * this.speed - this.vx) * Math.min(1, dt * 8);
    if (this._gravity(dt, level).wall) this.facing *= -1;
  }
}

// 박쥐: 가까워지면 흔들리며 날아온다 (벽 통과)
export class Bat extends Enemy {
  constructor(x, y, floor) {
    super('b', x, y, 0.7, 0.5, 1, floor);
    this.awake = false;
    this.speed = 2.6 + floor * 0.12;
  }
  update(dt, { player }) {
    this.flash -= dt;
    this.t += dt;
    const dx = player.cx - this.cx;
    const dy = player.y + player.h / 2 - (this.y + this.h / 2);
    const d = Math.hypot(dx, dy);
    if (!this.awake && d < 6) this.awake = true;
    if (!this.awake) return;
    this.facing = dx > 0 ? 1 : -1;
    this.vx += ((dx / d) * this.speed - this.vx) * Math.min(1, dt * 3);
    this.vy += ((dy / d) * this.speed + Math.sin(this.t * 6) * 2 - this.vy) * Math.min(1, dt * 3);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

// 궁수: 제자리에서 플레이어를 향해 화살
export class Archer extends Enemy {
  constructor(x, y, floor) {
    super('a', x, y, 0.7, 0.95, 2, floor);
    this.cool = 1 + Math.random();
    this.rate = Math.max(1.2, 2.4 - floor * 0.1);
  }
  update(dt, { level, player, shoot }) {
    this.flash -= dt;
    this.vx *= 0.85;
    this._gravity(dt, level);
    const dx = player.cx - this.cx;
    this.facing = dx > 0 ? 1 : -1;
    this.cool -= dt;
    if (this.cool <= 0 && Math.abs(dx) < 9 && Math.abs(player.y - this.y) < 2.5) {
      this.cool = this.rate;
      shoot({ kind: 'arrow', x: this.cx, y: this.y + 0.35, vx: this.facing * 7, vy: 0, w: 0.5, h: 0.12, life: 3, hostile: true, damage: 1 });
    }
  }
}

// 보스 골렘: 다가오다가 뛰어올라 착지하면 양쪽으로 충격파
export class Golem extends Enemy {
  constructor(x, y, floor) {
    super('B', x, y, 1.8, 2.2, floor >= 10 ? 32 : 22, 1);
    this.damage = 2;
    this.stompable = false;
    this.cool = 2.5;
    this.air = false;
  }
  update(dt, { level, player, shoot }) {
    this.flash -= dt;
    this.t += dt;
    const dx = player.cx - this.cx;
    if (this.onGround) {
      if (this.air) {
        this.air = false;
        for (const s of [-1, 1]) shoot({ kind: 'wave', x: this.cx, y: this.y + this.h - 0.5, vx: s * 6, vy: 0, w: 0.6, h: 0.5, life: 1.6, hostile: true, damage: 1 });
      }
      this.facing = dx > 0 ? 1 : -1;
      this.vx = this.facing * (this.hp < this.maxHp / 2 ? 2.4 : 1.6);
      this.cool -= dt;
      if (this.cool <= 0) {
        this.cool = this.hp < this.maxHp / 2 ? 1.8 : 2.6;
        this.vy = -15;
        this.vx = Math.max(-5, Math.min(5, dx * 1.2));
        this.air = true;
      }
    }
    this._gravity(dt, level);
  }
}

export function spawnEnemy(s, floor) {
  if (s.type === 'e') return new Slime(s.x, s.y, floor);
  if (s.type === 'b') return new Bat(s.x, s.y, floor);
  if (s.type === 'a') return new Archer(s.x, s.y, floor);
  return new Golem(s.x, s.y, floor);
}

// 투사체 이동: 벽에 닿거나 수명이 다하면 사라짐
export function updateProjectile(p, dt, level) {
  p.life -= dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  const tx = Math.floor(p.x + (p.vx > 0 ? p.w : 0));
  if (isSolid(tileAt(level, tx, Math.floor(p.y + p.h / 2))) && p.kind !== 'wave') p.life = 0;
  return p.life > 0;
}
