// 층 생성: 조각을 무작위로 이어 붙이고, 시작→출구 도달 가능성을 검사해 실패하면 다시 만든다
import { CHUNKS, START, EXIT, BOSS, CHUNK_W, CHUNK_H } from './chunks.js';
import { BOSS_FLOORS } from './config.js';

export const H = CHUNK_H;
const MAX_TRIES = 30;

export function isSolid(t) {
  return t === '#';
}

export function tileAt(level, x, y) {
  if (x < 0 || x >= level.w || y < 0 || y >= H) return '#';
  return level.grid[y][x];
}

// 검증 모델: 1단 점프 높이 3칸, 점프 중 수평 4칸 (실제 물리 3.6칸·약 4.5칸보다 보수적)
export function reachable(level) {
  const pass = (x, y) => {
    const t = tileAt(level, x, y);
    return !isSolid(t) && t !== '^';
  };
  const floor = (x, y) => {
    const t = tileAt(level, x, y);
    return isSolid(t) || t === '=';
  };
  const key = (x, y) => x + ',' + y;
  const seen = new Set([key(level.start.x, level.start.y)]);
  const queue = [level.start];
  const land = (x, y) => {
    let fy = y;
    while (pass(x, fy + 1) && !floor(x, fy + 1)) fy++;
    if (!floor(x, fy + 1)) return;
    const k = key(x, fy);
    if (!seen.has(k)) {
      seen.add(k);
      queue.push({ x, y: fy });
    }
  };
  while (queue.length) {
    const { x, y } = queue.shift();
    if (x === level.exit.x && y === level.exit.y) return true;
    for (let r = 0; r <= 3; r++) {
      if (r > 0 && !pass(x, y - r)) break;
      for (const dir of [-1, 1]) {
        for (let d = 1; d <= (r === 0 ? 1 : 4); d++) {
          if (!pass(x + dir * d, y - r)) break;
          land(x + dir * d, y - r);
        }
      }
    }
  }
  return false;
}

function build(floor, rng) {
  const boss = BOSS_FLOORS.includes(floor);
  const count = boss ? 1 : Math.min(3 + Math.ceil(floor / 2), 8);
  const parts = [START];
  for (let i = 0; i < count; i++) parts.push(boss ? BOSS : rng.pick(CHUNKS));
  parts.push(EXIT);

  const w = parts.length * CHUNK_W;
  const grid = Array.from({ length: H }, () => []);
  const level = { w, grid, start: null, exit: null, spawns: [], boss };
  const density = Math.min(0.35 + floor * 0.06, 0.9);

  parts.forEach((chunk, ci) => {
    const flip = chunk !== START && chunk !== EXIT && rng() < 0.5; // 좌우 반전으로 다양성 추가
    for (let y = 0; y < H; y++) {
      const row = flip ? [...chunk[y]].reverse() : [...chunk[y]];
      row.forEach((c, cx) => {
        const x = ci * CHUNK_W + cx;
        let t = c;
        if (c === 'S') level.start = { x, y };
        else if (c === 'D') level.exit = { x, y };
        else if ('ebaB'.includes(c)) {
          if (c === 'B' || rng() < density) level.spawns.push({ type: c, x, y });
        } else if (c === 'c') {
          if (rng() < 0.7) level.spawns.push({ type: 'c', x, y });
        } else if (c === 'C') level.spawns.push({ type: 'C', x, y });
        else {
          grid[y][x] = t;
          return;
        }
        grid[y][x] = c === 'D' ? 'D' : '.';
      });
    }
  });
  return level;
}

export function generate(floor, rng) {
  for (let i = 0; i < MAX_TRIES; i++) {
    const level = build(floor, rng);
    level.tries = i + 1;
    if (reachable(level)) return level;
  }
  throw new Error('도달 가능한 층을 만들지 못했습니다');
}
