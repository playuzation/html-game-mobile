// 입력: 키보드 + 화면 십자키/A·B 버튼. 눌린 상태(held)와 이번에 눌림(pressed)을 구분한다
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'a', Space: 'a', KeyK: 'a',
  KeyX: 'b', KeyJ: 'b',
};

export class Input {
  constructor() {
    this.held = { left: false, right: false, up: false, down: false, a: false, b: false };
    this.pressed = new Set();
    window.addEventListener('keydown', (e) => {
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      if (!e.repeat) this.set(k, true);
    });
    window.addEventListener('keyup', (e) => KEYS[e.code] && this.set(KEYS[e.code], false));
    const clear = () => Object.keys(this.held).forEach((k) => (this.held[k] = false));
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
  }

  get left() { return this.held.left; }
  get right() { return this.held.right; }
  get down() { return this.held.down; }
  get jumpHeld() { return this.held.a; }

  set(key, down) {
    if (down && !this.held[key]) this.pressed.add(key);
    this.held[key] = down;
  }

  consume(key) {
    return this.pressed.delete(key);
  }

  clearPressed() {
    this.pressed.clear();
  }

  // 십자키: 누른 위치의 방향 (손가락을 미끄러뜨려도 동작)
  bindDpad(el) {
    let id = null;
    const dirs = ['left', 'right', 'up', 'down'];
    const apply = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      const on = { left: dx < -0.3, right: dx > 0.3, up: dy < -0.45, down: dy > 0.45 };
      for (const d of dirs) {
        this.set(d, on[d]);
        el.classList.toggle(d, on[d]);
      }
    };
    const release = () => {
      id = null;
      for (const d of dirs) {
        this.set(d, false);
        el.classList.remove(d);
      }
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      el.setPointerCapture(id);
      apply(e);
    });
    el.addEventListener('pointermove', (e) => e.pointerId === id && apply(e));
    el.addEventListener('pointerup', (e) => e.pointerId === id && release());
    el.addEventListener('pointercancel', (e) => e.pointerId === id && release());
  }

  bindButton(el, key) {
    const up = () => {
      this.set(key, false);
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      this.set(key, true);
      el.classList.add('on');
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
}
