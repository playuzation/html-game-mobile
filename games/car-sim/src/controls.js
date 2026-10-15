// 입력: 화면 핸들(돌리기)·페달·기어 버튼 + 키보드 → { throttle, brake, steer }
const WHEEL_MAX = 450; // 핸들 최대 회전각(도) — 이때 앞바퀴 최대 조향
const WHEEL_RETURN = 600; // 손을 떼면 돌아오는 속도(도/초)

export class Controls {
  constructor({ wheel, gas, brake, gears }, onGear) {
    this.wheelDeg = 0;
    this.grabbing = false;
    this.gas = 0;
    this.brakeOn = 0;
    this.keys = new Set();
    this.onGear = onGear;
    this._wheel(wheel);
    this._pedal(gas, (v) => (this.gas = v));
    this._pedal(brake, (v) => (this.brakeOn = v));
    // click 은 다른 손가락이 페달을 누르고 있으면 발생하지 않으므로 pointerdown 으로 받는다
    gears.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      e.preventDefault();
      onGear(b.dataset.g);
    });
    const map = { ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', Space: 'brake', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    window.addEventListener('keydown', (e) => {
      if (map[e.code]) {
        e.preventDefault();
        this.keys.add(map[e.code]);
      }
      const g = { KeyP: 'P', KeyR: 'R', KeyN: 'N', KeyF: 'D' }[e.code];
      if (g) onGear(g);
    });
    window.addEventListener('keyup', (e) => map[e.code] && this.keys.delete(map[e.code]));
    window.addEventListener('blur', () => this.keys.clear());
  }

  _wheel(el) {
    let id = null;
    let last = 0;
    const angle = (e) => {
      const r = el.getBoundingClientRect();
      return (Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180) / Math.PI;
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      el.setPointerCapture(id);
      last = angle(e);
      this.grabbing = true;
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const a = angle(e);
      let d = a - last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      last = a;
      this.wheelDeg = Math.max(-WHEEL_MAX, Math.min(WHEEL_MAX, this.wheelDeg + d));
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      this.grabbing = false;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // 페달: 누른 위치가 아래일수록 깊게 (위쪽 30% = 살짝, 아래 = 끝까지)
  _pedal(el, set) {
    let id = null;
    const depth = (e) => {
      const r = el.getBoundingClientRect();
      return Math.max(0.3, Math.min(1, (e.clientY - r.top) / r.height + 0.25));
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      el.setPointerCapture(id);
      set(depth(e));
      el.classList.add('on');
    });
    el.addEventListener('pointermove', (e) => e.pointerId === id && set(depth(e)));
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      set(0);
      el.classList.remove('on');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  read(dt) {
    const k = this.keys;
    if (k.has('left') || k.has('right')) {
      const dir = (k.has('right') ? 1 : 0) - (k.has('left') ? 1 : 0);
      this.wheelDeg = Math.max(-WHEEL_MAX, Math.min(WHEEL_MAX, this.wheelDeg + dir * 700 * dt));
    } else if (!this.grabbing) {
      const r = WHEEL_RETURN * dt;
      this.wheelDeg = Math.abs(this.wheelDeg) <= r ? 0 : this.wheelDeg - Math.sign(this.wheelDeg) * r;
    }
    return {
      throttle: Math.max(this.gas, k.has('gas') ? 1 : 0),
      brake: Math.max(this.brakeOn, k.has('brake') ? 1 : 0),
      steer: this.wheelDeg / WHEEL_MAX,
    };
  }
}
