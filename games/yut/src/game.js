// 윷놀이 진행 상태 (UI 없이 동작 — 시뮬레이션 도구에서도 그대로 사용)
//   던지기: 윷·모가 나오면 한 번 더. 나온 결과들을 원하는 말에 원하는 순서로 쓴다
//   업기: 내 말 위에 도착하면 함께 움직인다 · 잡기: 상대 말을 잡으면 대기로 돌려보내고 한 번 더
import { advance, nodeOf, GOAL } from './board.js';
import { throwYut, isBonus, NAMES } from './yut.js';

export const PIECES = 4;
const MAX_TURNS = 3000;

export class YutGame {
  constructor(names, rng = Math.random) {
    this.rng = rng;
    this.players = names.map((name, i) => ({
      name,
      human: i === 0,
      pieces: Array.from({ length: PIECES }, (_, k) => ({ id: `${i}-${k}`, path: [] })),
    }));
    this.turn = 0;
    this.phase = 'throw';
    this.pending = [];
    this.lastThrow = null;
    this.lastMove = null;
    this.winner = null;
    this.over = false;
    this.turns = 0;
    this.log = [];
  }

  _say(t) {
    this.log.push(t);
    if (this.log.length > 30) this.log.shift();
  }

  get current() {
    return this.players[this.turn];
  }

  done(p) {
    return p.pieces.filter((q) => nodeOf(q.path) === GOAL).length;
  }

  waiting(p) {
    return p.pieces.filter((q) => !q.path.length);
  }

  // 함께 움직이는 단위: 판 위 같은 칸의 말 묶음 + 대기 말 하나
  units(pi) {
    const out = new Map();
    for (const q of this.players[pi].pieces) {
      const node = nodeOf(q.path);
      if (node === GOAL) continue;
      const key = node ?? 'home';
      if (key === 'home' && out.has('home')) continue;
      if (!out.has(key)) out.set(key, { key, node, pieces: [] });
      out.get(key).pieces.push(q);
    }
    return [...out.values()];
  }

  // 지금 가능한 수: { v, key, dest, path }
  options(pi = this.turn) {
    if (this.phase !== 'move' || pi !== this.turn) return [];
    const res = [];
    for (const v of new Set(this.pending)) {
      for (const u of this.units(pi)) {
        const path = advance(u.pieces[0].path, v);
        if (!path) continue;
        res.push({ v, key: u.key, dest: nodeOf(path), path, size: u.pieces.length });
      }
    }
    return res;
  }

  throw() {
    if (this.over || this.phase !== 'throw') return null;
    const r = throwYut(this.rng);
    this.lastThrow = r;
    this.pending.push(r.value);
    this._say(`${this.current.name}: ${NAMES[r.value]}${isBonus(r.value) ? ' — 한 번 더!' : ''}`);
    if (!isBonus(r.value)) {
      this.phase = 'move';
      this._skipDead();
    }
    return r;
  }

  move(pi, v, key) {
    if (this.over || pi !== this.turn) return false;
    const opt = this.options(pi).find((o) => o.v === v && o.key === key);
    if (!opt) return false;
    const me = this.players[pi];
    const unit = this.units(pi).find((u) => u.key === key);
    const movers = key === 'home' ? [unit.pieces[0]] : unit.pieces;
    movers.forEach((q) => (q.path = [...opt.path]));
    this.pending.splice(this.pending.indexOf(v), 1);
    this.lastMove = { pi, dest: opt.dest };

    let text = `${me.name}: ${NAMES[v]}`;
    let caught = 0;
    if (opt.dest === GOAL) text += ` 완주! (${movers.length}개)`;
    else {
      // 업기: 같은 칸의 내 말들과 경로를 맞춘다
      me.pieces.forEach((q) => nodeOf(q.path) === opt.dest && (q.path = [...opt.path]));
      // 잡기
      this.players.forEach((p, i) => {
        if (i === pi) return;
        p.pieces.forEach((q) => {
          if (nodeOf(q.path) === opt.dest) {
            q.path = [];
            caught++;
          }
        });
      });
      const stack = me.pieces.filter((q) => nodeOf(q.path) === opt.dest).length;
      if (stack > 1) text += ` (${stack}개 업음)`;
      if (caught) text += ` 잡았다! 한 번 더`;
    }
    this._say(text);

    if (this.done(me) === PIECES) {
      this.over = true;
      this.winner = pi;
      this._say(`🏆 ${me.name} 승리!`);
      return true;
    }
    if (caught) this.phase = 'throw';
    else this._skipDead();
    return true;
  }

  // 쓸 수 없는 결과(움직일 말이 없는 빽도 등)는 버리고, 다 쓰면 다음 차례
  _skipDead() {
    if (this.phase !== 'move') return;
    const usable = new Set(this.options().map((o) => o.v));
    const dropped = this.pending.filter((v) => !usable.has(v));
    if (dropped.length) this._say(`${this.current.name}: ${dropped.map((v) => NAMES[v]).join(', ')} — 움직일 말이 없음`);
    this.pending = this.pending.filter((v) => usable.has(v));
    if (!this.pending.length) this._nextTurn();
  }

  _nextTurn() {
    this.turn = (this.turn + 1) % this.players.length;
    this.phase = 'throw';
    this.pending = [];
    if (++this.turns >= MAX_TURNS) {
      this.over = true;
      this._say('게임 종료');
    }
  }
}
