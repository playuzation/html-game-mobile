// 게임 진행 상태 (UI 없이 동작 — 시뮬레이션 도구에서도 그대로 사용)
// phase: 'roll' 주사위 · 'buy' 구매 결정 · 'upgrade' 건설 결정 · 'travel' 우주여행 목적지 · 'over'
import {
  TILES, SIZE, START_CASH, SALARY, FUND_FEE, ISLAND_TURNS, BUILD_NAMES,
  ownable, upgradeCost, invested, rent,
} from './board.js';
import { CARDS } from './cards.js';

const won = (n) => `${n}만`;

export class MarbleGame {
  constructor(names, { rounds = 20, rng = Math.random } = {}) {
    this.rng = rng;
    this.rounds = rounds;
    this.players = names.map((name, i) => ({ name, human: i === 0, cash: START_CASH, pos: 0, out: false, island: 0, space: false, outAt: 0 }));
    this.owners = TILES.map(() => ({ owner: -1, level: 0 }));
    this.fund = 0;
    this.round = 1;
    this.turn = 0;
    this.phase = 'roll';
    this.dice = null;
    this.doubles = 0;
    this.again = false;
    this.pending = null; // { tile, cost }
    this.walk = null;
    this.card = null;
    this.over = false;
    this.log = [];
    this.deck = this._shuffle();
  }

  _shuffle() {
    const d = CARDS.map((_, i) => i);
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  _say(t) {
    this.log.push(t);
    if (this.log.length > 40) this.log.shift();
  }

  get current() {
    return this.players[this.turn];
  }

  assets(pi) {
    const p = this.players[pi];
    return p.cash + this.owners.reduce((s, o, i) => s + (o.owner === pi ? invested(i, o.level) : 0), 0);
  }

  // 순위: 파산하지 않은 사람은 총자산 순, 파산한 사람은 늦게 파산한 순
  ranking() {
    return this.players
      .map((p, i) => ({ i, name: p.name, assets: this.assets(i), cash: p.cash, out: p.out, outAt: p.outAt }))
      .sort((a, b) => a.out - b.out || (a.out ? b.outAt - a.outAt : b.assets - a.assets));
  }

  // ---------- 행동 ----------
  roll() {
    if (this.phase !== 'roll' || this.over) return null;
    const p = this.current;
    const a = 1 + Math.floor(this.rng() * 6);
    const b = 1 + Math.floor(this.rng() * 6);
    this.dice = [a, b];
    this.card = null;
    this.walk = null;
    const dbl = a === b;
    this.again = false;

    if (p.island > 0) {
      if (!dbl) {
        p.island--;
        this._say(`${p.name}: 🎲 ${a}+${b} — 무인도 탈출 실패 (남은 ${p.island}턴)`);
        return this._endTurn(), this.dice;
      }
      p.island = 0;
      this._say(`${p.name}: 🎲 ${a}+${b} 더블! 무인도 탈출`);
    } else if (dbl) {
      this.doubles++;
      if (this.doubles === 3) {
        this._say(`${p.name}: 🎲 더블 3번! 무인도로...`);
        this._moveTo(this.turn, 8, false);
        p.island = ISLAND_TURNS;
        return this._endTurn(), this.dice;
      }
      this.again = true;
      this._say(`${p.name}: 🎲 ${a}+${b} 더블! (한 번 더)`);
    } else this._say(`${p.name}: 🎲 ${a}+${b}`);

    this._moveBy(this.turn, a + b);
    this._land(this.turn);
    if (this.phase === 'roll') this._after();
    return this.dice;
  }

  decide(yes) {
    if ((this.phase !== 'buy' && this.phase !== 'upgrade') || this.over) return false;
    const { tile, cost } = this.pending;
    const p = this.current;
    if (yes && p.cash >= cost) {
      p.cash -= cost;
      const o = this.owners[tile];
      if (this.phase === 'buy') {
        o.owner = this.turn;
        o.level = 0;
        this._say(`${p.name}: ${TILES[tile].name} 구매 (-${won(cost)})`);
      } else {
        o.level++;
        this._say(`${p.name}: ${TILES[tile].name}에 ${BUILD_NAMES[o.level]} 건설 (-${won(cost)})`);
      }
    }
    this.pending = null;
    this.phase = 'roll';
    this._after();
    return true;
  }

  travel(dest) {
    if (this.phase !== 'travel' || this.over || dest === 24 || dest < 0 || dest >= SIZE) return false;
    const p = this.current;
    p.space = false;
    this._say(`${p.name}: 🚀 ${TILES[dest].name}(으)로 우주여행`);
    this._moveTo(this.turn, dest, true);
    this.phase = 'roll';
    this._land(this.turn);
    if (this.phase === 'roll') this._after();
    return true;
  }

  // ---------- 내부 ----------
  _moveBy(pi, steps) {
    const p = this.players[pi];
    const to = (p.pos + steps) % SIZE;
    this.walk = { pi, from: p.pos, steps }; // 화면 애니메이션용
    if (p.pos + steps >= SIZE) this._salary(pi);
    p.pos = to;
  }

  _moveTo(pi, to, salary) {
    const p = this.players[pi];
    if (salary && to <= p.pos) this._salary(pi);
    p.pos = to;
  }

  _salary(pi) {
    this.players[pi].cash += SALARY;
    this._say(`${this.players[pi].name}: 출발지 통과 월급 +${won(SALARY)}`);
  }

  _land(pi) {
    const p = this.players[pi];
    const i = p.pos;
    const t = TILES[i];
    if (ownable(i)) {
      const o = this.owners[i];
      if (o.owner === -1) {
        if (p.cash >= t.price) this._ask('buy', i, t.price);
      } else if (o.owner === pi) {
        if (t.type === 'city' && o.level < 3 && p.cash >= upgradeCost(i, o.level)) this._ask('upgrade', i, upgradeCost(i, o.level));
      } else {
        const r = rent(i, this.owners);
        this._say(`${p.name}: ${t.name} 통행료 ${won(r)} → ${this.players[o.owner].name}`);
        this._pay(pi, r, o.owner);
      }
      return;
    }
    if (t.type === 'key') return this._drawCard(pi);
    if (t.type === 'island') {
      p.island = ISLAND_TURNS;
      this.again = false;
      return this._say(`${p.name}: 무인도에 갇혔다! (${ISLAND_TURNS}턴, 더블이면 탈출)`);
    }
    if (t.type === 'fund-pay') {
      this._say(`${p.name}: 사회복지기금 ${won(FUND_FEE)} 납부`);
      return this._pay(pi, FUND_FEE, 'fund');
    }
    if (t.type === 'fund-get') {
      this._say(`${p.name}: 사회복지기금 ${won(this.fund)} 수령!`);
      p.cash += this.fund;
      this.fund = 0;
      return;
    }
    if (t.type === 'space') {
      p.space = true;
      this.again = false;
      this._say(`${p.name}: 다음 차례에 원하는 곳으로 우주여행!`);
    }
  }

  _ask(kind, tile, cost) {
    this.phase = kind;
    this.pending = { tile, cost };
  }

  _drawCard(pi) {
    if (!this.deck.length) this.deck = this._shuffle();
    const c = CARDS[this.deck.pop()];
    const p = this.players[pi];
    this.card = c;
    this._say(`${p.name}: 🔑 ${c.text}`);
    if (c.kind === 'money') p.cash += c.amount;
    else if (c.kind === 'fund') this._pay(pi, c.amount, 'fund');
    else if (c.kind === 'tax') this._pay(pi, Math.round(p.cash * c.rate), 'fund');
    else if (c.kind === 'repair') {
      const levels = this.owners.reduce((s, o) => s + (o.owner === pi ? o.level : 0), 0);
      if (levels) this._pay(pi, levels * c.amount, 'fund');
    } else if (c.kind === 'birthday') {
      this.players.forEach((q, k) => k !== pi && !q.out && this._pay(k, c.amount, pi));
    } else if (c.kind === 'move') {
      this._moveTo(pi, c.to, !c.noSalary);
      this._land(pi);
    } else if (c.kind === 'back') {
      p.pos = (p.pos - c.steps + SIZE) % SIZE;
      this._land(pi);
    }
  }

  // 돈이 모자라면 싼 땅부터 반값에 팔고, 그래도 모자라면 파산
  _pay(pi, amount, to) {
    const p = this.players[pi];
    if (p.cash < amount) this._liquidate(pi, amount);
    const paid = Math.min(amount, p.cash);
    p.cash -= paid;
    if (to === 'fund') this.fund += paid;
    else if (to !== null) this.players[to].cash += paid;
    if (paid < amount) this._bankrupt(pi);
  }

  _liquidate(pi, need) {
    const p = this.players[pi];
    const mine = this.owners
      .map((o, i) => ({ i, o }))
      .filter(({ o }) => o.owner === pi)
      .sort((a, b) => invested(a.i, a.o.level) - invested(b.i, b.o.level));
    for (const { i, o } of mine) {
      if (p.cash >= need) break;
      const v = Math.floor(invested(i, o.level) / 2);
      p.cash += v;
      this._say(`${p.name}: ${TILES[i].name} 매각 (+${won(v)})`);
      o.owner = -1;
      o.level = 0;
    }
  }

  _bankrupt(pi) {
    const p = this.players[pi];
    p.out = true;
    p.outAt = this.round * 10 + this.log.length;
    p.cash = 0;
    this.owners.forEach((o) => o.owner === pi && Object.assign(o, { owner: -1, level: 0 }));
    this._say(`💥 ${p.name} 파산!`);
    if (pi === this.turn) this.again = false;
    if (this.players.filter((q) => !q.out).length <= 1) this._finish();
  }

  _after() {
    if (this.over) return;
    if (this.again && !this.current.out && !this.current.island) {
      this.phase = 'roll';
      return;
    }
    this._endTurn();
  }

  _endTurn() {
    if (this.over) return;
    this.doubles = 0;
    this.again = false;
    let t = this.turn;
    do {
      t = (t + 1) % this.players.length;
      if (t === 0) this.round++;
    } while (this.players[t].out);
    if (this.round > this.rounds) return this._finish();
    this.turn = t;
    this.phase = this.players[t].space ? 'travel' : 'roll';
  }

  _finish() {
    this.over = true;
    this.phase = 'over';
    this.pending = null;
    this.round = Math.min(this.round, this.rounds);
    const top = this.ranking()[0];
    this._say(`🏁 게임 종료! 1위 ${top.name} (총자산 ${won(top.assets)})`);
  }
}
