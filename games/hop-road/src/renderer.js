// 캔버스 그리기 (게임 상태는 인자로만 받음 → 게임 모듈에 의존하지 않음)
import { COLS, COLORS } from './config.js';

// 바닥 footprint (x, y, w, h) 위에 높이 z 만큼 솟은 블록
function box(ctx, x, y, w, h, z, top, side) {
  ctx.fillStyle = side;
  ctx.fillRect(x, y + h - z, w, z);
  ctx.fillStyle = top;
  ctx.fillRect(x, y - z, w, h);
}

export function render(ctx, game, W, H, time) {
  const cell = W / COLS;
  const { world, player: p, camY } = game;
  const rowY = (r) => H - (r - camY + 1) * cell; // 해당 줄의 위쪽 y
  const minRow = Math.floor(camY) - 1;
  const maxRow = Math.ceil(camY + H / cell) + 1;

  // 1) 바닥
  for (let r = minRow; r <= maxRow; r++) {
    const lane = world.get(r);
    const y = rowY(r);
    if (lane.type === 'grass') {
      ctx.fillStyle = COLORS.grass[lane.shade];
      ctx.fillRect(0, y, W, cell + 1);
    } else if (lane.type === 'road') {
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, y, W, cell + 1);
      if (world.get(r + 1).type === 'road') {
        ctx.fillStyle = COLORS.roadLine;
        for (let x = cell * 0.2; x < W; x += cell) ctx.fillRect(x, y - 1, cell * 0.5, 2);
      }
    } else {
      ctx.fillStyle = COLORS.water;
      ctx.fillRect(0, y, W, cell + 1);
      ctx.fillStyle = COLORS.waterLight;
      const off = ((time * 0.4 * lane.dir) % 1 + 1) % 1;
      for (let i = -1; i < COLS + 1; i += 2) {
        ctx.fillRect((i + off) * cell, y + cell * 0.45, cell * 0.4, 2);
      }
    }
  }

  // 2) 물체: 먼 줄부터 그려서 가까운 줄이 위에 겹치도록
  const pRow = Math.round(p.visualRow);
  for (let r = maxRow; r >= minRow; r--) {
    const lane = world.get(r);
    const y = rowY(r);
    if (lane.type === 'grass') {
      for (const c of lane.trees) {
        const x = c * cell;
        box(ctx, x + cell * 0.38, y + cell * 0.55, cell * 0.24, cell * 0.25, cell * 0.2, COLORS.trunk, COLORS.trunkSide);
        box(ctx, x + cell * 0.12, y + cell * 0.2, cell * 0.76, cell * 0.55, cell * 0.55, COLORS.leafTop, COLORS.leafSide);
      }
    } else if (lane.type === 'water') {
      for (const it of lane.items) {
        box(ctx, it.x * cell + 2, y + cell * 0.18, it.w * cell - 4, cell * 0.64, cell * 0.1, COLORS.logTop, COLORS.logSide);
      }
    }
    if (r === pRow) drawPlayer(ctx, p, cell, rowY(p.visualRow), time);
    if (lane.type === 'road') {
      for (const it of lane.items) drawCar(ctx, it, lane.dir, cell, y);
    }
  }
}

function drawCar(ctx, it, dir, cell, y) {
  const x = it.x * cell + 3;
  const w = it.w * cell - 6;
  box(ctx, x, y + cell * 0.2, w, cell * 0.6, cell * 0.22, it.color, '#33363c');
  const cw = Math.min(w * 0.55, cell * 0.6);
  const cx = dir > 0 ? x + w - cw - cell * 0.15 : x + cell * 0.15;
  box(ctx, cx, y + cell * 0.25, cw, cell * 0.45, cell * 0.38, COLORS.carGlass, it.color);
}

function drawPlayer(ctx, p, cell, y, time) {
  const s = cell * 0.62;
  const cx = (p.x + 0.5) * cell;
  const baseY = y + (cell - s) / 2;

  if (p.dead === 'water') {
    const k = Math.min(1, p.deadT * 2);
    ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, y + cell / 2, s * (0.4 + k), s * (0.2 + k * 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  const squash = p.dead === 'car' ? 0.25 : 1;
  const wide = p.dead === 'car' ? 1.4 : 1;
  const z = s * 0.8 * squash;
  const lift = p.lift * cell;
  const w = s * wide;
  const x = cx - w / 2;

  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + s * 0.75, w * 0.5, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = baseY - lift;
  box(ctx, x, by, w, s, z, COLORS.playerTop, COLORS.playerSide);
  if (p.dead) return;

  const topY = by - z; // 윗면 시작 y
  // 볏
  ctx.fillStyle = COLORS.comb;
  ctx.fillRect(cx - s * 0.12, topY + s * 0.15, s * 0.24, s * 0.3);
  // 부리와 눈 (바라보는 방향)
  const off = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
  ctx.fillStyle = COLORS.beak;
  const bx = cx + off[0] * s * 0.5 - s * 0.12;
  const bY = p.dir === 'down' ? by + s - z + s * 0.25 : topY + s * 0.5 + off[1] * s * 0.5 - s * 0.08;
  ctx.fillRect(bx, bY, s * 0.24, s * 0.16);
  if (p.dir !== 'up') {
    ctx.fillStyle = COLORS.eye;
    const ey = p.dir === 'down' ? by + s - z + s * 0.08 : topY + s * 0.45;
    ctx.fillRect(cx - s * 0.3 + off[0] * s * 0.2, ey, s * 0.1, s * 0.1);
    ctx.fillRect(cx + s * 0.2 + off[0] * s * 0.2, ey, s * 0.1, s * 0.1);
  }
}
