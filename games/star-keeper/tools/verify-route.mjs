// 경로 검증: 최소 방 이동 횟수가 OPTIMAL_MOVES 와 같은지, 갇히는 곳이 없는지 확인한다.
// 실행: node games/star-keeper/tools/verify-route.mjs
//
// 이동 모델 (실제 물리보다 보수적으로 잡음: 점프 3.6/7.2/10.8칸, 대시 3.2칸)
//   점프 높이 H: 1단 3, 2단 6, 3단 9칸
//   수평 이동 G: 제자리(머리 위 막힘) 1칸, 점프 중 4칸(2단 점프 시 6칸), 대시 보유 시 +3칸
import { ROOMS, ITEMS, OPTIMAL_MOVES, STAR_COUNT } from '../src/rooms.js';
import { parseRoom, tileAt, entryCell, SOLID, HAZARD, canBreak, maxJumps } from '../src/world.js';

const rooms = ROOMS.map(parseRoom);

function explore(room, start, inv) {
  const pass = (x, y) => {
    const t = tileAt(room, x, y);
    if (HAZARD.has(t)) return false;
    return !SOLID.has(t) || canBreak(t, inv);
  };
  const floor = (x, y) => SOLID.has(tileAt(room, x, y));
  const H = [3, 6, 9][maxJumps(inv) - 1];
  const dash = inv.has('w') ? 3 : 0;
  const G = (r) => (r === 0 ? 1 : inv.has('j') ? 6 : 4) + dash;

  const touched = new Set();
  const stands = new Set();
  const queue = [start];
  const key = (x, y) => x + ',' + y;
  stands.add(key(start.x, start.y));
  touched.add(key(start.x, start.y));

  const land = (x, y) => {
    let fy = y;
    while (pass(x, fy + 1)) touched.add(key(x, ++fy));
    if (!floor(x, fy + 1)) return; // 아래가 가시/물
    const k = key(x, fy);
    if (!stands.has(k)) {
      stands.add(k);
      queue.push({ x, y: fy });
    }
  };

  while (queue.length) {
    const { x, y } = queue.shift();
    for (let r = 0; r <= H; r++) {
      if (r > 0) {
        if (!pass(x, y - r)) break;
        touched.add(key(x, y - r));
      }
      for (const dir of [-1, 1]) {
        for (let d = 1; d <= G(r); d++) {
          const cx = x + dir * d;
          const cy = y - r;
          if (!pass(cx, cy)) break;
          touched.add(key(cx, cy));
          land(cx, cy);
        }
      }
    }
  }
  return { touched, stands };
}

function cellsOf(room, set, pred) {
  const out = [];
  for (const k of set) {
    const [x, y] = k.split(',').map(Number);
    if (pred(tileAt(room, x, y))) out.push({ x, y });
  }
  return out;
}

// 방 하나를 들어간 위치와 도구로 끝까지 탐색 (주울 수 있는 것은 모두 줍는다)
function settle(ri, start, inv) {
  const room = rooms[ri];
  inv = new Set(inv);
  let res;
  for (;;) {
    res = explore(room, start, inv);
    const items = cellsOf(room, res.touched, (t) => t in ITEMS).map((c) => tileAt(room, c.x, c.y));
    const before = inv.size;
    items.forEach((i) => inv.add(i));
    if (inv.size === before) break;
  }
  const stars = [...inv].filter((i) => ITEMS[i]?.star).length;
  const goal = stars === STAR_COUNT && cellsOf(room, res.touched, (t) => t === 'A').length > 0;
  const exits = cellsOf(room, res.touched, (t) => t === '<' || t === '>').map((c) => (tileAt(room, c.x, c.y) === '<' ? 'L' : 'R'));
  return { inv, goal, exits, res };
}

const invKey = (inv) => [...inv].sort().join('');
const startState = { ri: 0, side: 'S', inv: new Set() };
const stateKey = (s) => `${s.ri}|${s.side}|${invKey(s.inv)}`;
const startCell = (s) => (s.side === 'S' ? rooms[s.ri].start : entryCell(rooms[s.ri], s.side));

const dist = new Map([[stateKey(startState), 0]]);
const prev = new Map();
const states = new Map([[stateKey(startState), startState]]);
const queue = [startState];
let best = null;
const problems = [];

while (queue.length) {
  const s = queue.shift();
  const k = stateKey(s);
  const { inv, goal, exits, res } = settle(s.ri, startCell(s), s.inv);

  // 갇힘 검사: 갈 수 있는 모든 발판에서 문이나 제단에 다시 닿을 수 있어야 한다
  for (const sk of res.stands) {
    const [x, y] = sk.split(',').map(Number);
    const r = explore(rooms[s.ri], { x, y }, inv);
    const ok = cellsOf(rooms[s.ri], r.touched, (t) => t === '<' || t === '>' || t === 'A').length > 0;
    if (!ok) problems.push(`갇힘: 방 ${s.ri + 1} (${x},${y}) 도구 [${invKey(inv)}]`);
  }

  if (goal && best === null) best = { k, d: dist.get(k) };
  for (const side of exits) {
    const ri = side === 'L' ? s.ri - 1 : s.ri + 1;
    const n = { ri, side: side === 'L' ? 'R' : 'L', inv };
    const nk = stateKey(n);
    if (dist.has(nk)) continue;
    dist.set(nk, dist.get(k) + 1);
    prev.set(nk, k);
    states.set(nk, n);
    queue.push(n);
  }
}

if (!best) {
  console.error('❌ 엔딩에 도달할 수 없습니다');
  process.exit(1);
}

const path = [];
for (let k = best.k; k; k = prev.get(k)) path.unshift(k);
let last = '';
path.forEach((k, i) => {
  const s = states.get(k);
  const { inv } = settle(s.ri, startCell(s), s.inv);
  const got = invKey(inv).split('').filter((c) => !last.includes(c));
  last = invKey(inv);
  const gotText = got.length ? '  +' + got.map((c) => ITEMS[c].icon + ITEMS[c].name).join(', ') : '';
  console.log(`${String(i).padStart(2)}  ${s.ri + 1}. ${ROOMS[s.ri].name}${gotText}`);
});
console.log(`\n최소 방 이동: ${best.d} (목표 ${OPTIMAL_MOVES}) · 탐색한 상태 ${dist.size}개`);
problems.forEach((p) => console.error('⚠️ ' + p));
if (best.d !== OPTIMAL_MOVES || problems.length) process.exit(1);
console.log('✅ 검증 통과');
