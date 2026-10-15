// 위에서 본 도시와 차 그리기 + 목표 방향 화살표 + 미니맵
import { SIZE, ROADS, ROAD_W, BUILDINGS, LOT, COURSE, SPOTS } from './world.js';
import { CAR } from './config.js';

export function render(ctx, sim, view, opts, time) {
  const { W, H } = view;
  const car = sim.car;
  const base = Math.min(W, H) / 32;
  const scale = base * (1 - Math.min(0.5, (Math.abs(car.v) / 40) * 0.5));
  const rot = opts.rotate ? -car.heading - Math.PI / 2 : 0;
  // 차는 화면 아래쪽 1/3 지점에 (회전 모드) — 앞이 더 많이 보이게
  const cy = opts.rotate ? view.cy + view.h * 0.18 : view.cy;

  ctx.fillStyle = '#5a8f4e';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(view.cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.translate(-car.x, -car.y);

  // 바깥
  ctx.fillStyle = '#3d6b35';
  ctx.fillRect(-200, -200, SIZE + 400, SIZE + 400);
  ctx.fillStyle = '#5a8f4e';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 주차장·코스 바닥
  for (const b of [LOT, COURSE]) {
    ctx.fillStyle = '#6b6f76';
    ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
  }
  // 도로
  ctx.fillStyle = '#4a4e55';
  for (const r of ROADS) {
    ctx.fillRect(r - ROAD_W / 2, 0, ROAD_W, SIZE);
    ctx.fillRect(0, r - ROAD_W / 2, SIZE, ROAD_W);
  }
  // 중앙선(노란 실선) — 교차로 안은 비움
  ctx.strokeStyle = '#f2c94c';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (const r of ROADS) {
    const stops = [0, ...ROADS.flatMap((q) => [q - ROAD_W / 2, q + ROAD_W / 2]), SIZE];
    for (let k = 0; k < stops.length; k += 2) {
      ctx.moveTo(r, stops[k]);
      ctx.lineTo(r, stops[k + 1]);
      ctx.moveTo(stops[k], r);
      ctx.lineTo(stops[k + 1], r);
    }
  }
  ctx.stroke();
  // 정지선
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const rx of ROADS)
    for (const ry of ROADS) {
      const h = ROAD_W / 2;
      ctx.moveTo(rx, ry - h - 0.5);
      ctx.lineTo(rx - h, ry - h - 0.5);
      ctx.moveTo(rx, ry + h + 0.5);
      ctx.lineTo(rx + h, ry + h + 0.5);
      ctx.moveTo(rx - h - 0.5, ry);
      ctx.lineTo(rx - h - 0.5, ry + h);
      ctx.moveTo(rx + h + 0.5, ry);
      ctx.lineTo(rx + h + 0.5, ry - h);
    }
  ctx.stroke();

  // 주차 칸
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 0.12;
  for (const s of SPOTS) ctx.strokeRect(s.x, s.y, s.w, s.h);
  const t = sim.target;
  const pulse = 0.35 + Math.sin(time * 5) * 0.15;
  ctx.fillStyle = sim.inSpot ? `rgba(76,175,80,${pulse + 0.2})` : `rgba(255,213,74,${pulse})`;
  ctx.fillRect(t.x, t.y, t.w, t.h);
  ctx.font = 'bold 1.6px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('P', t.x + t.w / 2, t.y + t.h / 2);

  // 건물 (그림자 + 지붕)
  for (const b of BUILDINGS) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(b.x + 1.5, b.y + 1.5, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,.15)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
  }

  // 콘
  for (const c of sim.cones) {
    ctx.fillStyle = c.down ? '#c75d1a' : '#ff7a1a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCar(ctx, car, opts.input);
  ctx.restore();

  drawTargetArrow(ctx, sim, view, scale, rot, cy);
  drawMinimap(ctx, sim, view);
}

function drawCar(ctx, car, input) {
  const L = CAR.LENGTH;
  const Wd = CAR.WIDTH;
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);
  // 바퀴
  ctx.fillStyle = '#111';
  const wheel = (x, y, a) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillRect(-0.35, -0.13, 0.7, 0.26);
    ctx.restore();
  };
  const ax = CAR.WHEELBASE / 2;
  wheel(ax, -Wd / 2 + 0.05, car.steer);
  wheel(ax, Wd / 2 - 0.05, car.steer);
  wheel(-ax, -Wd / 2 + 0.05, 0);
  wheel(-ax, Wd / 2 - 0.05, 0);
  // 차체
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fillRect(-L / 2 + 0.3, -Wd / 2 + 0.3, L, Wd);
  ctx.fillStyle = '#e53935';
  roundRect(ctx, -L / 2, -Wd / 2, L, Wd, 0.45);
  ctx.fill();
  ctx.fillStyle = '#263238';
  roundRect(ctx, 0.15, -Wd / 2 + 0.2, 1.0, Wd - 0.4, 0.2); // 앞유리
  ctx.fill();
  roundRect(ctx, -1.65, -Wd / 2 + 0.25, 0.6, Wd - 0.5, 0.15); // 뒷유리
  ctx.fill();
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(-1.05, -Wd / 2 + 0.2, 1.2, Wd - 0.4); // 지붕
  // 전조등
  ctx.fillStyle = '#fff59d';
  ctx.fillRect(L / 2 - 0.15, -Wd / 2 + 0.15, 0.15, 0.4);
  ctx.fillRect(L / 2 - 0.15, Wd / 2 - 0.55, 0.15, 0.4);
  // 브레이크등 / 후진등
  const braking = input.brake > 0.05 || car.gear === 'P';
  ctx.fillStyle = car.gear === 'R' ? '#ffffff' : braking ? '#ff1744' : '#8e1b1b';
  ctx.fillRect(-L / 2, -Wd / 2 + 0.15, 0.15, 0.45);
  ctx.fillRect(-L / 2, Wd / 2 - 0.6, 0.15, 0.45);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 목표 주차 칸이 화면 밖이면 가장자리에 방향 화살표와 거리
function drawTargetArrow(ctx, sim, view, scale, rot, cy) {
  const t = sim.target;
  const dx = t.x + t.w / 2 - sim.car.x;
  const dy = t.y + t.h / 2 - sim.car.y;
  const sx = (dx * Math.cos(rot) - dy * Math.sin(rot)) * scale;
  const sy = (dx * Math.sin(rot) + dy * Math.cos(rot)) * scale;
  const px = view.cx + sx;
  const py = cy + sy;
  const m = 34;
  if (px > view.x + m && px < view.x + view.w - m && py > view.y + m && py < view.y + view.h - m) return;
  const a = Math.atan2(sy, sx);
  const k = Math.min((view.w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (view.h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
  const ax = view.cx + Math.cos(a) * k;
  const ay = view.y + view.h / 2 + Math.sin(a) * k;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(a);
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-8, -11);
  ctx.lineTo(-8, 11);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`🅿️ ${Math.round(Math.hypot(dx, dy))}m`, ax - Math.cos(a) * 30, ay - Math.sin(a) * 30);
}

function drawMinimap(ctx, sim, view) {
  const s = Math.min(96, view.w * 0.24);
  const x = view.x + view.w - s - 10;
  const y = view.y + 10;
  const k = s / SIZE;
  ctx.fillStyle = 'rgba(20,30,20,.75)';
  ctx.fillRect(x - 3, y - 3, s + 6, s + 6);
  ctx.fillStyle = '#6b6f76';
  for (const r of ROADS) {
    ctx.fillRect(x + (r - ROAD_W / 2) * k, y, ROAD_W * k, s);
    ctx.fillRect(x, y + (r - ROAD_W / 2) * k, s, ROAD_W * k);
  }
  ctx.fillStyle = '#ffd54a';
  const t = sim.target;
  ctx.fillRect(x + t.x * k - 1.5, y + t.y * k - 1.5, 4, 4);
  ctx.fillStyle = '#ff5252';
  ctx.beginPath();
  ctx.arc(x + sim.car.x * k, y + sim.car.y * k, 3, 0, Math.PI * 2);
  ctx.fill();
}
