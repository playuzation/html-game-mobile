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

export const pitchClass = (midi) => midi % 12; // 0 = C ... 11 = B
export const octave = (midi) => Math.floor(midi / 12) - 1;
export const noteName = (midi) => NAMES[pitchClass(midi)] + octave(midi);
export const isBlack = (midi) => [1, 3, 6, 8, 10].includes(pitchClass(midi));

// 평균율: A4 = 440Hz
export const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
