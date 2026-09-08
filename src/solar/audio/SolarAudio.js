// 100% procedural Web Audio (no external files), matching the rest of this
// portfolio's audio approach. A soft ambient drone bed plus a short rising
// "discovery" chime when a content node is opened.
export class SolarAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.gainNode = null;
    this._started = false;
    const start = () => {
      if (this._started) return;
      this._started = true;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._buildAmbient();
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
  }

  _buildAmbient() {
    const ctx = this.ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.12;
    this.gainNode.connect(ctx.destination);

    for (const freq of [55, 82.5, 110]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.25;
      osc.connect(oscGain).connect(this.gainNode);
      osc.start();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.gainNode) this.gainNode.gain.value = muted ? 0 : 0.12;
  }

  playDiscoveryChime() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.55);
    });
  }
}
