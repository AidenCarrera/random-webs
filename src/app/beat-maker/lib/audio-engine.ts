import * as Tone from "tone";
import { STEPS } from "../constants";
import type { DrumKit, TrackConfig } from "../types";

type DrumInstrument =
  Tone.Player | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;
type Disposable = { dispose: () => unknown };
type PendingVoice = { node: Disposable; cancel: () => void };
type SampleUrlResolver = (kit: DrumKit, trackId: string) => string | null;
type EngineConfig = {
  tracks: Array<{ id: string; kit: DrumKit }>;
  bassKit: DrumKit;
};

export class AudioEngine {
  private context: Tone.Context | null = null;
  private initTask: Promise<void> | null = null;
  private generation = 0;
  private voiceVersions: Record<string, number> = {};
  private activeKits: Record<string, DrumKit> = {};
  private pendingDisposals = new Map<number, Disposable[]>();
  private pendingVoices = new Map<string, Set<PendingVoice>>();
  private instruments: Record<string, DrumInstrument> = {};
  private filters: Record<string, Tone.Filter> = {};
  private channels: Record<string, Tone.Channel> = {};
  private meters: Record<string, Tone.Meter> = {};
  private master: Tone.Volume | null = null;
  private masterMeter: Tone.Meter | null = null;
  private limit: Tone.Limiter | null = null;
  private bass: Tone.Sampler | Tone.MembraneSynth | null = null;
  private bassDistortion: Tone.Distortion | null = null;

  constructor(private readonly sampleUrl: SampleUrlResolver) {}

  get ready() {
    return Boolean(this.master);
  }

  mount() {
    if (this.context) return;
    this.context = new Tone.Context();
    this.generation += 1;
  }

  private requireContext() {
    if (!this.context) throw new Error("Audio engine is not mounted");
    return this.context;
  }

  init(config: EngineConfig) {
    if (this.initTask) return this.initTask;
    if (this.master) return Promise.resolve();
    const generation = this.generation;
    this.initTask = this.initialize(generation, config).catch((error) => {
      this.initTask = null;
      throw error;
    });
    return this.initTask;
  }

  private async initialize(generation: number, config: EngineConfig) {
    const context = this.context;
    if (!context) return;
    await context.resume();
    if (generation !== this.generation || context !== this.context) return;

    this.limit = new Tone.Limiter({ context, threshold: -1 }).connect(
      context.destination,
    );
    this.master = new Tone.Volume({ context, volume: 0, mute: false }).connect(
      this.limit,
    );
    this.masterMeter = new Tone.Meter({ context });
    this.master.connect(this.masterMeter);
    const bassChannel = new Tone.Channel({ context, volume: 0 }).connect(
      this.master,
    );
    const bassMeter = new Tone.Meter({ context });
    bassChannel.connect(bassMeter);
    this.channels.bass = bassChannel;
    this.meters.bass = bassMeter;

    config.tracks.forEach(({ id }) => this.ensureTrack(id));
    await Promise.all([
      ...config.tracks.map(({ id, kit }) => this.setKit(id, kit)),
      this.setBassSample(config.bassKit),
    ]);
  }

  private ensureTrack(id: string) {
    if (!this.master || this.channels[id]) return;
    const context = this.requireContext();
    const channel = new Tone.Channel({ context, volume: 0 }).connect(
      this.master,
    );
    const meter = new Tone.Meter({ context });
    channel.connect(meter);
    this.channels[id] = channel;
    this.meters[id] = meter;
  }

  private disposeLater(...nodes: Array<Disposable | null | undefined>) {
    const disposable = nodes.filter((node): node is Disposable =>
      Boolean(node),
    );
    if (!disposable.length) return;
    const context = this.context;
    if (!context) {
      disposable.forEach((node) => node.dispose());
      return;
    }
    const timer = context.setTimeout(() => {
      this.pendingDisposals.delete(timer);
      disposable.forEach((node) => node.dispose());
    }, 2);
    this.pendingDisposals.set(timer, disposable);
  }

  private nextVoiceVersion(id: string) {
    const version = (this.voiceVersions[id] ?? 0) + 1;
    this.voiceVersions[id] = version;
    return version;
  }

  private isCurrentVoice(id: string, version: number) {
    return this.voiceVersions[id] === version && Boolean(this.context);
  }

  private trackPending(id: string, pending: PendingVoice) {
    const pendingForVoice =
      this.pendingVoices.get(id) ?? new Set<PendingVoice>();
    pendingForVoice.add(pending);
    this.pendingVoices.set(id, pendingForVoice);
  }

  private untrackPending(id: string, pending: PendingVoice) {
    const pendingForVoice = this.pendingVoices.get(id);
    pendingForVoice?.delete(pending);
    if (!pendingForVoice?.size) this.pendingVoices.delete(id);
  }

  private cancelPending(id: string) {
    this.pendingVoices.get(id)?.forEach(({ node, cancel }) => {
      cancel();
      node.dispose();
    });
    this.pendingVoices.delete(id);
  }

  async reconcileTracks(
    tracks: TrackConfig[],
    assignments: Record<string, DrumKit>,
  ) {
    if (!this.master) return;
    const nextIds = new Set(tracks.map(({ id }) => id));
    Object.keys(this.channels).forEach((id) => {
      if (id !== "bass" && !nextIds.has(id)) this.disposeTrack(id);
    });
    tracks.forEach(({ id }) => this.ensureTrack(id));
    await Promise.all(
      tracks.map(({ id }) => this.setKit(id, assignments[id] ?? "808")),
    );
  }

  private disposeTrack(id: string) {
    this.nextVoiceVersion(id);
    this.cancelPending(id);
    this.instruments[id]?.dispose();
    this.filters[id]?.dispose();
    this.meters[id]?.dispose();
    this.channels[id]?.dispose();
    delete this.instruments[id];
    delete this.filters[id];
    delete this.meters[id];
    delete this.channels[id];
    delete this.activeKits[id];
  }

  trigger(id: string, time: number) {
    const instrument = this.instruments[id];
    if (instrument instanceof Tone.Player) {
      if (instrument.loaded) instrument.start(time);
    } else if (instrument instanceof Tone.MembraneSynth) {
      instrument.triggerAttackRelease("C1", "8n", time);
    } else if (instrument instanceof Tone.MetalSynth) {
      instrument.triggerAttackRelease("C5", "32n", time, 1);
    } else if (instrument instanceof Tone.NoiseSynth) {
      if (id === "clap") {
        instrument.triggerAttackRelease("32n", time, 1);
        instrument.triggerAttackRelease("32n", time + 0.01, 0.7);
        instrument.triggerAttackRelease("32n", time + 0.02, 0.5);
      } else {
        instrument.triggerAttackRelease("32n", time, 0.8);
      }
    }
  }

  triggerBass(note: string, time: number, steps = 1) {
    const bpm = this.requireContext().transport.bpm.value;
    const duration = (60 / bpm / 4) * steps;
    if (this.bass instanceof Tone.Sampler) {
      if (this.bass.loaded)
        this.bass.triggerAttackRelease(note, duration, time, 0.95);
    } else {
      this.bass?.triggerAttackRelease(note, duration, time, 0.95);
    }
  }

  async setBassSample(kit: DrumKit) {
    const channel = this.channels.bass;
    if (!channel) return;
    const version = this.nextVoiceVersion("bass");
    this.cancelPending("bass");
    if (this.activeKits.bass === kit && this.bass) return;

    const context = this.requireContext();
    let nextBass: Tone.Sampler | Tone.MembraneSynth;
    let nextDistortion: Tone.Distortion | null = null;

    if (kit === "synth") {
      nextDistortion = new Tone.Distortion({
        context,
        distortion: 0.4,
        oversample: "4x",
      });
      nextBass = new Tone.MembraneSynth({
        context,
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.4,
          release: 0.8,
        },
      });
      nextBass.volume.value = -6;
      nextBass.connect(nextDistortion);
    } else {
      const url = this.sampleUrl(kit, "bass");
      if (!url) return;
      let resolveLoad!: () => void;
      let rejectLoad!: (error: Error) => void;
      const loaded = new Promise<void>((resolve, reject) => {
        resolveLoad = resolve;
        rejectLoad = reject;
      });
      const sampler = new Tone.Sampler({
        context,
        urls: { C1: url },
        onload: resolveLoad,
        onerror: rejectLoad,
      });
      const ready = await this.waitForLoad(
        "bass",
        sampler,
        loaded.then(
          () => true,
          () => false,
        ),
      );
      if (!ready) return;
      sampler.volume.value = -4;
      nextBass = sampler;
    }

    if (
      !this.isCurrentVoice("bass", version) ||
      this.channels.bass !== channel
    ) {
      nextBass.dispose();
      nextDistortion?.dispose();
      return;
    }
    if (nextDistortion) nextDistortion.connect(channel);
    else nextBass.connect(channel);

    const previousBass = this.bass;
    const previousDistortion = this.bassDistortion;
    this.bass = nextBass;
    this.bassDistortion = nextDistortion;
    this.activeKits.bass = kit;
    this.disposeLater(previousBass, previousDistortion);
  }

  private async waitForLoad(
    id: string,
    node: Disposable,
    loaded: Promise<boolean>,
  ) {
    let cancelLoad!: () => void;
    const cancelled = new Promise<boolean>((resolve) => {
      cancelLoad = () => resolve(false);
    });
    const pending = { node, cancel: cancelLoad };
    this.trackPending(id, pending);
    const ready = await Promise.race([loaded, cancelled]);
    this.untrackPending(id, pending);
    if (!ready) node.dispose();
    return ready;
  }

  async setKit(id: string, kit: DrumKit) {
    const channel = this.channels[id];
    if (!channel) return;
    const version = this.nextVoiceVersion(id);
    this.cancelPending(id);
    if (this.activeKits[id] === kit && this.instruments[id]) return;

    const context = this.requireContext();
    const url = kit === "synth" ? null : this.sampleUrl(kit, id);
    if (kit !== "synth" && !url) return;

    let instrument: DrumInstrument;
    let filter: Tone.Filter | null = null;
    if (kit !== "synth") {
      const player = new Tone.Player({ context });
      const ready = await this.waitForLoad(
        id,
        player,
        player.load(url!).then(
          () => true,
          () => false,
        ),
      );
      if (!ready) return;
      instrument = player;
    } else {
      ({ instrument, filter } = this.createSynthVoice(id, context));
    }

    if (!this.isCurrentVoice(id, version) || this.channels[id] !== channel) {
      instrument.dispose();
      filter?.dispose();
      return;
    }
    if (filter) {
      instrument.connect(filter);
      filter.connect(channel);
    } else {
      instrument.connect(channel);
    }

    const previousInstrument = this.instruments[id];
    const previousFilter = this.filters[id];
    this.instruments[id] = instrument;
    if (filter) this.filters[id] = filter;
    else delete this.filters[id];
    this.activeKits[id] = kit;
    this.disposeLater(previousInstrument, previousFilter);
  }

  private createSynthVoice(id: string, context: Tone.Context) {
    let instrument: Exclude<DrumInstrument, Tone.Player>;
    let filter: Tone.Filter | null = null;
    switch (id) {
      case "kick":
        instrument = new Tone.MembraneSynth({
          context,
          pitchDecay: 0.06,
          octaves: 7,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.001,
            decay: 0.5,
            sustain: 0.02,
            release: 1.4,
          },
        });
        instrument.volume.value = 2;
        break;
      case "snare":
        instrument = new Tone.NoiseSynth({
          context,
          noise: { type: "white" },
          envelope: {
            attack: 0.001,
            decay: 0.2,
            sustain: 0.01,
            release: 1.2,
          },
        });
        break;
      case "hihat":
        instrument = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
          harmonicity: 4.1,
          modulationIndex: 40,
          resonance: 3000,
          octaves: 1,
        });
        instrument.frequency.value = 250;
        instrument.volume.value = -10;
        break;
      case "clap":
        instrument = new Tone.NoiseSynth({
          context,
          noise: { type: "white" },
          envelope: {
            attack: 0.001,
            decay: 0.18,
            sustain: 0,
            release: 0.08,
          },
        });
        instrument.volume.value = 2;
        filter = new Tone.Filter({
          context,
          frequency: 1500,
          type: "bandpass",
        });
        break;
      case "openhat":
        instrument = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.2, release: 1 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1,
        });
        instrument.frequency.value = 200;
        instrument.volume.value = -12;
        break;
      case "ride":
        instrument = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 1, release: 1.2 },
          harmonicity: 3.1,
          modulationIndex: 20,
          resonance: 2800,
          octaves: 1.5,
        });
        instrument.volume.value = -20;
        break;
      case "cowbell":
        instrument = new Tone.MetalSynth({
          context,
          envelope: { attack: 0.001, decay: 0.1, release: 0.2 },
          harmonicity: 8,
          modulationIndex: 12,
          resonance: 1500,
          octaves: 1,
        });
        instrument.frequency.value = 750;
        instrument.volume.value = -10;
        break;
      default:
        instrument = new Tone.MembraneSynth({
          context,
          pitchDecay: 0.01,
          octaves: 2,
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0,
            release: 0.1,
          },
        });
        instrument.volume.value = -4;
    }
    return { instrument, filter };
  }

  setSwing(amount: number) {
    const transport = this.requireContext().transport;
    transport.swing = amount;
    transport.swingSubdivision = "16n";
  }

  setTempo(tempo: number) {
    this.requireContext().transport.bpm.value = tempo;
  }

  createSequence(callback: (time: number, step: number) => void) {
    return new Tone.Sequence({
      context: this.requireContext(),
      callback,
      events: Array.from({ length: STEPS }, (_, index) => index),
      subdivision: "16n",
    });
  }

  scheduleDraw(callback: () => void, time: number) {
    this.requireContext().draw.schedule(callback, time);
  }

  now() {
    return this.requireContext().now();
  }

  async toggleTransport() {
    const context = this.context;
    if (!context || !this.master) return false;
    if (context.state !== "running") await context.resume();
    if (context !== this.context) return false;
    const transport = context.transport;
    const shouldPlay = transport.state !== "started";
    if (shouldPlay) transport.start();
    else transport.pause();
    return shouldPlay;
  }

  getMeterValues() {
    const values: Record<string, number> = {};
    for (const [id, meter] of Object.entries(this.meters)) {
      values[id] = meter.getValue() as number;
    }
    if (this.masterMeter) values.master = this.masterMeter.getValue() as number;
    return values;
  }

  syncState(
    volumes: Record<string, number>,
    mutes: Record<string, boolean>,
    solos: Record<string, boolean>,
  ) {
    if (!this.master) return;
    this.master.volume.rampTo(volumes.master ?? 0, 0.1);
    this.master.mute = Boolean(mutes.master);
    const activeSolos = Object.values(solos).some(Boolean);
    Object.entries(this.channels).forEach(([id, channel]) => {
      channel.volume.rampTo(volumes[id] ?? 0, 0.1);
      channel.mute = Boolean(mutes[id] || (activeSolos && !solos[id]));
      channel.solo = false;
    });
  }

  dispose() {
    this.generation += 1;
    this.initTask = null;
    const context = this.context;
    context?.transport.stop();
    context?.draw.cancel();
    this.pendingDisposals.forEach((nodes, timer) => {
      context?.clearTimeout(timer);
      nodes.forEach((node) => node.dispose());
    });
    this.pendingDisposals.clear();
    this.pendingVoices.forEach((pendingForVoice) =>
      pendingForVoice.forEach(({ node, cancel }) => {
        cancel();
        node.dispose();
      }),
    );
    this.pendingVoices.clear();
    Object.values(this.instruments).forEach((node) => node.dispose());
    Object.values(this.filters).forEach((node) => node.dispose());
    this.bass?.dispose();
    this.bassDistortion?.dispose();
    Object.values(this.meters).forEach((node) => node.dispose());
    Object.values(this.channels).forEach((node) => node.dispose());
    this.masterMeter?.dispose();
    this.master?.dispose();
    this.limit?.dispose();
    this.instruments = {};
    this.filters = {};
    this.channels = {};
    this.meters = {};
    this.voiceVersions = {};
    this.activeKits = {};
    this.bass = null;
    this.bassDistortion = null;
    this.masterMeter = null;
    this.master = null;
    this.limit = null;
    this.context = null;
    void context?.close();
  }
}
