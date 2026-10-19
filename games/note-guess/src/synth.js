// 사각파 소리 (Web Audio) — 사용자 터치 안에서 unlock() 해야 모바일에서 소리가 난다
export class Synth {
  constructor() {
    this.ctx = null;
    this.voices = [];
  }

  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // freqs: 하나 또는 여러 음. gap > 0 이면 그 간격(초)으로 하나씩 펼쳐서(아르페지오)
  play(freqs, { dur = 1.4, gap = 0 } = {}) {
    this.unlock();
    this.stop();
    const list = [].concat(freqs);
    // 사각파는 소리가 커서 작게, 여러 음이면 음마다 더 작게
    const level = 0.12 / Math.sqrt(gap ? 1 : list.length);
    list.forEach((f, i) => {
      const t = this.ctx.currentTime + 0.02 + i * gap;
      const end = gap ? t + Math.max(dur - i * gap, 0.6) : t + dur;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      // 짧은 어택 후 서서히 줄어듦 (클릭음 방지)
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(level, t + 0.01);
      gain.gain.setValueAtTime(level, t + (end - t) * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(end + 0.02);
      this.voices.push({ osc, gain });
    });
  }

  stop() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    for (const { osc, gain } of this.voices) {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      try {
        osc.stop(t + 0.05);
      } catch (e) {} // 아직 시작 전인 음
    }
    this.voices = [];
  }
}
