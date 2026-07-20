// All sound here is procedurally synthesized via the Web Audio API — filtered noise for wind
// and snow-crunch, swept oscillators for distant bird chirps — no external audio files.
// Browsers block audio until a real user gesture, so the AudioContext is created lazily on
// the first keydown/pointerdown rather than at page load.
const CRUNCH_INTERVAL_BASE = 0.22;
const BIRD_INTERVAL_MIN = 6;
const BIRD_INTERVAL_MAX = 18;

export class AudioEngine {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this._crunchTimer = 0;
    this._birdTimer = 3 + Math.random() * 5;

    this._resumeOnGesture = this._resumeOnGesture.bind(this);
    window.addEventListener('pointerdown', this._resumeOnGesture);
    window.addEventListener('keydown', this._resumeOnGesture);
  }

  _resumeOnGesture() {
    if (this.enabled) return;
    this.enabled = true;
    window.removeEventListener('pointerdown', this._resumeOnGesture);
    window.removeEventListener('keydown', this._resumeOnGesture);
    this._init();
  }

  _init() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    // A shared, gentle feedback delay every ambient sound is partly routed through, for a
    // touch of "open mountain valley" echo rather than a completely dry mix.
    this.echoDelay = this.ctx.createDelay(1.0);
    this.echoDelay.delayTime.value = 0.35;
    const echoFeedback = this.ctx.createGain();
    echoFeedback.gain.value = 0.25;
    this.echoDelay.connect(echoFeedback);
    echoFeedback.connect(this.echoDelay);
    this.echoDelay.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.echoDelay);

    this.crunchBuffer = this._createNoiseBuffer(1.2);
    this._buildWind();
  }

  _createNoiseBuffer(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  _buildWind() {
    const source = this.ctx.createBufferSource();
    source.buffer = this._createNoiseBuffer(4);
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.04;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.windFilter = filter;
    this.windGain = gain;
  }

  _playCrunch() {
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.crunchBuffer;
    const offset = Math.random() * (this.crunchBuffer.duration - 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200 + Math.random() * 900;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now, offset, 0.12);
    source.stop(now + 0.12);
  }

  _playBirdChirp() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 1800 + Math.random() * 900;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // `speed01` is 0..1 normalized ski speed — wind gets louder and brighter (higher lowpass
  // cutoff) the faster you're going, and snow-crunch bursts fire faster at higher speed too.
  update(dt, { isSkiing, speed01 }) {
    if (!this.enabled || !this.ctx) return;

    const targetFreq = 300 + speed01 * 1800;
    const targetGain = 0.03 + speed01 * 0.17;
    this.windFilter.frequency.value += (targetFreq - this.windFilter.frequency.value) * Math.min(1, dt * 3);
    this.windGain.gain.value += (targetGain - this.windGain.gain.value) * Math.min(1, dt * 3);

    if (isSkiing && speed01 > 0.05) {
      this._crunchTimer -= dt;
      if (this._crunchTimer <= 0) {
        this._playCrunch();
        this._crunchTimer = CRUNCH_INTERVAL_BASE - speed01 * 0.12 + Math.random() * 0.05;
      }
    }

    this._birdTimer -= dt;
    if (this._birdTimer <= 0) {
      this._playBirdChirp();
      this._birdTimer = BIRD_INTERVAL_MIN + Math.random() * (BIRD_INTERVAL_MAX - BIRD_INTERVAL_MIN);
    }
  }
}
