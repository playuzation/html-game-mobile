// 컴퓨터 플레이어의 판단 (규칙 기반)
//   easy  : 가능한 수 중 무작위
//   normal: 잡기·완주·지름길을 노리고, 상대에게 잡힐 위험이 큰 칸은 피한다
import { advance, nodeOf, distance, GOAL } from './board.js';
import { VALUES, PROB } from './yut.js';

export function chooseMove(game, pi, level = 'normal') {
  const opts = game.options(pi);
  if (!opts.length) return null;
  if (level === 'easy') return opts[Math.floor(game.rng() * opts.length)];

  const enemies = game.players.flatMap((p, i) => (i === pi ? [] : game.units(i)));
  // 해당 칸이 다음 상대 차례에 잡힐 확률 (대략)
  const risk = (node) => {
    if (!node || node === GOAL) return 0;
    let r = 0;
    for (const u of enemies) for (const v of VALUES) if (nodeOf(advance(u.pieces[0].path, v) || []) === node) r += PROB[v];
    return Math.min(r, 1);
  };
  const occupant = (node) =>
    game.players.reduce((n, p, i) => n + (i === pi ? 0 : p.pieces.filter((q) => nodeOf(q.path) === node).length), 0);
  const mine = game.players[pi].pieces;

  const score = (o) => {
    const unit = game.units(pi).find((u) => u.key === o.key);
    const from = unit.pieces[0].path;
    const n = o.key === 'home' ? 1 : o.size;
    let s = (distance(from) - distance(o.path)) * 2 * n;
    if (o.dest === GOAL) return s + 40 * n;
    const caught = occupant(o.dest);
    if (caught) s += 30 + caught * 10;
    if (o.dest === 'o5' || o.dest === 'o10' || o.dest === 'c') s += 6;
    const join = mine.filter((q) => nodeOf(q.path) === o.dest).length;
    if (join) s += 4 * join;
    s -= risk(o.dest) * 35 * (n + join);
    s += risk(nodeOf(from)) * 20 * n; // 위험한 칸에서 벗어나기
    if (o.v === -1) s -= 3;
    return s + game.rng();
  };
  return opts.reduce((a, b) => (score(b) > score(a) ? b : a));
}
