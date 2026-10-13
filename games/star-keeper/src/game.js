// 게임 규칙: 방 이동, 도구/스킬, 블록 파괴, 위험 지형, 표지판, 제단, 엔딩
import { ROOMS, ITEMS, STAR_COUNT, COLS } from './rooms.js';
import { parseRoom, tileAt, entryCell, SOLID, canBreak, maxJumps, blockGroup } from './world.js';
import { Player } from './player.js';
import { PHYS, STEP } from './config.js';

const BLOCK_MSG = {
  C: '금 간 바위다. 도구가 있으면 부술 수 있을 텐데.',
  H: '단단한 바위다. 곡괭이로는 흠집도 나지 않는다.',
  X: '수정 벽이다. 바람의 힘으로 부딪히면 깨질지도...',
};

export class Game {
  constructor() {
    this.onEvent = () => {};
    this.reset();
  }

  reset() {
    this.rooms = ROOMS.map(parseRoom);
    this.inv = new Set();
    this.ri = 0;
    this.moves = 0;
    this.deaths = 0;
    this.time = 0;
    this.done = false;
    this.acc = 0;
    this.flash = 0;
    this.particles = [];
    this.msg = null;
    this.player = new Player();
    const s = this.rooms[0].start;
    this.entry = { x: s.x, y: s.y, facing: 1 };
    this.player.spawn(s.x, s.y, 1);
    this.say(ROOMS[0].sign, 7);
  }

  get room() {
    return this.rooms[this.ri];
  }

  get stars() {
    return Object.keys(ITEMS).filter((k) => ITEMS[k].star && this.inv.has(k)).length;
  }

  say(text, sec = 3) {
    if (text) this.msg = { text, t: sec };
  }

  // --- player 가 사용하는 충돌 인터페이스 ---
  solid(x, y) {
    return SOLID.has(tileAt(this.room, x, y));
  }

  bump(x, y) {
    const t = tileAt(this.room, x, y);
    if (t !== 'X') return false;
    if (canBreak(t, this.inv)) return this._break(x, y), true;
    this.say(BLOCK_MSG.X);
    return false;
  }

  // --- 입력 ---
  action() {
    const p = this.player;
    const fx = p.facing > 0 ? Math.floor(p.x + p.w + 0.3) : Math.floor(p.x - 0.3);
    const [y0, y1] = [Math.floor(p.y), Math.floor(p.y + p.h - 1e-6)];
    let broke = false;
    let blocked = null;
    for (let y = y0; y <= y1; y++) {
      const t = tileAt(this.room, fx, y);
      if (t !== 'C' && t !== 'H') continue;
      if (canBreak(t, this.inv)) {
        this._break(fx, y);
        broke = true;
      } else blocked = t;
    }
    if (this.inv.has('p') && (broke || blocked)) p.swingT = 0.2;
    if (broke) return;
    if (this.inv.has('w') && p.tryDash()) return;
    if (blocked) this.say(BLOCK_MSG[blocked]);
    else if (!this.inv.has('w') && !this.inv.has('p')) this.say('아직 쓸 수 있는 도구가 없다.', 2);
  }

  up() {
    if (this._touching('A') && this.stars === STAR_COUNT) {
      this.done = true;
      this.onEvent('end');
    }
  }

  // --- 진행 ---
  update(dt, input) {
    if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
    this.flash = Math.max(0, this.flash - dt);
    this.particles = this.particles.filter((q) => (q.t -= dt) > 0);
    for (const q of this.particles) {
      q.vy += 30 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (this.done) return;
    this.time += dt;

    if (input.consume('a')) this.player.buffer = PHYS.BUFFER;
    if (input.consume('b')) this.action();
    if (input.consume('up')) this.up();

    this.acc = Math.min(this.acc + dt, 0.1);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.player.step(STEP, input, maxJumps(this.inv), this);
      if (this._checkCells()) {
        this.acc = 0;
        break;
      }
    }
  }

  _cells(pad = 0) {
    const p = this.player;
    const out = [];
    for (let y = Math.floor(p.y - pad); y <= Math.floor(p.y + p.h + pad - 1e-6); y++)
      for (let x = Math.floor(p.x - pad); x <= Math.floor(p.x + p.w + pad - 1e-6); x++) out.push([x, y]);
    return out;
  }

  _touching(tile) {
    return this._cells().some(([x, y]) => tileAt(this.room, x, y) === tile);
  }

  _overlap(x0, y0, x1, y1) {
    const p = this.player;
    return p.x < x1 && p.x + p.w > x0 && p.y < y1 && p.y + p.h > y0;
  }

  // 위험/아이템/문/표지판 판정. 방이 바뀌거나 죽으면 true
  _checkCells() {
    const p = this.player;
    for (const [x, y] of this._cells()) {
      const t = tileAt(this.room, x, y);
      if (t === '^' && this._overlap(x + 0.1, y + 0.5, x + 0.9, y + 1)) return this._die(), true;
      if (t === '~' && this._overlap(x, y + 0.3, x + 1, y + 1)) return this._die(), true;
      if (ITEMS[t] && this._overlap(x + 0.15, y + 0.15, x + 0.85, y + 0.85)) this._collect(x, y, t);
      if (t === '<' && p.cx < 0.6) return this._go(-1), true;
      if (t === '>' && p.cx > COLS - 0.6) return this._go(1), true;
      if (t === 'n') this.say(ROOMS[this.ri].sign, 1.5);
      if (t === 'A') {
        this.say(
          this.stars === STAR_COUNT
            ? '별의 제단 — ↑ 를 눌러 별 조각을 바친다'
            : `별의 제단 — 별 조각 ${this.stars}/${STAR_COUNT}. 모두 모아 오너라.`,
          1.5,
        );
      }
    }
    return false;
  }

  _collect(x, y, t) {
    this.inv.add(t);
    this.room.grid[y][x] = '.';
    const it = ITEMS[t];
    this.say(it.star ? `${it.msg} (${this.stars}/${STAR_COUNT})` : it.msg, 4);
    this._burst(x + 0.5, y + 0.5, '#ffe27a', 16);
    this.onEvent('item');
  }

  _break(x, y) {
    const t = tileAt(this.room, x, y);
    const color = t === 'X' ? '#9ff0ff' : t === 'H' ? '#9aa3ad' : '#b08a5e';
    for (const [bx, by] of blockGroup(this.room, x, y)) {
      this.room.grid[by][bx] = '.';
      this._burst(bx + 0.5, by + 0.5, color, 6);
    }
  }

  _burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, t: 0.5 + Math.random() * 0.3, color });
    }
  }

  _go(dir) {
    this.ri += dir;
    this.moves++;
    const side = dir > 0 ? 'L' : 'R';
    const c = entryCell(this.room, side);
    this.entry = { x: c.x, y: c.y, facing: dir };
    this.player.spawn(c.x, c.y, dir);
    this.msg = null;
    this.onEvent('room');
  }

  _die() {
    this.deaths++;
    this.flash = 0.35;
    this._burst(this.player.cx, this.player.y + 0.5, '#ffffff', 10);
    this.player.spawn(this.entry.x, this.entry.y, this.entry.facing);
    this.onEvent('die');
  }
}
