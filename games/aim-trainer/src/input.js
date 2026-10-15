// 입력: 터치 드래그로 시점 회전 + 사격 버튼 / 데스크톱은 마우스 잠금(Pointer Lock)으로 시점, 클릭 사격
// onLook(dxPx, dyPx), onFire()
export function bindInput({ surface, fire }, { onLook, onFire, onLockChange }) {
  // 터치/펜: 화면 어디든 드래그 (여러 손가락이면 각각 따로)
  const last = new Map();
  surface.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    surface.setPointerCapture(e.pointerId);
    last.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  surface.addEventListener('pointermove', (e) => {
    const p = last.get(e.pointerId);
    if (!p) return;
    onLook(e.clientX - p.x, e.clientY - p.y);
    last.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const end = (e) => last.delete(e.pointerId);
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);

  // 사격 버튼 (누르는 순간 발사 — 다른 손가락이 드래그 중이어도 동작)
  fire.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fire.classList.add('on');
    onFire();
  });
  const up = () => fire.classList.remove('on');
  fire.addEventListener('pointerup', up);
  fire.addEventListener('pointercancel', up);

  // 마우스: 클릭하면 잠금, 잠긴 상태에서 이동 = 시점, 클릭 = 사격
  surface.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement === surface) {
      if (e.button === 0) onFire();
    } else surface.requestPointerLock?.();
  });
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === surface) onLook(e.movementX, e.movementY);
  });
  document.addEventListener('pointerlockchange', () => onLockChange(document.pointerLockElement === surface));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      onFire();
    }
  });
}
