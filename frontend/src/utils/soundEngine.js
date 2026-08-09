// Clean Web Audio API Sound Synth Engine — Single Source of Truth & Zero Global Interception

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    // Single source of truth for mute state
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("codeclash_sound_muted") : null;
    this.muted = stored === "true";
  }

  initCtx() {
    if (this.muted) return; // Hard exit if muted!
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended" && !this.muted) {
      this.ctx.resume();
    }
    this.syncVolume();
  }

  syncVolume() {
    if (this.masterGain && this.ctx) {
      const vol = this.muted ? 0.0 : 1.0;
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("codeclash_sound_muted", String(this.muted));
    }
    if (this.muted && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        this.ctx.suspend();
      } catch (_) {}
    } else if (!this.muted) {
      this.initCtx();
      this.playSoftBlip(880, 0.1);
    }
    return this.muted;
  }

  // Soft micro UI click (Only called explicitly)
  playClick() {
    if (this.muted) return;
    this.playSoftBlip(500, 0.03);
  }

  // Soft sine blip
  playSoftBlip(freq = 600, duration = 0.04) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  // ⚔️ Match Found Arcade Chime (C5 -> E5 -> G5 -> C6)
  playQueueFound() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (_) {}
  }

  // 🏆 Victory Fanfare (C5 -> E5 -> G5 -> C6 -> E6 Shimmer)
  playVictory() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const fanfare = [
        { freq: 523.25, time: 0, dur: 0.14 },    // C5
        { freq: 659.25, time: 0.10, dur: 0.14 }, // E5
        { freq: 783.99, time: 0.20, dur: 0.16 }, // G5
        { freq: 1046.50, time: 0.32, dur: 0.22 },// C6
        { freq: 1318.51, time: 0.46, dur: 0.55 },// E6
      ];

      fanfare.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.3, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch (_) {}
  }

  // 😔 Melancholic Sadness Sound (A4 -> F4 -> D4 -> A3 + Sub Bass Drop)
  playSadness() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const sadNotes = [
        { freq: 440.00, time: 0, dur: 0.22 },   // A4
        { freq: 349.23, time: 0.16, dur: 0.22 }, // F4
        { freq: 293.66, time: 0.32, dur: 0.28 },// D4
        { freq: 220.00, time: 0.48, dur: 0.60 },// A3
      ];

      sadNotes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.35, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });

      // Sub Bass Drop
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(110, now + 0.45);
      bassOsc.frequency.exponentialRampToValueAtTime(55, now + 1.1);

      bassGain.gain.setValueAtTime(0.35, now + 0.45);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now + 0.45);
      bassOsc.stop(now + 1.1);
    } catch (_) {}
  }
}

export const soundEngine = new SoundEngine();
