// 메트로놈 시각화: 흔들리는 추 + 4박 표시등 (canvas)
export function drawMetronome(ctx, w, h, ph, running) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const base = h * 0.92;
  const top = h * 0.12;

  // 몸통 (사다리꼴)
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.16, base);
  ctx.lineTo(cx + w * 0.16, base);
  ctx.lineTo(cx + w * 0.06, top);
  ctx.lineTo(cx - w * 0.06, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#efe6d8';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.11, base - h * 0.1);
  ctx.lineTo(cx + w * 0.11, base - h * 0.1);
  ctx.lineTo(cx + w * 0.04, top + h * 0.1);
  ctx.lineTo(cx - w * 0.04, top + h * 0.1);
  ctx.closePath();
  ctx.fill();
  // 눈금
  ctx.strokeStyle = 'rgba(93,64,55,.35)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 10; k++) {
    const y = top + h * 0.1 + ((base - h * 0.2 - top) * k) / 10;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y);
    ctx.lineTo(cx + 6, y);
    ctx.stroke();
  }

  // 추: 박마다 좌↔우 한 번 흔들림 (짝수 박에서 왼쪽 끝, 홀수 박에서 오른쪽 끝)
  let angle = 0;
  if (running && ph) {
    const from = ph.count % 2 === 0 ? -1 : 1;
    angle = from * Math.cos(Math.PI * ph.frac) * 0.42;
  }
  const pivot = { x: cx, y: base - h * 0.14 };
  const len = (pivot.y - top) * 0.95;
  const tip = { x: pivot.x + Math.sin(angle) * len, y: pivot.y - Math.cos(angle) * len };
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivot.x, pivot.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  // 무게추
  const wx = pivot.x + Math.sin(angle) * len * 0.62;
  const wy = pivot.y - Math.cos(angle) * len * 0.62;
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(angle);
  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(-11, -9, 22, 18);
  ctx.restore();
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // 박이 울리는 순간 번쩍
  if (running && ph && ph.since < 0.08) {
    ctx.fillStyle = ph.beat === 0 ? 'rgba(255,82,82,.35)' : 'rgba(255,213,74,.28)';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 4박 표시등 갱신 (DOM)
export function updateBeats(els, ph, running) {
  els.forEach((el, i) => {
    const on = running && ph && ph.beat === i && ph.since < 0.12;
    el.classList.toggle('on', !!on);
  });
}
