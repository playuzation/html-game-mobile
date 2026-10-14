// 컴퓨터 플레이어의 판단 (규칙 기반)
//   easy  : 반쯤은 무작위로 사고 짓는다
//   normal: 통행료를 낼 비상금을 남기고 사며, 같은 색 독점·남은 라운드를 고려한다
import { TILES, SIZE, ownable, rent, upgradeCost } from './board.js';

const reserve = (game) => (game.rounds - game.round <= 2 ? 10 : 40);

export function decide(game, pi, level = 'normal') {
  const { tile, cost } = game.pending;
  const cash = game.players[pi].cash;
  if (level === 'easy') return game.rng() < 0.6;
  const t = TILES[tile];
  let keep = reserve(game);
  if (game.phase === 'buy' && t.type === 'city') {
    const group = TILES.map((x, k) => k).filter((k) => TILES[k].group === t.group);
    const mine = group.filter((k) => game.owners[k].owner === pi).length;
    if (mine === group.length - 1) keep = 0; // 독점 완성
  }
  return cash - cost >= keep;
}

export function chooseTravel(game, pi, level = 'normal') {
  const options = [...Array(SIZE).keys()].filter((i) => i !== 24);
  if (level === 'easy') return options[Math.floor(game.rng() * options.length)];
  const cash = game.players[pi].cash;
  const score = (i) => {
    const o = game.owners[i];
    const t = TILES[i];
    if (ownable(i)) {
      if (o.owner === -1) return cash >= t.price ? 10 + t.price : -5;
      if (o.owner === pi) return t.type === 'city' && o.level < 3 && cash >= upgradeCost(i, o.level) ? 15 + t.price : 2;
      return -rent(i, game.owners);
    }
    if (t.type === 'fund-get') return game.fund;
    if (i === 0) return 20; // 월급
    if (t.type === 'key') return 5;
    if (t.type === 'island' || t.type === 'fund-pay') return -20;
    return 0;
  };
  return options.reduce((a, b) => (score(b) > score(a) ? b : a));
}
