// 물리 상수 (단위: 타일). 레벨 관문은 이 수치를 기준으로 설계됨
//   1단 점프 최고 높이 = JUMP_V² / (2·GRAV) ≈ 3.6칸, 2단 ≈ 7.2칸, 3단 ≈ 10.8칸
//   대시 거리 = DASH_V · DASH_T ≈ 3.2칸
export const PHYS = {
  W: 0.7,
  H: 0.9,
  GRAV: 40,
  MAX_FALL: 18,
  JUMP_V: 17,
  JUMP_CUT: 7,      // 점프 버튼을 일찍 떼면 상승 속도를 여기까지 줄임
  RUN: 5,
  ACC_GROUND: 60,
  ACC_AIR: 35,
  COYOTE: 0.08,
  BUFFER: 0.12,
  DASH_V: 18,
  DASH_T: 0.18,
  DASH_CD: 0.25,
};

export const STEP = 1 / 120;
