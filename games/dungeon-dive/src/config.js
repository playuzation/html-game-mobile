// 물리·전투 상수 (단위: 타일). 레벨 검증 모델(level.js)은 1단 점프 3칸, 수평 4칸 기준
//   1단 점프 최고 높이 = JUMP_V² / (2·GRAV) ≈ 3.6칸
export const PHYS = {
  W: 0.7,
  H: 0.9,
  GRAV: 40,
  MAX_FALL: 18,
  JUMP_V: 17,
  JUMP_CUT: 7,
  RUN: 5.5,
  ACC_GROUND: 60,
  ACC_AIR: 40,
  COYOTE: 0.08,
  BUFFER: 0.12,
};

export const COMBAT = {
  HP: 5,
  ATK_TIME: 0.18,
  ATK_COOLDOWN: 0.32,
  ATK_RANGE: 1.1,
  INVULN: 1.0,
  KNOCK_X: 6,
  KNOCK_Y: 8,
  STOMP_BOUNCE: 12,
};

export const FLOORS = 10;
export const BOSS_FLOORS = [5, 10];
export const STEP = 1 / 120;
