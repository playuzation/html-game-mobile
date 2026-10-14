// 타일 충돌 이동 (플레이어·걷는 적 공용)
// body: { x, y, w, h, vx, vy, onGround, dropT }  — '=' 발판은 위에서 떨어질 때만 막는다
import { tileAt, isSolid } from './level.js';

export function moveBody(body, dt, level) {
  const hit = { wall: false, ceil: false };
  body.x += body.vx * dt;
  if (body.vx !== 0) {
    const tx = body.vx > 0 ? Math.floor(body.x + body.w - 1e-6) : Math.floor(body.x);
    for (let ty = Math.floor(body.y); ty <= Math.floor(body.y + body.h - 1e-6); ty++) {
      if (!isSolid(tileAt(level, tx, ty))) continue;
      body.x = body.vx > 0 ? tx - body.w : tx + 1;
      body.vx = 0;
      hit.wall = true;
      break;
    }
  }

  const prevBottom = body.y + body.h;
  body.y += body.vy * dt;
  const x0 = Math.floor(body.x);
  const x1 = Math.floor(body.x + body.w - 1e-6);
  if (body.vy > 0) {
    const ty = Math.floor(body.y + body.h - 1e-6);
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(level, tx, ty);
      const platform = t === '=' && !(body.dropT > 0) && prevBottom <= ty + 1e-3;
      if (!isSolid(t) && !platform) continue;
      body.y = ty - body.h;
      body.vy = 0;
      break;
    }
  } else if (body.vy < 0) {
    const ty = Math.floor(body.y);
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(tileAt(level, tx, ty))) continue;
      body.y = ty + 1;
      body.vy = 0;
      hit.ceil = true;
      break;
    }
  }
  const below = Math.floor(body.y + body.h + 0.01);
  const standOn = (tx) => {
    const t = tileAt(level, tx, below);
    return isSolid(t) || (t === '=' && !(body.dropT > 0) && Math.abs(body.y + body.h - below) < 0.02);
  };
  body.onGround = body.vy >= 0 && (standOn(x0) || standOn(x1));
  return hit;
}

export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
