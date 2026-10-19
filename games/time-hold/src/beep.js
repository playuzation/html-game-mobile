// 삐 소리 (Web Audio, 리프) — 사용자 터치 안에서 unlock() 해야 모바일에서 소리가 난다
export class Beep {
  constructor() {
    this.ctx = null;
    this.voice = null;
  }

  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // sec 가 있으면 그 시간만큼 울리고 끝나는 시각(초 뒤)을 돌려준다. 없으면 stop() 까지 계속
  play(sec = null, hz = 880, level = 0.15) {
    this.unlock();
    this.stop();
    const t = this.ctx.currentTime + 0.03;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz;
    // 아주 짧은 페이드로 클릭음 방지 (길이에는 영향 거의 없음)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.005);
    if (sec !== null) {
      gain.gain.setValueAtTime(level, t + sec - 0.005);
      gain.gain.linearRampToValueAtTime(0, t + sec);
    }
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    if (sec !== null) osc.stop(t + sec + 0.01); // stop 은 start 뒤에만 부를 수 있다
    this.voice = { osc, gain };
    return t - this.ctx.currentTime + (sec ?? 0);
  }

  stop() {
    if (!this.voice) return;
    const t = this.ctx.currentTime;
    const { osc, gain } = this.voice;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.01);
    try {
      osc.stop(t + 0.02);
    } catch (e) {} // 이미 멈춘 소리
    this.voice = null;
  }
}
