/**
 * Procedural Zen Audio Engine built with browser Web Audio API.
 * Provides calming pentatonic interactions and generative ambient soundscapes.
 */

class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentSoundscape: string = 'bowls';
  private ambientNodes: { stop: () => void }[] = [];
  private ambientTimer: number | null = null;
  private initialized: boolean = false;

  // Pentatonic frequency scale for mindful harmony (C4 pentatonic scale)
  private readonly pentatonicScale = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00  // A5
  ];

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0 : 0.8;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    if (!muted && !this.initialized) {
      this.init();
    }
  }

  public setSoundscapeVolume(vol: number) {
    if (this.ambientGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.ambientGain.gain.setTargetAtTime(clamped * 0.5, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Play a peaceful pentatonic note corresponding to step index or element index
   */
  public playStepChime(index: number = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const freq = this.pentatonicScale[Math.abs(index) % this.pentatonicScale.length];
      const now = this.ctx.currentTime;

      // Soft fundamental sine
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Warm subtle overtone
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 2, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      subOsc.connect(subGain);
      gain.connect(this.sfxGain);
      subGain.connect(this.sfxGain);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 1.0);
      subOsc.stop(now + 0.6);
    } catch {
      // Audio safety
    }
  }

  /**
   * Play a triumphant, deeply satisfying harmonic resonance when an element pair connects
   */
  public playPairConnected(index: number = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const baseFreq = this.pentatonicScale[index % 5];
      const now = this.ctx.currentTime;

      // Two harmonic notes (root + fifth)
      const freqs = [baseFreq, baseFreq * 1.5];

      freqs.forEach((f, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        gain.gain.setValueAtTime(0, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.04 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + i * 0.04);
        osc.stop(now + 1.5);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Play peaceful celebratory chord sweep on victory
   */
  public playVictoryChord() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      // Beautiful serene C-maj9 arpeggio: C4, G4, C5, E5, B5, D6
      const chord = [261.63, 392.00, 523.25, 659.25, 987.77, 1174.66];

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const delay = idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + delay);
        osc.stop(now + delay + 2.5);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Play gentle undo chime
   */
  public playUndo() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2); // down to C4

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio safety
    }
  }

  /**
   * Card Dealing sound (soft paper slide and snap)
   */
  public playCardDeal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio safety
    }
  }

  /**
   * Card Selection tap
   */
  public playCardSelect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Audio safety
    }
  }

  /**
   * Trick Won fanfare / points collected
   */
  public playTrickWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + delay);
        osc.stop(now + delay + 0.45);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Hazari 1000 Points Victory Fanfare
   */
  public playHazari1000Fanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Grand celebratory fanfare: D4, F#4, A4, D5, F#5, A5
      const notes = [293.66, 369.99, 440.00, 587.33, 739.99, 880.00];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const delay = idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + delay);
        osc.stop(now + delay + 1.3);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Switch the ambient generative soundscape
   */
  public startSoundscape(type: string) {
    this.stopSoundscape();
    this.currentSoundscape = type;

    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.ambientGain) return;

    switch (type) {
      case 'bowls':
        this.runSingingBowls();
        break;
      case 'rain':
        this.runRain();
        break;
      case 'drone':
        this.runDeepDrone();
        break;
      case 'chimes':
        this.runWindChimes();
        break;
      case 'stream':
        this.runMountainStream();
        break;
      default:
        this.runSingingBowls();
    }
  }

  public stopSoundscape() {
    if (this.ambientTimer !== null) {
      window.clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.ambientNodes.forEach(n => {
      try {
        n.stop();
      } catch {
        // ignore
      }
    });
    this.ambientNodes = [];
  }

  // --- GENERATIVE SOUNDSCAPE IMPLEMENTATIONS ---

  private runSingingBowls() {
    if (!this.ctx || !this.ambientGain) return;

    // Harmonic bowls tuned to 216Hz and 432Hz
    const playBowl = (freq: number, duration: number = 6) => {
      if (!this.ctx || !this.ambientGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // subtle vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, now);
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(osc.frequency);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + duration);
      osc.stop(now + duration);
    };

    // Initial strike
    playBowl(216, 7);
    setTimeout(() => playBowl(324, 7), 1500);

    // Periodic gentle strikes
    this.ambientTimer = window.setInterval(() => {
      const bowlFreqs = [216, 270, 324, 432];
      const pick = bowlFreqs[Math.floor(Math.random() * bowlFreqs.length)];
      playBowl(pick, 6 + Math.random() * 3);
    }, 4500);
  }

  private runRain() {
    if (!this.ctx || !this.ambientGain) return;

    // Filtered noise generator for continuous rain texture
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // soft pinkish noise
      lastOut = output[i];
      output[i] *= 2.2;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.ambientGain);

    whiteNoise.start();
    this.ambientNodes.push({ stop: () => whiteNoise.stop() });

    // Water droplet generator
    this.ambientTimer = window.setInterval(() => {
      if (!this.ctx || !this.ambientGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const startF = 1200 + Math.random() * 800;

      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(startF, now);
      dropOsc.frequency.exponentialRampToValueAtTime(startF * 0.4, now + 0.06);

      dropGain.gain.setValueAtTime(0.04, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      dropOsc.connect(dropGain);
      dropGain.connect(this.ambientGain);

      dropOsc.start(now);
      dropOsc.stop(now + 0.1);
    }, 380);
  }

  private runDeepDrone() {
    if (!this.ctx || !this.ambientGain) return;

    const freqs = [108, 162, 216];
    freqs.forEach(f => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start();
      this.ambientNodes.push({ stop: () => osc.stop() });
    });
  }

  private runWindChimes() {
    if (!this.ctx || !this.ambientGain) return;

    const chimeNotes = [783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];

    const strikeChime = () => {
      if (!this.ctx || !this.ambientGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 3.3);
    };

    strikeChime();
    this.ambientTimer = window.setInterval(() => {
      if (Math.random() > 0.3) {
        strikeChime();
      }
    }, 1800);
  }

  private runMountainStream() {
    if (!this.ctx || !this.ambientGain) return;

    // Filtered bubble noise with modulated resonance
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    noiseSource.start();
    this.ambientNodes.push({ stop: () => noiseSource.stop() });

    // Stream bubbles
    this.ambientTimer = window.setInterval(() => {
      if (!this.ctx || !this.ambientGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();

      const bubbleF = 400 + Math.random() * 350;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(bubbleF, now);
      osc.frequency.exponentialRampToValueAtTime(bubbleF * 1.5, now + 0.08);

      bGain.gain.setValueAtTime(0.03, now);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(bGain);
      bGain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 0.12);
    }, 250);
  }
}

export const zenAudio = new ZenAudioEngine();
