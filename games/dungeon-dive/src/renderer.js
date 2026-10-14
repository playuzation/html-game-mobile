// 캔버스 그리기. view = { x, y, s, w, h } (화면 영역과 타일 크기 px), 카메라는 플레이어를 가로로 따라간다
import { H, tileAt } from './level.js';

const THEMES = [
  { sky: ['#1b1530', '#2c2350'], wall: '#4a3f6b', top: '#7d6bb0', plat: '#a58bd6' }, // 1~3층 지하 묘지
  { sky: ['#0e2230', '#173b52'], wall: '#2f5468', top: '#5fa8c8', plat: '#8fd3ec' }, // 4~6층 수정 동굴
  { sky: ['#2a1010', '#4a1a12'], wall: '#5a2a1e', top: '#e0663a', plat: '#f29a62' }, // 7~10층 용암 지대
];
export const theme = (floor) => THEMES[floor <= 3 ? 0 : floor <= 6 ? 1 : 2];

let camX = 0;

export function render(ctx, game, view, time) {
  const { s } = view;
  const lv = game.level;
  const th = theme(game.floor);
  const cols = view.w / s;
  const p = game.player;
  const target = Math.max(0, Math.min(lv.w - cols, p.cx - cols * 0.4));
  camX += (target - camX) * 0.15;
  if (Math.abs(target - camX) > cols) camX = target;

  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.beginPath();
  ctx.rect(0, 0, view.w, view.h);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, view.h);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.translate(-Math.round(camX * s), 0);

  const x0 = Math.floor(camX) - 1;
  const x1 = Math.ceil(camX + cols) + 1;
  for (let y = 0; y < H; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(lv, x, y);
      const px = x * s;
      const py = y * s;
      if (t === '#') {
        ctx.fillStyle = th.wall;
        ctx.fillRect(px, py, s + 0.5, s + 0.5);
        if (tileAt(lv, x, y - 1) !== '#') {
          ctx.fillStyle = th.top;
          ctx.fillRect(px, py, s + 0.5, s * 0.18);
        }
      } else if (t === '=') {
        ctx.fillStyle = th.plat;
        ctx.fillRect(px, py, s + 0.5, s * 0.22);
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
      } else if (t === 'D') drawDoor(ctx, px, py, s, game.doorOpen, time);
    }
  }

  for (const it of game.items) {
    if (it.kind === 'coin') {
      const bob = Math.sin(time * 5 + it.x) * s * 0.06;
      ctx.fillStyle = '#ffd54a';
      ctx.beginPath();
      ctx.ellipse((it.x + 0.2) * s, (it.y + 0.2) * s + bob, s * 0.18 * Math.abs(Math.cos(time * 3 + it.x)) + 1, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = it.open ? '#6d4c2f' : '#a0703c';
      ctx.fillRect(it.x * s, it.y * s, it.w * s, it.h * s);
      ctx.fillStyle = '#ffd54a';
      ctx.fillRect((it.x + it.w / 2 - 0.08) * s, (it.y + 0.2) * s, 0.16 * s, 0.2 * s);
    }
  }

  for (const e of game.enemies) drawEnemy(ctx, e, s, time);
  for (const sh of game.shots) {
    ctx.fillStyle = sh.kind === 'arrow' ? '#e0c080' : sh.kind === 'wave' ? 'rgba(255,140,60,.85)' : '#cfd8dc';
    ctx.fillRect(sh.x * s, sh.y * s, sh.w * s, sh.h * s);
  }
  drawPlayer(ctx, game, s);
  for (const q of game.particles) {
    ctx.globalAlpha = Math.min(1, q.t * 2.5);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x * s - s * 0.06, q.y * s - s * 0.06, s * 0.12, s * 0.12);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (game.boss && !game.boss.dead) {
    const b = game.boss;
    const bw = Math.min(view.w - 40, 280);
    const bx = view.x + (view.w - bw) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(bx, view.y + 8, bw, 10);
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(bx, view.y + 8, (bw * b.hp) / b.maxHp, 10);
  }
}

function drawDoor(ctx, px, py, s, open, time) {
  ctx.fillStyle = open ? '#3b2a1a' : '#555';
  ctx.fillRect(px + s * 0.1, py - s * 0.6, s * 0.8, s * 1.6);
  ctx.fillStyle = open ? `rgba(255,220,120,${0.5 + Math.sin(time * 4) * 0.25})` : '#888';
  ctx.fillRect(px + s * 0.22, py - s * 0.45, s * 0.56, s * 1.4);
  if (!open) {
    ctx.fillStyle = '#333';
    ctx.fillRect(px + s * 0.1, py + s * 0.1, s * 0.8, s * 0.12);
    ctx.fillRect(px + s * 0.1, py + s * 0.5, s * 0.8, s * 0.12);
  }
}

function drawEnemy(ctx, e, s, time) {
  const x = e.x * s;
  const y = e.y * s;
  const w = e.w * s;
  const h = e.h * s;
  const flash = e.flash > 0;
  if (e.type === 'e') {
    ctx.fillStyle = flash ? '#fff' : '#66bb6a';
    const sq = Math.sin(time * 8 + e.x) * h * 0.08;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + sq / 2, w / 2, h / 2 - sq / 2, 0, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
  } else if (e.type === 'b') {
    ctx.fillStyle = flash ? '#fff' : '#9575cd';
    const flap = Math.sin(time * 18) * h * 0.5;
    ctx.fillRect(x + w * 0.3, y, w * 0.4, h);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.3);
    ctx.lineTo(x - w * 0.2, y + h * 0.3 - flap);
    ctx.lineTo(x + w * 0.3, y + h * 0.8);
    ctx.moveTo(x + w * 0.7, y + h * 0.3);
    ctx.lineTo(x + w * 1.2, y + h * 0.3 - flap);
    ctx.lineTo(x + w * 0.7, y + h * 0.8);
    ctx.fill();
  } else if (e.type === 'a') {
    ctx.fillStyle = flash ? '#fff' : '#d7ccc8';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath();
    ctx.arc(e.facing > 0 ? x + w : x, y + h * 0.45, h * 0.35, -Math.PI / 2, Math.PI / 2, e.facing < 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = flash ? '#fff' : '#8d6e63';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + w * 0.1, y + h * 0.55, w * 0.8, h * 0.12);
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(x + w * (e.facing > 0 ? 0.6 : 0.2), y + h * 0.2, w * 0.2, h * 0.1);
  }
  if (e.type !== 'e' && e.type !== 'B') {
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x + w * (e.facing > 0 ? 0.62 : 0.24), y + h * 0.22, w * 0.14, w * 0.14);
  }
}

function drawPlayer(ctx, game, s) {
  const p = game.player;
  if (p.invuln > 0 && Math.floor(p.invuln * 15) % 2) return;
  const x = p.x * s;
  const y = p.y * s;
  const w = p.w * s;
  const h = p.h * s;
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
  ctx.fillStyle = '#ffe0b2';
  ctx.fillRect(x + w * 0.1, y, w * 0.8, h * 0.4);
  ctx.fillStyle = '#263238';
  ctx.fillRect(x + w * (p.facing > 0 ? 0.55 : 0.25), y + h * 0.15, w * 0.15, h * 0.12);
  const hb = p.hitbox;
  if (hb) {
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.beginPath();
    const cx = p.facing > 0 ? x + w : x;
    const base = p.facing > 0 ? 0 : Math.PI;
    ctx.arc(cx, y + h * 0.5, hb.w * s * 0.9, base - 1.1, base + 1.1);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(p.facing > 0 ? x + w : x - w * 0.15, y + h * 0.35, w * 0.15, h * 0.45);
  }
}
