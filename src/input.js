// 터치(탭/스와이프), 마우스, 키보드 입력 → 'up' | 'down' | 'left' | 'right'
const SWIPE_PX = 24;
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', Space: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function bindInput(el, onMove) {
  let start = null;

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    start = { x: e.clientX, y: e.clientY };
  });

  el.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) onMove('up');
    else if (Math.abs(dx) > Math.abs(dy)) onMove(dx > 0 ? 'right' : 'left');
    else onMove(dy > 0 ? 'down' : 'up');
  });

  el.addEventListener('pointercancel', () => (start = null));

  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.code];
    if (!dir || e.repeat) return;
    e.preventDefault();
    onMove(dir);
  });
}
