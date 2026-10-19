// 게임 규칙: 문제 출제, 판정, UP/DOWN 힌트, 기록 (UI 없이 동작)
import { LEVELS, pitchClass } from './notes.js';

export class NoteGame {
  constructor(level = 'easy', rng = Math.random) {
    this.rng = rng;
    this.level = level;
    this.solved = 0; // 맞힌 문제 수
    this.firstTry = 0; // 한 번에 맞힌 수
    this.wrong = 0; // 오답 총합
    this.streak = 0; // 연속 한 번에 맞히기
    this.bestStreak = 0;
    this.midi = null;
    this.next();
  }

  setLevel(level) {
    this.level = level;
    this.streak = 0;
    this.next();
  }

  // 새 문제: 범위 안에서 무작위 (직전과 같은 건반은 피함)
  next() {
    const { low, high } = LEVELS[this.level];
    let m = low + Math.floor(this.rng() * (high - low + 1));
    if (m === this.midi) m = m === high ? low : m + 1; // 다시 뽑지 않고 옆 건반으로 (무한 반복 없음)
    this.midi = m;
    this.tried = new Set(); // 이번 문제에서 이미 누른(틀린) 음
    this.done = false;
    return m;
  }

  get answer() {
    return pitchClass(this.midi);
  }

  // pc: 0(C)~11(B). 반환 { correct, hint: 'up'|'down'|null } — 이미 누른 음·끝난 문제는 null
  guess(pc) {
    if (this.done || this.tried.has(pc)) return null;
    if (pc === this.answer) {
      this.done = true;
      this.solved++;
      if (this.tried.size === 0) {
        this.firstTry++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
      } else this.streak = 0;
      return { correct: true, hint: null };
    }
    this.tried.add(pc);
    this.wrong++;
    // C 가 가장 낮고 B 가 가장 높다고 보고 비교
    return { correct: false, hint: this.answer > pc ? 'up' : 'down' };
  }

  get accuracy() {
    return this.solved ? this.firstTry / this.solved : null;
  }
}
