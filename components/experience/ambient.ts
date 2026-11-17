/** Generated ambient pad (no audio files, no licences). Starts muted; only plays after an explicit user toggle. */
export function createAmbient() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;

  function build() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(master);
    master.connect(ctx.destination);

    for (const [freq, detune, level] of [[55, 0, 0.5], [82.41, 4, 0.32], [110, -6, 0.18], [164.81, 3, 0.08]] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      gain.gain.value = level;
      // Slow tremolo keeps the pad alive without melody.
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.08;
      depth.gain.value = level * 0.4;
      lfo.connect(depth).connect(gain.gain);
      osc.connect(gain).connect(filter);
      osc.start();
      lfo.start();
    }

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const air = ctx.createBiquadFilter();
    air.type = "bandpass";
    air.frequency.value = 420;
    air.Q.value = 0.6;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.05;
    source.connect(air).connect(airGain).connect(filter);
    source.start();
  }

  return {
    set(on: boolean) {
      if (on && !ctx) build();
      if (!ctx || !master) return;
      if (on) void ctx.resume();
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 0.09 : 0, now + (on ? 1.6 : 0.5));
    },
    dispose() { void ctx?.close(); ctx = null; master = null; },
  };
}
