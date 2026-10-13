// 게임 진행 상태 (UI 없이 동작 — 시뮬레이션 도구에서도 그대로 사용)
import { createDeck, shuffle, label, SUIT_NAME } from './cards.js';
import { canPlay, attackValue, isSpecial, HAND_LIMIT, START_HAND } from './rules.js';

const MAX_TURNS = 2000; // 아무도 낼 수 없는 교착 상태 방지

export class OneCardGame {
  // names[0] 이 사람 플레이어
  constructor(names, rng = Math.random) {
    this.rng = rng;
    this.players = names.map((name, i) => ({ name, hand: [], out: false, human: i === 0 }));
    this.deck = shuffle(createDeck(), rng);
    this.pile = [];
    this.turn = 0;
    this.dir = 1;
    this.penalty = 0;
    this.suit = null;
    this.oneCard = null; // 원카드를 외쳐야 하는 플레이어
    this.winner = null;
    this.over = false;
    this.turns = 0;
    this.log = [];

    for (let k = 0; k < START_HAND; k++) for (const p of this.players) p.hand.push(this.deck.pop());
    // 첫 카드는 기능 없는 숫자 카드로
    let i = this.deck.findIndex((c) => !isSpecial(c));
    this.pile.push(this.deck.splice(i, 1)[0]);
  }

  get top() {
    return this.pile[this.pile.length - 1];
  }

  get state() {
    return { top: this.top, suit: this.suit, penalty: this.penalty };
  }

  get current() {
    return this.players[this.turn];
  }

  legal(pi) {
    return this.players[pi].hand.filter((c) => canPlay(c, this.state));
  }

  _say(text) {
    this.log.push(text);
    if (this.log.length > 30) this.log.shift();
  }

  _next(steps = 1) {
    let t = this.turn;
    for (let s = 0; s < steps; s++) {
      do t = (t + this.dir + this.players.length) % this.players.length;
      while (this.players[t].out);
    }
    this.turn = t;
    if (++this.turns >= MAX_TURNS) this._finish(null);
  }

  _drawCards(pi, n) {
    const p = this.players[pi];
    let got = 0;
    for (let k = 0; k < n; k++) {
      if (!this.deck.length) {
        if (this.pile.length <= 1) break;
        const top = this.pile.pop();
        this.deck = shuffle(this.pile, this.rng);
        this.pile = [top];
      }
      p.hand.push(this.deck.pop());
      got++;
    }
    if (this.oneCard === pi && p.hand.length > 1) this.oneCard = null;
    if (p.hand.length >= HAND_LIMIT) {
      p.out = true;
      this.deck.unshift(...p.hand.splice(0));
      this._say(`💥 ${p.name} 파산! (${HAND_LIMIT}장)`);
      const alive = this.players.filter((q) => !q.out);
      if (alive.length === 1 || p.human) this._finish(alive.length === 1 ? this.players.indexOf(alive[0]) : null);
    }
    return got;
  }

  play(pi, cardId, chosenSuit = null) {
    if (this.over || pi !== this.turn) return false;
    const p = this.players[pi];
    const card = p.hand.find((c) => c.id === cardId);
    if (!card || !canPlay(card, this.state)) return false;

    p.hand.splice(p.hand.indexOf(card), 1);
    this.pile.push(card);
    this.suit = null;
    const atk = attackValue(card);
    let text = `${p.name}: ${label(card)}`;
    if (atk) {
      this.penalty += atk;
      text += ` 공격! (누적 +${this.penalty})`;
    }
    if (card.rank === '7') {
      this.suit = chosenSuit || 'S';
      text += ` → ${SUIT_NAME[this.suit]}`;
    }
    if (card.rank === 'Q') {
      this.dir = -this.dir;
      text += ' 방향 전환';
    }
    if (card.rank === 'J') text += ' 건너뛰기';
    if (card.rank === 'K') text += ' 한 번 더';
    this._say(text);

    if (!p.hand.length) return this._finish(pi), true;
    if (p.hand.length === 1) this.oneCard = pi;

    if (card.rank === 'K') return true;
    this._next(card.rank === 'J' ? 2 : 1);
    return true;
  }

  draw(pi) {
    if (this.over || pi !== this.turn) return false;
    const p = this.players[pi];
    const n = this.penalty || 1;
    const got = this._drawCards(pi, n);
    this._say(this.penalty ? `${p.name}: 공격을 받아 ${got}장` : `${p.name}: 한 장 뽑음`);
    this.penalty = 0;
    if (!this.over) this._next();
    return true;
  }

  // 원카드 외치기: 본인이 외치면 안전, 다른 사람이 먼저 외치면 대상이 1장 뽑는다
  declare(caller) {
    const target = this.oneCard;
    if (target === null || this.over) return null;
    this.oneCard = null;
    if (caller === target) {
      this._say(`📣 ${this.players[caller].name}: 원카드!`);
      return 'safe';
    }
    this._say(`📣 ${this.players[caller].name}가 먼저 외쳤다! ${this.players[target].name} +1장`);
    this._drawCards(target, 1);
    return 'caught';
  }

  _finish(winner) {
    this.over = true;
    this.winner = winner;
    this.oneCard = null;
    this._say(winner === null ? '게임 종료' : `🏆 ${this.players[winner].name} 승리!`);
  }
}
