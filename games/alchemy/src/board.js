// 작업대: 항목 토큰을 놓고 끌어서 겹치면 조합 (DOM 만 다루고 규칙은 콜백으로 받음 — 리프 모듈)
// onCombine(a, b) → { result, emoji, isNew } | null
const MERGE_DIST = 54; // 토큰 중심 사이 거리가 이보다 가까우면 조합 시도

export class Board {
  constructor(el, { onCombine, emojiOf }) {
    this.el = el;
    this.onCombine = onCombine;
    this.emojiOf = emojiOf;
  }

  get tokens() {
    return [...this.el.querySelectorAll('.token')];
  }

  add(name, x, y) {
    const t = document.createElement('div');
    t.className = 'token pop';
    t.dataset.name = name;
    t.innerHTML = `<span class="em">${this.emojiOf(name)}</span><span class="nm"></span>`;
    t.querySelector('.nm').textContent = name;
    this.el.appendChild(t);
    this._place(t, x, y);
    t.addEventListener('pointerdown', (e) => this.startDrag(t, e));
    t.addEventListener('animationend', () => t.classList.remove('pop', 'shake'));
    return t;
  }

  // 빈 자리 찾기 (다른 토큰과 겹치지 않는 곳)
  freeSpot() {
    const r = this.el.getBoundingClientRect();
    for (let k = 0; k < 40; k++) {
      const x = 40 + Math.random() * Math.max(10, r.width - 80);
      const y = 40 + Math.random() * Math.max(10, r.height - 80);
      if (this.tokens.every((t) => Math.hypot(t._x - x, t._y - y) > MERGE_DIST * 1.4)) return { x, y };
    }
    return { x: r.width / 2 + (Math.random() - 0.5) * 60, y: r.height / 2 + (Math.random() - 0.5) * 60 };
  }

  clear() {
    this.tokens.forEach((t) => t.remove());
  }

  _place(t, x, y) {
    const r = this.el.getBoundingClientRect();
    t._x = Math.max(28, Math.min(r.width - 28, x));
    t._y = Math.max(28, Math.min(r.height - 28, y));
    t.style.transform = `translate(${t._x - 32}px, ${t._y - 32}px)`;
  }

  // 화면 좌표 → 작업대 좌표
  local(e) {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientY <= r.bottom && e.clientY >= r.top };
  }

  startDrag(t, e) {
    e.preventDefault();
    t.setPointerCapture(e.pointerId);
    t.classList.add('drag');
    const p0 = this.local(e);
    const off = { x: p0.x - t._x, y: p0.y - t._y };
    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      const p = this.local(ev);
      t._x = p.x - off.x;
      t._y = p.y - off.y;
      t.style.transform = `translate(${t._x - 32}px, ${t._y - 32}px) scale(1.12)`;
    };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      t.removeEventListener('pointermove', move);
      t.removeEventListener('pointerup', up);
      t.removeEventListener('pointercancel', up);
      t.classList.remove('drag');
      const p = this.local(ev);
      if (!p.inside) return t.remove(); // 작업대 밖에 놓으면 치움
      this._place(t, t._x, t._y);
      this._drop(t);
    };
    t.addEventListener('pointermove', move);
    t.addEventListener('pointerup', up);
    t.addEventListener('pointercancel', up);
  }

  _drop(t) {
    const other = this.tokens
      .filter((o) => o !== t)
      .map((o) => ({ o, d: Math.hypot(o._x - t._x, o._y - t._y) }))
      .filter((x) => x.d < MERGE_DIST)
      .sort((a, b) => a.d - b.d)[0]?.o;
    if (!other) return;
    const res = this.onCombine(t.dataset.name, other.dataset.name);
    if (res) {
      const x = (t._x + other._x) / 2;
      const y = (t._y + other._y) / 2;
      t.remove();
      other.remove();
      const n = this.add(res.result, x, y);
      if (res.isNew) {
        n.classList.add('new');
        setTimeout(() => n.classList.remove('new'), 2500);
      }
      return;
    }
    // 조합 없음: 흔들고 살짝 떨어뜨림
    for (const k of [t, other]) {
      k.classList.remove('shake');
      void k.offsetWidth;
      k.classList.add('shake');
    }
    const dx = t._x - other._x || 1;
    const dy = t._y - other._y;
    const d = Math.hypot(dx, dy);
    this._place(t, other._x + (dx / d) * MERGE_DIST * 1.25, other._y + (dy / d) * MERGE_DIST * 1.25);
  }
}
