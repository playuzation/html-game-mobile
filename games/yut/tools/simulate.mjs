// 규칙 검증: 컴퓨터끼리 대량으로 대전시켜 말 보존·칸 충돌·종료를 확인한다
// 실행: node games/yut/tools/simulate.mjs [판 수]
import { YutGame, PIECES } from '../src/game.js';
import { chooseMove } from '../src/ai.js';
import { nodeOf, GOAL, NODES } from '../src/board.js';

const GAMES = Number(process.argv[2]) || 3000;
const wins = { normal: 0, easy: 0 };
let stalls = 0;
let maxTurns = 0;

function check(g) {
  const owner = new Map();
  g.players.forEach((p, i) => {
    if (p.pieces.length !== PIECES) throw new Error('말 개수 불일치');
    for (const q of p.pieces) {
      const node = nodeOf(q.path);
      if (node === null || node === GOAL) continue;
      if (!(node in NODES)) throw new Error('없는 칸: ' + node);
      if (owner.has(node) && owner.get(node) !== i) throw new Error('한 칸에 두 팀: ' + node);
      owner.set(node, i);
    }
  });
}

for (let i = 0; i < GAMES; i++) {
  const n = 2 + (i % 3);
  const levels = Array.from({ length: n }, (_, k) => ((k + i) % 2 ? 'normal' : 'easy'));
  const g = new YutGame(levels.map((_, k) => `P${k}`));
  while (!g.over) {
    if (g.phase === 'throw') g.throw();
    else {
      const m = chooseMove(g, g.turn, levels[g.turn]);
      if (!m || !g.move(g.turn, m.v, m.key)) throw new Error('이동 실패');
    }
    check(g);
  }
  maxTurns = Math.max(maxTurns, g.turns);
  if (g.winner === null) stalls++;
  else wins[levels[g.winner]]++;
}

console.log(`${GAMES}판 완료 · 최대 ${maxTurns}턴 · 교착 ${stalls}판`);
console.log(`승리: 보통 AI ${wins.normal} / 쉬움 AI ${wins.easy}`);
if (stalls) throw new Error('교착 상태 발생');
console.log('✅ 말 보존, 칸 충돌·교착 없음');
