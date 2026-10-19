// 자물쇠 다이얼: 자리마다 ▲/▼ 로 한 칸씩 돌린다 (DOM) — 숫자 계산은 game.js 의 turnDigit 사용
import { digits, turnDigit } from './game.js';

export class DialLock {
  constructor(el, value, onChange) {
    this.el = el;
    this.value = value;
    this.onChange = onChange;
    el.innerHTML = [0, 1, 2]
      .map(
        (p) => `<div class="wheel" data-p="${p}">
          <button type="button" class="up" data-d="1" aria-label="${['백', '십', '일'][p]}의 자리 올리기">▲</button>
          <div class="win"><div class="roll"><span class="prev"></span><span class="cur"></span><span class="next"></span></div></div>
          <button type="button" class="down" data-d="-1" aria-label="${['백', '십', '일'][p]}의 자리 내리기">▼</button>
        </div>`,
      )
      .join('');
    // 누르는 순간 반응 (빠르게 연타 가능)
    el.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('button');
      if (!b || this.disabled) return;
      e.preventDefault();
      const p = Number(b.closest('.wheel').dataset.p);
      this.turn(p, Number(b.dataset.d));
    });
    this.render();
  }

  turn(place, delta) {
    this.value = turnDigit(this.value, place, delta);
    this.render(place, delta);
    this.onChange?.(this.value);
  }

  set(value) {
    this.value = value;
    this.render();
  }

  setDisabled(v) {
    this.disabled = v;
    this.el.classList.toggle('disabled', v);
  }

  render(place = null, delta = 0) {
    const d = digits(this.value);
    this.el.querySelectorAll('.wheel').forEach((w, i) => {
      // 위 칸은 이전 숫자, 아래 칸은 다음 숫자 (▲ 를 누르면 아래에서 올라온다)
      w.querySelector('.prev').textContent = (d[i] + 9) % 10;
      w.querySelector('.cur').textContent = d[i];
      w.querySelector('.next').textContent = (d[i] + 1) % 10;
      const roll = w.querySelector('.roll');
      if (i === place) {
        roll.classList.remove('from-up', 'from-down');
        void roll.offsetWidth;
        roll.classList.add(delta > 0 ? 'from-up' : 'from-down');
      }
    });
  }
}
