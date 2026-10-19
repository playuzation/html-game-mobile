// 음 이름·주파수·난이도 범위 (아무것도 import 하지 않는 리프 모듈)
// MIDI 번호 기준: A0 = 21, C4 = 60, A4 = 69(440Hz), C8 = 108 → 피아노 88건반 = 21~108

export const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const ALT = { 'C#': 'D♭', 'D#': 'E♭', 'F#': 'G♭', 'G#': 'A♭', 'A#': 'B♭' };
export const PIANO = { low: 21, high: 108 };

// 난이도별 범위 (MIDI, 양끝 포함)
export const LEVELS = {
  easy: { label: '하', low: 60, high: 71, desc: 'C4 ~ B4' },
  normal: { label: '중', low: 36, high: 83, desc: 'C2 ~ B5' },
  hard: { label: '상', low: 21, high: 108, desc: 'A0 ~ C8 (88건반 전체)' },
};

// 모드: 근음 하나 또는 화음 (근음에서 위로 쌓는 반음 간격, symbol 은 코드 표기 접미사)
export const MODES = {
  single: { label: '근음', symbol: '', intervals: [0] },
  maj: { label: '메이저', symbol: '', intervals: [0, 4, 7] },
  min: { label: '마이너', symbol: 'm', intervals: [0, 3, 7] },
  maj7: { label: '메이저 세븐', symbol: 'maj7', intervals: [0, 4, 7, 11] },
  dom7: { label: '도미넌트 세븐', symbol: '7', intervals: [0, 4, 7, 10] },
};

export const pitchClass = (midi) => midi % 12; // 0 = C ... 11 = B
export const octave = (midi) => Math.floor(midi / 12) - 1;
export const noteName = (midi) => NAMES[pitchClass(midi)] + octave(midi);
export const isBlack = (midi) => [1, 3, 6, 8, 10].includes(pitchClass(midi));

// 평균율: A4 = 440Hz
export const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
