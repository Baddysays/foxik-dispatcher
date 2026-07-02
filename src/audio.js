function createPinkNoiseBuffer(ctx, seconds = 3) {
  const n = Math.floor(seconds * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < n; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createNoiseBurst(ctx, durationSec, decay = 0.2) {
  const n = Math.max(1, Math.floor(durationSec * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * decay));
  }
  return buffer;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.theme = "night";
    this.ambience = null;
    this._hoverThrottle = 0;
    this._booted = false;
    this._ambienceSession = 0;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  }

  async ensureRunning() {
    const ctx = this.ensure();
    if (!this.muted && ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx;
  }

  boot() {
    if (this._booted) return;
    this._booted = true;
    if (!this.muted) {
      void this.ensureRunning().then(() => {
        if (!this.muted) this.startAmbience();
      });
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbience();
      if (this.ctx?.state === "running") {
        void this.ctx.suspend();
      }
    } else {
      void this.ensureRunning().then(() => {
        if (!this.muted) this.startAmbience();
      });
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setTheme(theme) {
    const next = theme === "day" ? "day" : "night";
    if (this.theme === next) return;
    this.theme = next;
    if (this.ambience) {
      this.stopAmbience();
      if (!this.muted) this.startAmbience();
    }
  }

  _master(vol = 0.2) {
    const g = this.ensure().createGain();
    g.gain.value = this.muted ? 0 : vol;
    return g;
  }

  _oneShot(fn, vol = 0.12) {
    if (this.muted) return;
    void this.ensureRunning().then((ctx) => {
      if (this.muted) return;
      const bus = this._master(vol);
      bus.connect(ctx.destination);
      fn(ctx, bus, ctx.currentTime);
      setTimeout(() => {
        try {
          bus.disconnect();
        } catch (_) {}
      }, 1200);
    });
  }

  click() {
    this._oneShot((ctx, bus, t) => {
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBurst(ctx, 0.06, 0.12);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(620, t);
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      src.connect(bp);
      bp.connect(g);
      g.connect(bus);
      src.start(t);
      src.stop(t + 0.08);
    }, 0.14);
  }

  hover() {
    if (this.muted) return;
    const now = performance.now();
    if (now - this._hoverThrottle < 120) return;
    this._hoverThrottle = now;
    this._oneShot((ctx, bus, t) => {
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBurst(ctx, 0.04, 0.08);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(hp);
      hp.connect(g);
      g.connect(bus);
      src.start(t);
      src.stop(t + 0.05);
    }, 0.05);
  }

  alert() {
    this._oneShot((ctx, bus, t) => {
      this._birdChirp(ctx, bus, t, 0.16, 1680 + Math.random() * 120);
      this._birdChirp(ctx, bus, t + 0.11, 0.12, 2140 + Math.random() * 80);
    }, 0.13);
  }

  shuffle() {
    this._oneShot((ctx, bus, t) => {
      for (let i = 0; i < 4; i += 1) {
        const at = t + i * 0.055;
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBurst(ctx, 0.09 + Math.random() * 0.05, 0.18);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900 + i * 140 + Math.random() * 200;
        bp.Q.value = 0.7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, at);
        g.gain.linearRampToValueAtTime(0.22, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.1);
        src.connect(bp);
        bp.connect(g);
        g.connect(bus);
        src.start(at);
        src.stop(at + 0.12);
      }
    }, 0.1);
  }

  _birdChirp(ctx, dest, time, vol, baseFreq) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(baseFreq * 0.85, time);
    o.frequency.linearRampToValueAtTime(baseFreq * 1.45, time + 0.035);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, time + 0.14);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    o.connect(g);
    g.connect(dest);
    o.start(time);
    o.stop(time + 0.18);
  }

  _owlHoot(ctx, dest, time, vol) {
    const playTone = (start, freq, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, start);
      o.frequency.exponentialRampToValueAtTime(freq * 0.82, start + dur);
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(g);
      g.connect(dest);
      o.start(start);
      o.stop(start + dur + 0.05);
    };
    playTone(time, 280, 0.28);
    playTone(time + 0.34, 220, 0.36);
  }

  _scheduleBirds(ctx, bus, session) {
    const tick = () => {
      if (this.muted || !this.ambience || this._ambienceSession !== session) return;
      const t = ctx.currentTime;
      const count = this.theme === "day" ? 1 + Math.floor(Math.random() * 2) : Math.random() < 0.45 ? 1 : 0;
      for (let i = 0; i < count; i += 1) {
        const delay = i * (0.15 + Math.random() * 0.2);
        this._birdChirp(ctx, bus, t + delay, 0.04 + Math.random() * 0.05, 1400 + Math.random() * 1800);
      }
      const next = this.theme === "day" ? 1800 + Math.random() * 3200 : 2600 + Math.random() * 4200;
      if (this.ambience && this._ambienceSession === session) {
        this.ambience.birdTimer = setTimeout(tick, next);
      }
    };
    tick();
  }

  _scheduleRustle(ctx, bus, session) {
    const tick = () => {
      if (this.muted || !this.ambience || this._ambienceSession !== session) return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBurst(ctx, 0.12 + Math.random() * 0.18, 0.22);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 400 + Math.random() * 900;
      bp.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.035 + Math.random() * 0.03, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      src.connect(bp);
      bp.connect(g);
      g.connect(bus);
      src.start(t);
      src.stop(t + 0.3);
      if (this.ambience && this._ambienceSession === session) {
        this.ambience.rustleTimer = setTimeout(tick, 2200 + Math.random() * 5000);
      }
    };
    tick();
  }

  _scheduleOwl(ctx, bus, session) {
    const tick = () => {
      if (this.muted || !this.ambience || this._ambienceSession !== session) return;
      if (this.theme === "night" && Math.random() < 0.65) {
        this._owlHoot(ctx, bus, ctx.currentTime + 0.2, 0.05 + Math.random() * 0.03);
      }
      if (this.ambience && this._ambienceSession === session) {
        this.ambience.owlTimer = setTimeout(tick, 14000 + Math.random() * 22000);
      }
    };
    if (this.ambience && this._ambienceSession === session) {
      this.ambience.owlTimer = setTimeout(tick, 8000 + Math.random() * 6000);
    }
  }

  _scheduleCrickets(ctx, bus, session) {
    const chirp = () => {
      if (this.muted || !this.ambience || this._ambienceSession !== session) return;
      const t = ctx.currentTime;
      const base = this.theme === "night" ? 3200 : 3800;
      for (let i = 0; i < 3; i += 1) {
        const at = t + i * 0.07;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = base + Math.random() * 500;
        g.gain.setValueAtTime(0.001, at);
        g.gain.linearRampToValueAtTime(this.theme === "night" ? 0.018 : 0.01, at + 0.004);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
        o.connect(g);
        g.connect(bus);
        o.start(at);
        o.stop(at + 0.06);
      }
      if (this.ambience && this._ambienceSession === session) {
        this.ambience.cricketTimer = setTimeout(chirp, this.theme === "night" ? 700 + Math.random() * 500 : 1400 + Math.random() * 900);
      }
    };
    chirp();
  }

  startAmbience() {
    if (this.muted || this.ambience) return;
    const session = ++this._ambienceSession;
    void this.ensureRunning().then((ctx) => {
      if (this.muted || this.ambience || this._ambienceSession !== session) return;
      const bus = this._master(this.theme === "day" ? 0.22 : 0.18);
      bus.connect(ctx.destination);

    const windSrc = ctx.createBufferSource();
    windSrc.buffer = createPinkNoiseBuffer(ctx, 4);
    windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = this.theme === "day" ? 520 : 380;
    const windGain = ctx.createGain();
    windGain.gain.value = this.theme === "day" ? 0.07 : 0.09;
    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.frequency.value = 0.05 + Math.random() * 0.03;
    windLfoGain.gain.value = this.theme === "day" ? 80 : 110;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);

    const gustLfo = ctx.createOscillator();
    const gustGain = ctx.createGain();
    gustLfo.frequency.value = 0.018;
    gustGain.gain.value = this.theme === "day" ? 0.025 : 0.04;
    gustLfo.connect(gustGain);
    gustGain.connect(windGain.gain);

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(bus);
    windSrc.start();
    windLfo.start();
    gustLfo.start();

    const treetop = ctx.createBufferSource();
    treetop.buffer = createPinkNoiseBuffer(ctx, 2);
    treetop.loop = true;
    const treetopFilter = ctx.createBiquadFilter();
    treetopFilter.type = "bandpass";
    treetopFilter.frequency.value = 1200;
    treetopFilter.Q.value = 0.4;
    const treetopGain = ctx.createGain();
    treetopGain.gain.value = 0.012;
    treetop.connect(treetopFilter);
    treetopFilter.connect(treetopGain);
    treetopGain.connect(bus);
    treetop.start();

    this.ambience = {
      session,
      bus,
      nodes: [windSrc, windLfo, gustLfo, treetop],
      birdTimer: null,
      rustleTimer: null,
      owlTimer: null,
      cricketTimer: null,
    };

    this._scheduleBirds(ctx, bus, session);
    this._scheduleRustle(ctx, bus, session);
    this._scheduleCrickets(ctx, bus, session);
    this._scheduleOwl(ctx, bus, session);
    });
  }

  stopAmbience() {
    if (!this.ambience) return;
    this._ambienceSession += 1;
    const { bus, nodes, birdTimer, rustleTimer, owlTimer, cricketTimer } = this.ambience;
    this.ambience = null;
    clearTimeout(birdTimer);
    clearTimeout(rustleTimer);
    clearTimeout(owlTimer);
    clearTimeout(cricketTimer);
    try {
      if (bus?.gain && this.ctx) {
        bus.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch (_) {}
    for (const node of nodes) {
      try {
        node.stop();
      } catch (_) {}
      try {
        node.disconnect();
      } catch (_) {}
    }
    try {
      bus.disconnect();
    } catch (_) {}
  }
}
