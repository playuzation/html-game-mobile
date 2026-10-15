// 3D 계산 (아무것도 import 하지 않는 리프 모듈)
// 카메라는 원점, yaw(좌우)·pitch(상하) 라디안. yaw=0, pitch=0 이면 +z 방향을 본다. y 는 위쪽.

export const DEG = Math.PI / 180;

export function dirFrom(yaw, pitch) {
  const c = Math.cos(pitch);
  return { x: Math.sin(yaw) * c, y: Math.sin(pitch), z: Math.cos(yaw) * c };
}

// 두 방향 사이 각도
export function angleBetween(a, b) {
  const la = Math.hypot(a.x, a.y, a.z);
  const lb = Math.hypot(b.x, b.y, b.z);
  const d = (a.x * b.x + a.y * b.y + a.z * b.z) / (la * lb);
  return Math.acos(Math.max(-1, Math.min(1, d)));
}

// 월드 좌표 → 카메라 좌표 (x 오른쪽, y 위, z 앞)
export function toCamera(p, cam) {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const x1 = cy * p.x - sy * p.z;
  const z1 = sy * p.x + cy * p.z;
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  return { x: x1, y: cp * p.y - sp * z1, z: sp * p.y + cp * z1 };
}

// 카메라 좌표 → 화면 좌표. 카메라 뒤면 null
export function project(c, view) {
  if (c.z <= 0.05) return null;
  return { x: view.cx + (view.f * c.x) / c.z, y: view.cy - (view.f * c.y) / c.z, s: view.f / c.z };
}
