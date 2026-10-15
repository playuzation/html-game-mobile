// 자동차 제원 (단위: m, s, kg) — 아무것도 import 하지 않는 리프 모듈
export const CAR = {
  LENGTH: 4.5,
  WIDTH: 1.85,
  WHEELBASE: 2.7,
  MASS: 1400,
  MAX_STEER: (35 * Math.PI) / 180, // 앞바퀴 최대 조향각
  STEER_RATE: 2.5, // 조향각 변화 속도 (rad/s)
  POWER: 110000, // 최대 출력 (W) ≈ 150마력
  MAX_ACCEL: 4.2, // 저속 최대 가속도 (접지 한계)
  BRAKE: 8.5, // 최대 감속도
  DRAG: 0.55, // 공기 저항 계수 (½·ρ·Cd·A)
  ROLL: 0.15, // 구름 저항 가속도 (포장도로)
  GRASS_ROLL: 1.6, // 잔디 위 구름 저항
  REVERSE_MAX: 20 / 3.6, // 후진 최고 속도
  IDLE_CREEP: 1.2, // D/R 에서 페달을 떼면 천천히 굴러가는 속도
};

// 자동 변속기: 단수별 최고 속도(km/h)
export const GEARS = [22, 45, 75, 110, 150, 230];
export const RPM = { IDLE: 800, MAX: 6500, SHIFT: 6000 };
