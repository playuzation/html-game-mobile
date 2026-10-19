// 게임 규칙: 문제 출제, 판정, UP/DOWN 힌트, 기록 (UI 없이 동작)
// 모드가 화음이면 구성음을 모두 찾아야 한 문제가 끝난다
import { LEVELS, MODES, PIANO, pitchClass } from './notes.js';

export class NoteGame {
  constructor(level = 'easy', rng = Math.random, mode = 'single') {
    this.rng = rng;
    this.level = level;
    this.mode = mode;
    this.solved = 0; // 맞힌 문제 수
    this.firstTry = 0; // 한 번도 안 틀리고 맞힌 수
    this.wrong = 0; // 오답 총합
    this.streak = 0; // 연속 한 번에 맞히기
    this.bestStreak = 0;
    this.midi = null; // 근음
    this.next();
  }

  setLevel(level) {
    this.level = level;
    this.streak = 0;
    this.next();
  }

  setMode(mode) {
    this.mode = mode;
    this.streak = 0;
    this.next();
  }

  // 근음 범위: 난이도 범위 안 + 화음 맨 윗음이 피아노(C8)를 넘지 않게
  get rootRange() {
    const { low, high } = LEVELS[this.level];
    const top = Math.max(...MODES[this.mode].intervals);
    return { low, high: Math.min(high, PIANO.high - top) };
  }

  // 새 문제: 범위 안에서 무작위 (직전과 같은 근음은 피함)
  next() {
    const { low, high } = this.rootRange;
    let m = low + Math.floor(this.rng() * (high - low + 1));
    if (m === this.midi) m = m === high ? low : m + 1; // 다시 뽑지 않고 옆 건반으로 (무한 반복 없음)
    this.midi = m;
    this.notes = MODES[this.mode].intervals.map((i) => m + i); // 울릴 건반들 (MIDI)
    this.answers = new Set(this.notes.map(pitchClass)); // 찾아야 할 음 (C=0 ~ B=11)
    this.found = new Set(); // 찾은 구성음
    this.tried = new Set(); // 이번 문제에서 틀린 음
    this.done = false;
    return m;
  }

  get answer() {
    return pitchClass(this.midi);
  }

  // pc: 0(C)~11(B). 반환 { correct, complete, hint } — 이미 누른 음·끝난 문제는 null
  // hint: 아직 못 찾은 구성음이 모두 더 높으면 'up', 모두 낮으면 'down', 양쪽에 있으면 'both'
  guess(pc) {
    if (this.done || this.tried.has(pc) || this.found.has(pc)) return null;
    if (this.answers.has(pc)) {
      this.found.add(pc);
      const complete = this.found.size === this.answers.size;
      if (complete) {
        this.done = true;
        this.solved++;
        if (this.tried.size === 0) {
          this.firstTry++;
          this.streak++;
          this.bestStreak = Math.max(this.bestStreak, this.streak);
        } else this.streak = 0;
      }
      return { correct: true, complete, hint: null };
    }
    this.tried.add(pc);
    this.wrong++;
    // C 가 가장 낮고 B 가 가장 높다고 보고 비교
    const left = [...this.answers].filter((a) => !this.found.has(a));
    const up = left.some((a) => a > pc);
    const down = left.some((a) => a < pc);
    return { correct: false, complete: false, hint: up && down ? 'both' : up ? 'up' : 'down' };
  }

  get accuracy() {
    return this.solved ? this.firstTry / this.solved : null;
  }
}
