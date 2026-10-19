/**
 * Procedural Web Audio Engine for Jeswin's 3D Portfolio & Game
 * Generates all sounds in real-time via Web Audio API:
 * Engine revs, drift tire screech, car horn, collisions, gem chimes,
 * bowling pin strikes, brick smash explosions, and trampoline spring boings!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Master Gain
    this.masterGain = null;

    // Engine Sound Nodes
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Tire Screech Nodes
    this.screechSource = null;
    this.screechGain = null;
    this.noiseBuffer = null;

    // State tracking
    this.lastHonkTime = 0;
    this.lastCollisionTime = 0;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSound();
      this.setupScreechSound();

      this.isInitialized = true;
      console.log('🔊 Web Audio Synthesizer initialized successfully');
    } catch (err) {
      console.warn('AudioContext not supported or blocked:', err);
    }
  }

  resume() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  setupEngineSound() {
    if (!this.ctx) return;

    // Main Engine Oscillator (Sawtooth for rumble)
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Sub rumble
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    // Lowpass filter for engine body
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Engine Gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  setupScreechSound() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.screechSource = this.ctx.createBufferSource();
    this.screechSource.buffer = this.noiseBuffer;
    this.screechSource.loop = true;

    const screechFilter = this.ctx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    screechFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.screechSource.connect(screechFilter);
    screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);

    this.screechSource.start();
  }

  updateEngine(speed, isAccelerating, isBraking) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const absSpeed = Math.abs(speed);
    const normSpeed = Math.min(absSpeed / 30, 1);

    const baseFreq = 42 + normSpeed * 140 + (isAccelerating ? 25 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.08);

    const filterFreq = 140 + normSpeed * 400 + (isAccelerating ? 150 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);

    const targetGain = 0.07 + normSpeed * 0.12 + (isAccelerating ? 0.06 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  updateDrift(lateralSlip) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const slip = Math.min(Math.max(lateralSlip, 0), 1);
    const screechVol = slip > 0.28 ? (slip - 0.28) * 0.45 : 0;
    this.screechGain.gain.setTargetAtTime(screechVol, this.ctx.currentTime, 0.06);
  }

  playHonk() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const now = Date.now();
    if (now - this.lastHonkTime < 280) return;
    this.lastHonkTime = now;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, t); // A4
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(554.37, t); // C#5

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.setValueAtTime(0.25, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  playCollision(intensity = 1.0) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const now = Date.now();
    if (now - this.lastCollisionTime < 80) return;
    this.lastCollisionTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

    const clampedIntensity = Math.min(Math.max(intensity, 0.2), 1.0);
    gain.gain.setValueAtTime(0.35 * clampedIntensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playBowlingStrike() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Resonant wooden pin clatter
    const freqs = [380, 520, 680, 890, 1100];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.015);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + idx * 0.015 + 0.25);

      gain.gain.setValueAtTime(0.18, t + idx * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.015 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.015);
      osc.stop(t + idx * 0.015 + 0.32);
    });
  }

  playBrickSmash() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    // Low rumble + crunch noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  playTrampolineSpring() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.35);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  playGemChime() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.42);
    });
  }

  playBoost() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.4);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  playResetMagic() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [330, 440, 554, 660, 880];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.05);

      gain.gain.setValueAtTime(0.12, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.36);
    });
  }
}

window.soundEngine = new SoundEngine();
