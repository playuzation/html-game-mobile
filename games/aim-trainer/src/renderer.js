// 1인칭 화면 그리기: 바닥 격자·기둥·과녁·조준선·효과
import { DEG, toCamera, project } from './math.js';

const EYE = 1.6; // 눈높이(m)

// 카메라 좌표의 선분을 앞쪽(z>near)만 남기고 그린다
function line3(ctx, a, b, cam, view) {
  let ca = toCamera(a, cam);
  let cb = toCamera(b, cam);
  const near = 0.1;
  if (ca.z < near && cb.z < near) return;
  if (ca.z < near || cb.z < near) {
    const t = (near - ca.z) / (cb.z - ca.z);
    const m = { x: ca.x + (cb.x - ca.x) * t, y: ca.y + (cb.y - ca.y) * t, z: near };
    if (ca.z < near) ca = m;
    else cb = m;
  }
  const pa = project(ca, view);
  const pb = project(cb, view);
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
}

export function render(ctx, state, view, time) {
  const { cam, session, effects } = state;
  const { W, H } = view;

  // 하늘 / 바닥 (지평선 높이는 pitch 에 따라)
  const horizon = view.cy + view.f * Math.tan(cam.pitch);
  const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, horizon));
  sky.addColorStop(0, '#0d1b2a');
  sky.addColorStop(1, '#1b3a57');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1a2530';
  ctx.fillRect(0, Math.max(0, horizon), W, H);

  // 바닥 격자
  ctx.strokeStyle = 'rgba(120,200,255,.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -30; k <= 30; k += 2) {
    line3(ctx, { x: k, y: -EYE, z: -30 }, { x: k, y: -EYE, z: 30 }, cam, view);
    line3(ctx, { x: -30, y: -EYE, z: k }, { x: 30, y: -EYE, z: k }, cam, view);
  }
  ctx.stroke();

  // 사격장 벽 기둥 (15° 마다) — 회전 감각용
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  for (let a = -180; a < 180; a += 15) {
    const x = Math.sin(a * DEG) * 22;
    const z = Math.cos(a * DEG) * 22;
    line3(ctx, { x, y: -EYE, z }, { x, y: 8, z }, cam, view);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  for (let a = -90; a <= 90; a += 45) {
    const p = project(toCamera({ x: Math.sin(a * DEG) * 22, y: -1, z: Math.cos(a * DEG) * 22 }, cam), view);
    if (p) ctx.fillText(a === 0 ? '정면' : `${a > 0 ? '오른쪽' : '왼쪽'} ${Math.abs(a)}°`, p.x, p.y);
  }

  // 과녁 (먼 것부터)
  const visible = session.targets
    .map((t) => ({ t, c: toCamera(t.pos, cam) }))
    .filter((v) => v.c.z > 0.1)
    .sort((a, b) => b.c.z - a.c.z);
  for (const { t, c } of visible) {
    const p = project(c, view);
    const grow = Math.min(1, (session.time - t.born) / 0.18 + (session.running ? 0 : 1));
    const r = p.s * t.radius * grow;
    const rings = ['#e53935', '#ffffff', '#e53935', '#ffffff', '#e53935'];
    rings.forEach((col, k) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (r * (rings.length - k)) / rings.length, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 화면 밖 과녁 방향 표시
  for (const t of session.targets) {
    const c = toCamera(t.pos, cam);
    const p = c.z > 0.1 ? project(c, view) : null;
    if (p && p.x > 0 && p.x < W && p.y > view.top && p.y < H) continue;
    const a = Math.atan2(-c.y, c.x);
    const rx = W / 2 - 22;
    const ry = (H - view.top) / 2 - 22;
    const k = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
    ctx.save();
    ctx.translate(view.cx + Math.cos(a) * k, view.top + (H - view.top) / 2 + Math.sin(a) * k);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,82,82,.85)';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, 8);
    ctx.fill();
    ctx.restore();
  }

  // 효과: 명중 파편, +1/-1 글자
  for (const e of effects) {
    const age = time - e.t;
    if (e.kind === 'burst') {
      const p = project(toCamera(e.pos, cam), view);
      if (!p) continue;
      ctx.fillStyle = `rgba(255,214,80,${1 - age / 0.5})`;
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2;
        const d = age * 240;
        ctx.fillRect(p.x + Math.cos(ang) * d - 2, p.y + Math.sin(ang) * d - 2, 4, 4);
      }
    } else {
      ctx.globalAlpha = Math.max(0, 1 - age / 0.8);
      ctx.fillStyle = e.kind === 'plus' ? '#69f0ae' : '#ff5252';
      ctx.font = 'bold 26px system-ui';
      ctx.fillText(e.kind === 'plus' ? '+1' : '-1', view.cx + (e.kind === 'plus' ? 34 : -34), view.cy - 24 - age * 50);
      ctx.globalAlpha = 1;
    }
  }

  // 조준선 (명중 가능하면 초록)
  const onTarget = session.targetAt(cam.yaw, cam.pitch);
  const recoil = Math.max(0, 1 - (time - state.lastShot) / 0.12) * 6;
  ctx.strokeStyle = onTarget ? '#69f0ae' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const g = 5 + recoil;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.moveTo(view.cx + dx * g, view.cy + dy * g);
    ctx.lineTo(view.cx + dx * (g + 10), view.cy + dy * (g + 10));
  }
  ctx.stroke();
  ctx.fillStyle = onTarget ? '#69f0ae' : '#ffffff';
  ctx.fillRect(view.cx - 1.5, view.cy - 1.5, 3, 3);

  // 총구 섬광
  if (time - state.lastShot < 0.06) {
    ctx.fillStyle = 'rgba(255,230,150,.25)';
    ctx.fillRect(0, 0, W, H);
  }
}
