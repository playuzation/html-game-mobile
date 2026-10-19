// 사각파 소리 (Web Audio) — 사용자 터치 안에서 unlock() 해야 모바일에서 소리가 난다
export class Synth {
  constructor() {
    this.ctx = null;
    this.voice = null;
  }

  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(freq, dur = 1.2) {
    this.unlock();
    this.stop();
    const t = this.ctx.currentTime + 0.02;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    // 사각파는 소리가 커서 작게, 짧은 어택 후 서서히 줄어듦 (클릭음 방지)
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.gain.setValueAtTime(0.12, t + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.voice = { osc, gain };
  }

  stop() {
    if (!this.voice) return;
    const { osc, gain } = this.voice;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.stop(t + 0.05);
    this.voice = null;
  }
}
