// 윷판 정의와 말 이동 (아무것도 import 하지 않는 리프 모듈)
//
//   o10 ── o9 ─ o8 ─ o7 ─ o6 ── o5        o0  = 참먹이 (출발/도착)
//    │ b1                    a1 │         o5  = 모 (첫 모서리)  → 지름길 a
//   o11    b2            a2    o4         o10 = 뒷모            → 지름길 b
//   o12          c            o3         c   = 방 (가운데)      → 도착 쪽(b3) 지름길
//   o13    a3            b3    o2
//   o14 a4                    b4 o1
//   o15 ── o16 ─ o17 ─ o18 ─ o19 ── o0
//
// 말의 위치는 지나온 칸의 목록(path)으로 저장한다. 빈 목록 = 대기, 마지막이 GOAL = 완주.

export const GOAL = 'GOAL';

export const NODES = {};
for (let i = 0; i < 20; i++) {
  const side = Math.floor(i / 5);
  const k = (i % 5) * 20;
  NODES['o' + i] = [
    [100, 100 - k],
    [100 - k, 0],
    [0, k],
    [k, 100],
  ][side];
}
Object.assign(NODES, {
  a1: [83.3, 16.7], a2: [66.7, 33.3], c: [50, 50], a3: [33.3, 66.7], a4: [16.7, 83.3],
  b1: [16.7, 16.7], b2: [33.3, 33.3], b3: [66.7, 66.7], b4: [83.3, 83.3],
});

export const LINES = [
  ['o0', 'o5'], ['o5', 'o10'], ['o10', 'o15'], ['o15', 'o0'],
  ['o5', 'o15'], ['o10', 'o0'],
];
export const BIG = new Set(['o0', 'o5', 'o10', 'o15', 'c']);

const LINE_NEXT = { a1: 'a2', a2: 'c', a3: 'a4', a4: 'o15', b1: 'b2', b2: 'c', b3: 'b4', b4: GOAL };

function step(node, prev, first) {
  if (node === undefined) return 'o1'; // 대기 중인 말이 판에 들어옴
  if (first) {
    if (node === 'o5') return 'a1';
    if (node === 'o10') return 'b1';
    if (node === 'c') return 'b3';
  }
  if (node === 'c') return prev === 'a2' ? 'a3' : 'b3';
  if (LINE_NEXT[node]) return LINE_NEXT[node];
  const i = Number(node.slice(1));
  return i === 19 || i === 0 ? GOAL : 'o' + (i + 1);
}

// path 에서 n 칸 이동한 새 path (n = -1 은 빽도). 이동할 수 없으면 null
export function advance(path, n) {
  if (n < 0) {
    if (!path.length) return null;
    if (path.length === 1) return path[0] === 'o0' ? ['o0', 'o19'] : ['o0'];
    return path.slice(0, -1);
  }
  const out = [...path];
  for (let k = 0; k < n; k++) {
    const next = step(out[out.length - 1], out[out.length - 2], k === 0);
    out.push(next);
    if (next === GOAL) break;
  }
  return out;
}

export const nodeOf = (path) => (path.length ? path[path.length - 1] : null);

// 도착까지 남은 최소 칸 수 (지름길 포함)
export function distance(path) {
  for (let n = 1; n <= 30; n++) if (nodeOf(advance(path, n)) === GOAL) return n;
  return 30;
}
