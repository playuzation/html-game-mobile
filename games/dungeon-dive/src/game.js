// 한 번의 도전(런): 층 진행, 전투, 줍기, 강화 선택, 죽음/클리어
// state: 'play' · 'choose'(강화 고르기) · 'dead' · 'win'
import { generate, tileAt } from './level.js';
import { Player } from './player.js';
import { spawnEnemy, updateProjectile } from './entities.js';
import { newStats, offer, take } from './upgrades.js';
import { makeRng } from './rng.js';
import { overlap } from './physics.js';
import { COMBAT, FLOORS, PHYS, STEP } from './config.js';

export class Game {
  constructor(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.stats = newStats(COMBAT.HP);
    this.player = new Player(this.stats);
    this.floor = 1;
    this.coins = 0;
    this.kills = 0;
    this.time = 0;
    this.events = []; // 화면 효과용 (main 이 소비)
    this.startFloor();
  }

  startFloor() {
    this.level = generate(this.floor, this.rng);
    this.enemies = [];
    this.items = [];
    this.shots = [];
    this.particles = [];
    for (const s of this.level.spawns) {
      if (s.type === 'c') this.items.push({ kind: 'coin', x: s.x + 0.3, y: s.y + 0.3, w: 0.4, h: 0.4, vx: 0, vy: 0 });
      else if (s.type === 'C') this.items.push({ kind: 'chest', x: s.x + 0.1, y: s.y + 0.3, w: 0.8, h: 0.7, open: false });
      else this.enemies.push(spawnEnemy(s, this.floor));
    }
    this.player.spawn(this.level.start.x, this.level.start.y);
    this.boss = this.enemies.find((e) => e.type === 'B') || null;
    this.state = 'play';
    this.acc = 0;
    this.say(this.boss ? `${this.floor}층 — 보스 등장!` : `${this.floor}층`);
  }

  say(text) {
    this.events.push({ type: 'msg', text });
  }

  get doorOpen() {
    return !this.boss || this.boss.dead;
  }

  update(dt, input) {
    this.particles = this.particles.filter((q) => (q.t -= dt) > 0);
    for (const q of this.particles) {
      q.vy += 25 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (this.state !== 'play') return;
    this.time += dt;
    if (input.consume('a')) this.player.buffer = PHYS.BUFFER;
    if (input.consume('b') && this.player.attack() && this.stats.dagger) {
      const p = this.player;
      this.shots.push({ kind: 'dagger', x: p.cx, y: p.y + 0.35, vx: p.facing * 13, vy: 0, w: 0.45, h: 0.15, life: 0.4, hostile: false, damage: this.stats.dmg });
    }
    this.acc = Math.min(this.acc + dt, 0.1);
    while (this.acc >= STEP && this.state === 'play') {
      this.acc -= STEP;
      this._step(STEP, input);
    }
  }

  _step(dt, input) {
    const p = this.player;
    const ctx = { level: this.level, player: p, shoot: (s) => this.shots.push(s), floor: this.floor };
    p.update(dt, input, this.level);

    // 공격
    const hb = p.hitbox;
    for (const e of this.enemies) {
      e.update(dt, ctx);
      if (hb && e.hitSwing !== p.swing && overlap(hb, e)) {
        e.hitSwing = p.swing;
        this._damage(e, this.stats.dmg, p.cx);
      }
      if (e.dead) continue;
      if (!overlap(p, e)) continue;
      // 밟기: 위에서 떨어지며 닿으면 적이 다친다
      if (e.stompable && p.vy > 2 && p.y + p.h - e.y < 0.45) {
        p.vy = -COMBAT.STOMP_BOUNCE;
        this._damage(e, this.stats.dmg, p.cx);
      } else this._hurt(e.damage, e.cx);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    // 투사체
    this.shots = this.shots.filter((s) => {
      if (!updateProjectile(s, dt, this.level)) return false;
      if (s.hostile && overlap(s, p)) {
        this._hurt(s.damage, s.x);
        return false;
      }
      if (!s.hostile) {
        const e = this.enemies.find((x) => !x.dead && overlap(s, x));
        if (e) {
          this._damage(e, s.damage, s.x - s.vx);
          return false;
        }
      }
      return true;
    });

    // 가시
    if (!this.stats.thorn) {
      for (let y = Math.floor(p.y); y <= Math.floor(p.y + p.h); y++)
        for (let x = Math.floor(p.x); x <= Math.floor(p.x + p.w); x++)
          if (tileAt(this.level, x, y) === '^' && overlap(p, { x: x + 0.1, y: y + 0.5, w: 0.8, h: 0.5 })) this._hurt(1, x + 0.5);
    }

    // 동전·상자
    for (const it of this.items) {
      if (it.kind === 'coin' && !it.taken) {
        if (this.stats.magnet) {
          const dx = p.cx - (it.x + 0.2);
          const dy = p.y + 0.45 - (it.y + 0.2);
          if (Math.hypot(dx, dy) < 4) {
            it.x += dx * dt * 6;
            it.y += dy * dt * 6;
          }
        }
        if (overlap(p, it)) {
          it.taken = true;
          this.coins++;
          this._burst(it.x + 0.2, it.y + 0.2, '#ffd54a', 5);
        }
      } else if (it.kind === 'chest' && !it.open && overlap(p, it)) {
        it.open = true;
        const heart = this.stats.hp < this.stats.maxHp && this.rng() < 0.5;
        if (heart) {
          this.stats.hp++;
          this.say('상자: 체력 +1');
        } else {
          const n = 5 + this.rng.int(6);
          this.coins += n;
          this.say(`상자: 동전 +${n}`);
        }
        this._burst(it.x + 0.4, it.y, '#ffd54a', 14);
      }
    }
    this.items = this.items.filter((it) => !it.taken);

    if (this.stats.hp <= 0) {
      this.state = 'dead';
      this.events.push({ type: 'dead' });
      return;
    }
    // 출구
    const d = this.level.exit;
    if (overlap(p, { x: d.x, y: d.y, w: 1, h: 1 })) {
      if (!this.doorOpen) return;
      if (this.floor >= FLOORS) {
        this.state = 'win';
        this.events.push({ type: 'win' });
      } else {
        this.state = 'choose';
        this.choices = offer(this.stats, this.rng);
        this.events.push({ type: 'choose' });
      }
    }
  }

  choose(i) {
    if (this.state !== 'choose') return;
    const u = this.choices[i];
    if (u) take(this.stats, u);
    this.floor++;
    this.startFloor();
  }

  _damage(e, dmg, fromX) {
    if (e.dead) return;
    e.hit(dmg, fromX);
    this._burst(e.cx, e.y + e.h / 2, '#ffffff', 4);
    if (!e.dead) return;
    this.kills++;
    this._burst(e.cx, e.y + e.h / 2, e.type === 'B' ? '#ff7043' : '#b39ddb', e.type === 'B' ? 40 : 10);
    if (e.type === 'B') this.say('보스 격파! 출구가 열렸다');
    if (this.stats.vamp && this.kills % 6 === 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp++;
      this.say('흡혈: 체력 +1');
    }
    if (this.rng() < 0.35) this.items.push({ kind: 'coin', x: e.cx - 0.2, y: e.y, w: 0.4, h: 0.4 });
  }

  _hurt(dmg, fromX) {
    if (this.player.hurt(dmg, fromX)) {
      this._burst(this.player.cx, this.player.y + 0.4, '#ff5252', 8);
      this.events.push({ type: 'hurt' });
    }
  }

  _burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const s = 2 + this.rng() * 5;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, t: 0.4 + this.rng() * 0.3, color });
    }
  }
}
