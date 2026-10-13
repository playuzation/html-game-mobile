// 방 파싱과 타일 규칙 (게임과 경로 검증 도구가 함께 쓰는 규칙의 단일 출처)
import { COLS, ROWS } from './rooms.js';

export const SOLID = new Set(['#', 'C', 'H', 'X']);
export const HAZARD = new Set(['^', '~']);
export const BREAKABLE = new Set(['C', 'H', 'X']);

// 보유 도구(inv: Set<string>)로 해당 블록을 부술 수 있는가
export function canBreak(tile, inv) {
  if (tile === 'C') return inv.has('p');
  if (tile === 'H') return inv.has('p') && inv.has('u');
  if (tile === 'X') return inv.has('w') && inv.has('x');
  return false;
}

export function maxJumps(inv) {
  return 1 + (inv.has('j') ? 1 : 0) + (inv.has('t') ? 1 : 0);
}

// 맵 문자열 → 2차원 배열, 시작/문 위치 추출
export function parseRoom(def) {
  const grid = def.map.map((row) => row.split(''));
  const room = { grid, doors: {}, start: null };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (c === '<') room.doors.L = { x, y };
      else if (c === '>') room.doors.R = { x, y };
      else if (c === 'S') {
        room.start = { x, y };
        grid[y][x] = '.';
      }
    }
  }
  return room;
}

export function tileAt(room, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return '#';
  return room.grid[y][x];
}

// 문으로 들어왔을 때 서는 칸 (문 바로 안쪽)
export function entryCell(room, side) {
  const d = room.doors[side];
  return { x: side === 'L' ? d.x + 1 : d.x - 1, y: d.y };
}

// 같은 종류로 이어진 블록 묶음 (한 번에 부서지는 단위)
export function blockGroup(room, x, y) {
  const t = tileAt(room, x, y);
  const out = [];
  const seen = new Set();
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    const k = cx + ',' + cy;
    if (seen.has(k) || tileAt(room, cx, cy) !== t) continue;
    seen.add(k);
    out.push([cx, cy]);
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return out;
}
