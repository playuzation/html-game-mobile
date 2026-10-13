// 캔버스 그리기. view = { x, y, s } (화면 오프셋과 타일 크기, px)
import { ROOMS, ITEMS, COLS, ROWS, STAR_COUNT } from './rooms.js';
import { tileAt, SOLID } from './world.js';

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export function render(ctx, game, view, W, H, time) {
  const { s } = view;
  const def = ROOMS[game.ri];
  const room = game.room;

  ctx.fillStyle = '#0b0a14';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.beginPath();
  ctx.rect(0, 0, COLS * s, ROWS * s);
  ctx.clip();

  const g = ctx.createLinearGradient(0, 0, 0, ROWS * s);
  g.addColorStop(0, def.sky[0]);
  g.addColorStop(1, def.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, COLS * s, ROWS * s);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) drawTile(ctx, room, def, game, x, y, s, time);
  }

  drawPlayer(ctx, game, s, time);

  for (const q of game.particles) {
    ctx.globalAlpha = Math.min(1, q.t * 2);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x * s - s * 0.07, q.y * s - s * 0.07, s * 0.14, s * 0.14);
  }
  ctx.globalAlpha = 1;

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,80,80,${game.flash})`;
    ctx.fillRect(0, 0, COLS * s, ROWS * s);
  }
  ctx.restore();
}

function drawTile(ctx, room, def, game, x, y, s, time) {
  const t = tileAt(room, x, y);
  const px = x * s;
  const py = y * s;

  if (t === '#') {
    ctx.fillStyle = def.wall;
    ctx.fillRect(px, py, s + 0.5, s + 0.5);
    if (!SOLID.has(tileAt(room, x, y - 1)) && y > 0) {
      ctx.fillStyle = def.top;
      ctx.fillRect(px, py, s + 0.5, s * 0.2);
    }
  } else if (t === 'C') {
    ctx.fillStyle = '#9b7650';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#4a3420';
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.beginPath();
    ctx.moveTo(px + s * 0.2, py + s * 0.15);
    ctx.lineTo(px + s * 0.5, py + s * 0.5);
    ctx.lineTo(px + s * 0.35, py + s * 0.85);
    ctx.moveTo(px + s * 0.5, py + s * 0.5);
    ctx.lineTo(px + s * 0.85, py + s * 0.4);
    ctx.stroke();
  } else if (t === 'H') {
    ctx.fillStyle = '#6f7882';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.fillStyle = '#c3cad2';
    for (const [ox, oy] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) {
      ctx.beginPath();
      ctx.arc(px + s * ox, py + s * oy, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t === 'X') {
    ctx.fillStyle = 'rgba(120,230,255,0.55)';
    ctx.fillRect(px + 2, py + 1, s - 4, s - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(px + s * 0.3, py + s * 0.15, s * 0.12, s * 0.5);
  } else if (t === '^') {
    ctx.fillStyle = '#d9dde6';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const bx = px + (i * s) / 3;
      ctx.moveTo(bx, py + s);
      ctx.lineTo(bx + s / 6, py + s * 0.45);
      ctx.lineTo(bx + s / 3, py + s);
    }
    ctx.fill();
  } else if (t === '~') {
    ctx.fillStyle = '#2f86d6';
    ctx.fillRect(px, py + s * 0.3, s + 0.5, s * 0.7);
    ctx.fillStyle = '#7cc4ff';
    const off = Math.sin(time * 3 + x) * s * 0.05;
    ctx.fillRect(px, py + s * 0.3 + off, s + 0.5, s * 0.08);
  } else if (t === '<' || t === '>') {
    ctx.fillStyle = 'rgba(255,240,180,0.18)';
    ctx.fillRect(px, py - s, s, s * 2);
    ctx.fillStyle = 'rgba(255,240,180,0.6)';
    ctx.font = `${s * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t === '<' ? '◀' : '▶', px + s / 2, py + s * 0.1);
  } else if (t === 'n') {
    drawEmoji(ctx, game.ri === 0 ? '👴' : '🪧', px, py, s, 0);
  } else if (t === 'A') {
    drawAltar(ctx, game, px, py, s, time);
  } else if (ITEMS[t]) {
    const bob = Math.sin(time * 3 + x) * s * 0.08;
    ctx.fillStyle = 'rgba(255,240,150,0.25)';
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2 + bob, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    drawEmoji(ctx, ITEMS[t].icon, px, py, s, bob);
  }
}

function drawEmoji(ctx, ch, px, py, s, dy) {
  ctx.fillStyle = '#ffffff';
  ctx.font = `${s * 0.75}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, px + s / 2, py + s / 2 + dy);
}

function drawAltar(ctx, game, px, py, s, time) {
  ctx.fillStyle = '#8c93b8';
  ctx.fillRect(px - s * 0.3, py + s * 0.55, s * 1.6, s * 0.45);
  ctx.fillRect(px - s * 0.1, py + s * 0.15, s * 1.2, s * 0.45);
  for (let i = 0; i < STAR_COUNT; i++) {
    const lit = i < game.stars;
    ctx.fillStyle = lit ? '#ffe27a' : '#3a3f5c';
    ctx.beginPath();
    ctx.arc(px + s * (0.15 + i * 0.35), py + s * 0.35, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  if (game.done) {
    ctx.fillStyle = `rgba(255,230,120,${0.35 + Math.sin(time * 4) * 0.15})`;
    ctx.fillRect(px + s * 0.2, 0, s * 0.6, py + s * 0.15);
  }
}

function drawPlayer(ctx, game, s, time) {
  const p = game.player;
  const x = p.x * s;
  const y = p.y * s;
  const w = p.w * s;
  const h = p.h * s;

  if (p.dashing) {
    ctx.fillStyle = 'rgba(160,220,255,0.4)';
    ctx.fillRect(x - p.facing * w * 0.8, y + h * 0.2, w, h * 0.6);
  }
  // 망토/스카프
  if (game.inv.has('w')) {
    ctx.fillStyle = '#e8505b';
    const sway = Math.sin(time * 10) * s * 0.05;
    ctx.fillRect(p.facing > 0 ? x - w * 0.35 : x + w * 0.85, y + h * 0.35 + sway, w * 0.5, h * 0.18);
  }
  ctx.fillStyle = '#ffd56b';
  ctx.fillRect(x, y + h * 0.25, w, h * 0.75);
  ctx.fillStyle = '#5a4fcf';
  ctx.fillRect(x - w * 0.05, y, w * 1.1, h * 0.38);
  ctx.fillStyle = '#1b1830';
  const ex = p.facing > 0 ? x + w * 0.45 : x + w * 0.16;
  ctx.fillRect(ex, y + h * 0.45, w * 0.12, h * 0.14);
  ctx.fillRect(ex + w * 0.27, y + h * 0.45, w * 0.12, h * 0.14);

  if (p.swingT > 0) {
    ctx.strokeStyle = '#e6e9f0';
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.beginPath();
    const cx = p.facing > 0 ? x + w : x;
    ctx.arc(cx, y + h * 0.5, s * 0.5, -Math.PI / 2 * p.facing - 0.3, Math.PI / 4 * p.facing, p.facing < 0);
    ctx.stroke();
  }
}
