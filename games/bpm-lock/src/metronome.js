// Web Audio 메트로놈 (4/4 박자, 1박 강세) — 오디오 시계 기준으로 미리 예약해 박자가 흔들리지 않는다
const LOOKAHEAD = 0.12; // 이만큼 앞까지 미리 예약 (초)
const TICK_MS = 25;

export class Metronome {
  constructor() {
    this.ctx = null;
    this.bpm = 120;
    this.running = false;
    this.beats = []; // 예약된 박 { time, beat(0~3) } — 화면 동기화용
  }

  // 사용자 터치 안에서 호출해야 모바일에서 소리가 난다
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  start(bpm) {
    this.unlock();
    this.stop();
    this.bpm = bpm;
    this.running = true;
    this.beat = 0;
    this.index = 0;
    this.nextTime = this.ctx.currentTime + 0.15;
    this.beats = [];
    this.timer = setInterval(() => this._schedule(), TICK_MS);
    this._schedule();
  }

  stop() {
    this.running = false;
    clearInterval(this.timer);
  }

  _schedule() {
    const spb = 60 / this.bpm;
    // 탭이 백그라운드에서 멈췄다 돌아오면 밀린 박을 한꺼번에 울리지 않고 건너뛴다
    if (this.nextTime < this.ctx.currentTime - 0.05) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this._click(this.nextTime, this.beat === 0);
      this.beats.push({ time: this.nextTime, beat: this.beat, idx: this.index++ });
      this.nextTime += spb;
      this.beat = (this.beat + 1) % 4;
    }
    const old = this.ctx.currentTime - 4 * spb - 1;
    while (this.beats.length && this.beats[0].time < old) this.beats.shift();
  }

  _click(time, accent) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1600 : 1000;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  // 지금 시각 기준 마지막으로 울린 박과 다음 박까지의 진행률(0~1)
  phase() {
    const t = this.now;
    let last = null;
    for (const b of this.beats) if (b.time <= t) last = b;
    if (!last) return null;
    const spb = 60 / this.bpm;
    return { beat: last.beat, since: t - last.time, frac: Math.min(1, (t - last.time) / spb), count: last.idx };
  }
}
