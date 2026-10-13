// 게임 전역 상수 (다른 모듈을 import 하지 않는 최하위 리프 모듈)

export const COLS = 9;              // 가로 칸 수
export const HOP_MS = 110;          // 한 칸 점프 시간
export const CAMERA_OFFSET = 3;     // 화면 하단에서 플레이어까지 유지할 줄 수
export const CREEP_SPEED = 0.3;     // 가만히 있어도 카메라가 전진하는 속도 (줄/초)
export const WRAP_MARGIN = 5;       // 차/통나무가 화면 밖에서 순환하는 여유 칸 (최대 길이보다 커야 함)

export const DIRS = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

export const COLORS = {
  grass: ['#9be36f', '#8fd765'],
  grassDark: ['#7cc456', '#71b84d'],
  road: '#5d626b',
  roadLine: '#d9dde3',
  water: '#4fb6ec',
  waterLight: '#86d0f5',
  trunk: '#8b5a2b',
  trunkSide: '#6e461f',
  leafTop: '#5cc24f',
  leafSide: '#3f9636',
  logTop: '#b98048',
  logSide: '#8a5a2c',
  cars: ['#ef5350', '#ffb627', '#4f83f0', '#a066e0', '#2fc4a0'],
  carGlass: '#cfeaff',
  playerTop: '#ffffff',
  playerSide: '#d6d6d6',
  comb: '#ef4444',
  beak: '#f7a21b',
  eye: '#222222',
  shadow: 'rgba(0,0,0,0.18)',
};
