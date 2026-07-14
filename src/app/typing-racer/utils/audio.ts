type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

class RaceSynth {
  private context: AudioContext | null = null;

  private initialize() {
    if (this.context) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
  }

  playBeep(frequency: number, duration: number) {
    this.initialize();
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    gain.gain.setValueAtTime(0.04, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.context.currentTime + duration,
    );
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}

export const audio = new RaceSynth();
