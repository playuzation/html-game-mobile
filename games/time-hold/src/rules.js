// 규칙: 목표 시간 출제(1.0~10.0초), ±0.1초 판정, 기록 (아무것도 import 하지 않는 리프 모듈)
export const MIN = 1;
export const MAX = 10;
export const TOLERANCE = 0.1;

export class HoldGame {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.rounds = 0;
    this.passes = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.bestDiff = null; // 가장 작았던 오차(초, 절댓값)
    this.target = null;
    this.next();
  }

  // 0.1초 단위 무작위 목표 (직전과 같으면 옆 값으로)
  next() {
    const steps = (MAX - MIN) * 10; // 90
    let s = Math.floor(this.rng() * (steps + 1));
    if (this.target !== null && MIN + s / 10 === this.target) s = s === steps ? 0 : s + 1;
    this.target = Math.round((MIN + s / 10) * 10) / 10;
    this.result = null;
    return this.target;
  }

  // held: 누른 시간(초). 오차는 ms 단위로 반올림해 부동소수 오차 없이 판정
  judge(held) {
    if (this.result) return this.result;
    const diff = Math.round((held - this.target) * 1000) / 1000;
    const pass = Math.abs(diff) <= TOLERANCE;
    this.rounds++;
    if (pass) {
      this.passes++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else this.streak = 0;
    if (this.bestDiff === null || Math.abs(diff) < this.bestDiff) this.bestDiff = Math.abs(diff);
    this.result = { pass, diff, held, target: this.target };
    return this.result;
  }
}
