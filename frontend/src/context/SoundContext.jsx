import { createContext, useContext, useState, useRef, useEffect } from "react";

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("codeclash_sound_muted") === "true";
    }
    return false;
  });

  const ctxRef = useRef(null);

  // Sync mute state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("codeclash_sound_muted", String(muted));
    }
  }, [muted]);

  // Robust Async Tone Synthesizer that handles Chrome's async ctx.resume()
  const playNotes = async (notes) => {
    if (muted) return; // HARD MUTE GUARANTEE: Zero audio execution when muted!

    try {
      if (!ctxRef.current && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctxRef.current = new AudioCtx();
        }
      }

      const ctx = ctxRef.current;
      if (!ctx) return;

      // CRITICAL FIX: Await Chrome's async AudioContext resume BEFORE getting currentTime!
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = n.type || "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(n.vol ?? 0.3, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch (e) {
      console.warn("Audio playNotes failed", e);
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (!next) {
        // Unmuting: play pleasant test chime
        playVictory();
      }
      return next;
    });
  };

  // 1. Soft Micro UI Click (500Hz sine tap)
  const playClick = () => {
    if (muted) return;
    playNotes([{ freq: 500, time: 0, dur: 0.03, vol: 0.1, type: "sine" }]);
  };

  // 2. Generic Soft Tone
  const playSoftBlip = (freq = 600, duration = 0.05) => {
    if (muted) return;
    playNotes([{ freq, time: 0, dur: duration, vol: 0.2, type: "sine" }]);
  };

  // 3. ⚔️ MATCH & QUEUE FOUND THRILL (Ascending 4-Note Arcade Arpeggio: C5 -> E5 -> G5 -> C6)
  const playQueueFound = () => {
    if (muted) return;
    playNotes([
      { freq: 523.25, time: 0, dur: 0.3, vol: 0.35, type: "triangle" },    // C5
      { freq: 659.25, time: 0.08, dur: 0.3, vol: 0.35, type: "triangle" }, // E5
      { freq: 783.99, time: 0.16, dur: 0.3, vol: 0.35, type: "triangle" }, // G5
      { freq: 1046.50, time: 0.24, dur: 0.35, vol: 0.4, type: "triangle" },// C6
    ]);
  };

  // 4. 🏆 VICTORY & KHUSHI (Triumphant 5-Note Major Celebration: C5 -> E5 -> G5 -> C6 -> E6 Shimmer)
  const playVictory = () => {
    if (muted) return;
    playNotes([
      { freq: 523.25, time: 0, dur: 0.15, vol: 0.35, type: "sine" },    // C5
      { freq: 659.25, time: 0.10, dur: 0.15, vol: 0.35, type: "sine" }, // E5
      { freq: 783.99, time: 0.20, dur: 0.18, vol: 0.35, type: "sine" }, // G5
      { freq: 1046.50, time: 0.32, dur: 0.22, vol: 0.40, type: "sine" },// C6
      { freq: 1318.51, time: 0.46, dur: 0.55, vol: 0.45, type: "sine" },// E6
    ]);
  };

  // 5. 😔 SADNESS & LOSS (Descending Melancholic 3-Note Minor Chime: A4 -> F4 -> C4)
  const playSadness = () => {
    if (muted) return;
    playNotes([
      { freq: 440.00, time: 0, dur: 0.22, vol: 0.35, type: "sine" },   // A4
      { freq: 349.23, time: 0.16, dur: 0.22, vol: 0.35, type: "sine" }, // F4
      { freq: 261.63, time: 0.34, dur: 0.60, vol: 0.40, type: "sine" }, // C4
    ]);
  };

  return (
    <SoundContext.Provider
      value={{
        muted,
        toggleMute,
        playClick,
        playSoftBlip,
        playQueueFound,
        playVictory,
        playSadness,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
