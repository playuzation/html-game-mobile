// 도시 지도: 도로 격자, 건물, 주차장, 콘 코스 (아무것도 import 하지 않는 리프 모듈)
// 좌표 단위 m, x 오른쪽 · y 아래쪽
export const SIZE = 400;
export const ROAD_W = 14;
export const ROADS = [50, 150, 250, 350]; // 가로·세로 도로 중심선
export const SPOT = { W: 2.8, L: 5.6 };

const half = ROAD_W / 2;
const onRoadLine = (v) => ROADS.some((r) => Math.abs(v - r) <= half);

// 구역(도로 사이 블록)
const BLOCK_EDGES = [0, ...ROADS.flatMap((r) => [r - half, r + half]), SIZE];
const blocks = [];
for (let i = 0; i < BLOCK_EDGES.length; i += 2)
  for (let j = 0; j < BLOCK_EDGES.length; j += 2)
    blocks.push({ x0: BLOCK_EDGES[i], x1: BLOCK_EDGES[i + 1], y0: BLOCK_EDGES[j], y1: BLOCK_EDGES[j + 1], i: i / 2, j: j / 2 });

const isLot = (b) => b.i === 1 && b.j === 1;
const isCourse = (b) => b.i === 3 && b.j === 3;
export const LOT = blocks.find(isLot);
export const COURSE = blocks.find(isCourse);

// 건물: 블록마다 인도(4m)를 남기고 2×2 로 나눈 뒤 일부를 빈터로
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export const BUILDINGS = [];
for (const b of blocks) {
  if (isLot(b) || isCourse(b)) continue;
  const m = 4;
  const x0 = b.x0 + m;
  const y0 = b.y0 + m;
  const w = b.x1 - b.x0 - m * 2;
  const h = b.y1 - b.y0 - m * 2;
  if (w < 10 || h < 10) continue;
  const cols = w > 60 ? 2 : 1;
  const rows = h > 60 ? 2 : 1;
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      if (rnd() < 0.18) continue;
      const cw = w / cols;
      const rh = h / rows;
      const pad = 2 + rnd() * 4;
      BUILDINGS.push({ x: x0 + c * cw + pad, y: y0 + r * rh + pad, w: cw - pad * 2, h: rh - pad * 2, color: ['#8d99ae', '#a3b1c6', '#b8a99a', '#9fb4a0', '#c2a68c'][Math.floor(rnd() * 5)] });
    }
}

// 주차 칸: 주차장 안에 두 줄씩 마주보는 칸 3세트
export const SPOTS = [];
{
  const x0 = LOT.x0 + 8;
  const n = Math.floor((LOT.x1 - LOT.x0 - 16) / SPOT.W);
  for (const rowY of [LOT.y0 + 8, LOT.y0 + 8 + SPOT.L + 7, LOT.y0 + 8 + SPOT.L * 2 + 14, LOT.y0 + 8 + SPOT.L * 3 + 21]) {
    for (let k = 0; k < n; k++) SPOTS.push({ x: x0 + k * SPOT.W, y: rowY, w: SPOT.W, h: SPOT.L });
  }
}

// 콘: 슬라럼 줄 + 출발 게이트
export const CONES = [];
{
  const cx = (COURSE.x0 + COURSE.x1) / 2;
  for (let k = 0; k < 7; k++) CONES.push({ x: cx + (k % 2 ? 4 : -4), y: COURSE.y0 + 14 + k * 9 });
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) CONES.push({ x: cx + s * (12 + k * 3), y: COURSE.y1 - 10 });
}

// 표면 종류: 'road' | 'lot' | 'grass'
export function surfaceAt(x, y) {
  if (onRoadLine(x) || onRoadLine(y)) return 'road';
  if (x >= LOT.x0 && x <= LOT.x1 && y >= LOT.y0 && y <= LOT.y1) return 'lot';
  if (x >= COURSE.x0 && x <= COURSE.x1 && y >= COURSE.y0 && y <= COURSE.y1) return 'lot';
  return 'grass';
}

export const START = { x: ROADS[1] + half / 2, y: 200, heading: -Math.PI / 2 };
