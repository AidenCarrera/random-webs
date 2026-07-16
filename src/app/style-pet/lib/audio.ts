type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

class Synth {
  private ctx: AudioContext | null = null;
  muted = false;

  private init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;
    if (AudioContextClass) this.ctx = new AudioContextClass();
  }

  beep(freq: number, type: OscillatorType = "square", duration = 0.12) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + duration,
      );
      oscillator.connect(gain);
      gain.connect(this.ctx.destination);
      oscillator.start();
      oscillator.stop(this.ctx.currentTime + duration);
    } catch (error) {
      console.warn("Audio Context init block:", error);
    }
  }

  playSelect() {
    this.beep(880, "square", 0.05);
  }

  playFeed() {
    this.beep(261.63, "sine", 0.06);
    setTimeout(() => this.beep(329.63, "sine", 0.06), 60);
    setTimeout(() => this.beep(392, "sine", 0.06), 120);
    setTimeout(() => this.beep(523.25, "sine", 0.12), 180);
  }

  playPet() {
    this.beep(587.33, "triangle", 0.08);
    setTimeout(() => this.beep(698.46, "triangle", 0.08), 80);
    setTimeout(() => this.beep(880, "triangle", 0.12), 160);
  }

  playSleep() {
    this.beep(523.25, "sine", 0.15);
    setTimeout(() => this.beep(392, "sine", 0.2), 150);
    setTimeout(() => this.beep(261.63, "sine", 0.35), 350);
  }

  playLevelUp() {
    [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5].forEach(
      (frequency, index) => {
        setTimeout(() => this.beep(frequency, "square", 0.07), index * 60);
      },
    );
  }

  playDead() {
    this.beep(293.66, "sawtooth", 0.2);
    setTimeout(() => this.beep(220, "sawtooth", 0.25), 180);
    setTimeout(() => this.beep(146.83, "sawtooth", 0.45), 360);
  }
}

export const synth = new Synth();
