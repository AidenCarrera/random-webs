type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export class ZenAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  init() {
    if (typeof window === "undefined" || this.isInitialized) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      const bufferSize = this.ctx.sampleRate * 6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < bufferSize; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(200, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.type = "sine";
      this.lfoNode.frequency.setValueAtTime(0.06, this.ctx.currentTime);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(100, this.ctx.currentTime);
      this.lfoNode.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      this.noiseNode.start(0);
      this.lfoNode.start(0);
      this.isInitialized = true;
    } catch (error) {
      console.warn("Failed to initialize Web Audio API:", error);
    }
  }

  playChime() {
    if (!this.ctx || this.ctx.state === "suspended") return;

    const scale = [440, 493.88, 523.25, 659.25, 698.46, 880, 987.77, 1046.5];
    const frequency = scale[Math.floor(Math.random() * scale.length)];
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const oscillatorGain = this.ctx.createGain();
    const overtoneGain = this.ctx.createGain();
    const chimeGain = this.ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 2.76, now);
    oscillatorGain.gain.setValueAtTime(0.07, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
    overtoneGain.gain.setValueAtTime(0.03, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    oscillator.connect(oscillatorGain);
    overtone.connect(overtoneGain);
    oscillatorGain.connect(chimeGain);
    overtoneGain.connect(chimeGain);
    chimeGain.connect(this.masterGain!);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 3.8);
    overtone.stop(now + 1);
  }

  playPlantSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(240, now);
    oscillator.frequency.exponentialRampToValueAtTime(580, now + 0.12);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    oscillator.connect(gain);
    gain.connect(this.masterGain!);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }

  playRakeSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(2.2, now);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start(now);
    source.stop(now + 0.09);
  }

  playPruneSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(550, now);
    oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.connect(gain);
    gain.connect(this.masterGain!);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playWaterSound() {
    if (!this.ctx || this.ctx.state === "suspended") return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(320, now);
    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.12);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(gain);
    gain.connect(this.masterGain!);
    oscillator.start(now);
    oscillator.stop(now + 0.14);
  }

  resume() {
    void this.ctx?.resume();
  }

  suspend() {
    void this.ctx?.suspend();
  }

  destroy() {
    if (!this.ctx) return;
    void this.ctx.close();
    this.ctx = null;
    this.isInitialized = false;
  }
}
