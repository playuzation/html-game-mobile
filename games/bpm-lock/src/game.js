// 게임 규칙: 라운드·시도·점수·자물쇠 숫자 계산 (UI 없이 동작 — 리프 모듈)
export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const ROUNDS = 5;
export const TRIES = 3;
export const TOLERANCE = 2; // ±2 BPM 이내면 정답
const TRY_WEIGHT = [1, 0.7, 0.4]; // 몇 번째 시도에 맞췄는지에 따른 배율

// 자물쇠: place = 0(백의 자리) · 1(십) · 2(일), 각 자리는 0↔9 순환
export function digits(value) {
  return [Math.floor(value / 100) % 10, Math.floor(value / 10) % 10, value % 10];
}
export function turnDigit(value, place, delta) {
  const d = digits(value);
  d[place] = (d[place] + delta + 10) % 10;
  return d[0] * 100 + d[1] * 10 + d[2];
}

// 정확도 점수 0~100: 오차율 25% 이상이면 0
export function accuracy(guess, target) {
  const diff = Math.abs(guess - target);
  if (diff <= TOLERANCE) return 100;
  return Math.max(0, Math.round(100 - (diff / target) * 400));
}

export function closeness(guess, target) {
  const diff = Math.abs(guess - target);
  const r = diff / target;
  if (diff <= TOLERANCE) return '정답!';
  if (r <= 0.05) return '아주 가까워요';
  if (r <= 0.15) return '가까워요';
  if (r <= 0.3) return '조금 멀어요';
  return '많이 멀어요';
}

export class BpmGame {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.round = 0;
    this.total = 0;
    this.history = []; // { target, guesses, score }
    this.next();
  }

  get over() {
    return this.round > ROUNDS;
  }

  next() {
    this.round++;
    if (this.over) return;
    this.target = MIN_BPM + Math.floor(this.rng() * (MAX_BPM - MIN_BPM + 1));
    this.guesses = [];
    this.done = false;
  }

  // 반환: { ok, valid, direction('up'|'down'|null), label, score, finished }
  guess(value) {
    if (this.done || this.over) return null;
    if (value < MIN_BPM || value > MAX_BPM) return { valid: false };
    this.guesses.push(value);
    const ok = Math.abs(value - this.target) <= TOLERANCE;
    const finished = ok || this.guesses.length >= TRIES;
    let score = 0;
    if (finished) {
      // 맞추면 시도 배율, 끝까지 못 맞추면 마지막 시도의 정확도를 최하 배율로
      score = Math.round(accuracy(value, this.target) * TRY_WEIGHT[this.guesses.length - 1]);
      this.total += score;
      this.done = true;
      this.history.push({ target: this.target, guesses: [...this.guesses], score });
    }
    return {
      valid: true,
      ok,
      finished,
      score,
      direction: ok ? null : value < this.target ? 'up' : 'down',
      label: closeness(value, this.target),
      left: TRIES - this.guesses.length,
    };
  }
}
