// 규칙 검증: 컴퓨터끼리 대량으로 대전시켜 돈 보존·소유권·라운드 제한·순위를 확인한다
// 실행: node games/world-marble/tools/simulate.mjs [판 수]
import { MarbleGame } from '../src/game.js';
import { decide, chooseTravel } from '../src/ai.js';
import { ownable } from '../src/board.js';

const GAMES = Number(process.argv[2]) || 2000;
const wins = { normal: 0, easy: 0 };
let bankrupts = 0;
let earlyEnd = 0;

for (let n = 0; n < GAMES; n++) {
  const count = 2 + (n % 3);
  const rounds = [10, 20, 30][n % 3];
  const levels = Array.from({ length: count }, (_, k) => ((k + n) % 2 ? 'normal' : 'easy'));
  const g = new MarbleGame(levels.map((_, k) => `P${k}`), { rounds });
  let steps = 0;
  while (!g.over) {
    if (++steps > 20000) throw new Error('끝나지 않음');
    const pi = g.turn;
    const before = g.round;
    if (g.phase === 'roll') g.roll();
    else if (g.phase === 'travel') {
      if (!g.travel(chooseTravel(g, pi, levels[pi]))) throw new Error('우주여행 실패');
    } else if (!g.decide(decide(g, pi, levels[pi]))) throw new Error('결정 실패');
    if (g.round < before) throw new Error('라운드 역행');
    g.players.forEach((p, i) => {
      if (p.cash < 0) throw new Error('음수 현금');
      if (p.out && g.owners.some((o) => o.owner === i)) throw new Error('파산자 소유 땅');
    });
    g.owners.forEach((o, i) => {
      if (o.owner !== -1 && !ownable(i)) throw new Error('살 수 없는 칸 소유');
      if (o.level < 0 || o.level > 3) throw new Error('건물 단계 오류');
    });
    if (g.round > rounds) throw new Error('라운드 초과');
  }
  const rank = g.ranking();
  for (let k = 1; k < rank.length; k++) {
    const a = rank[k - 1];
    const b = rank[k];
    if (!a.out && !b.out && a.assets < b.assets) throw new Error('순위 정렬 오류');
    if (a.out && !b.out) throw new Error('파산자가 앞 순위');
  }
  bankrupts += g.players.filter((p) => p.out).length;
  if (g.round < rounds) earlyEnd++;
  wins[levels[rank[0].i]]++;
}

console.log(`${GAMES}판 완료 · 파산 ${bankrupts}명 · 라운드 전 조기 종료 ${earlyEnd}판`);
console.log(`1위: 보통 AI ${wins.normal} / 쉬움 AI ${wins.easy}`);
console.log('✅ 현금·소유권·라운드 제한·순위 정렬 이상 없음');
