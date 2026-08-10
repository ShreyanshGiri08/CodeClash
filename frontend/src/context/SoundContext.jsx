import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { soundEngine } from "../utils/soundEngine";

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("codeclash_sound_muted") === "true";
    }
    return false;
  });

  const ctxRef = useRef(null);
  const activeSourcesRef = useRef([]);

  // Sync mute state to localStorage & soundEngine + Unlock Web Audio API on click
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("codeclash_sound_muted", String(muted));
    }
    soundEngine.setMuted(muted);

    const unlockAudio = () => {
      if (!muted) {
        soundEngine.initCtx();
        if (ctxRef.current && ctxRef.current.state === "suspended") {
          ctxRef.current.resume().catch(() => null);
        }
      }
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [muted]);


  // Instantly stop all active sound nodes & suspend context when muted
  const stopAllAudio = useCallback(() => {
    try {
      activeSourcesRef.current.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (_) {}
      });
      activeSourcesRef.current = [];

      if (ctxRef.current && ctxRef.current.state === "running") {
        ctxRef.current.suspend();
      }
    } catch (_) {}
  }, []);

  // Robust Async Tone Synthesizer with full volume gain
  const playNotes = useCallback(async (notes) => {
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

      // Ensure AudioContext is resumed before reading currentTime
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = n.type || "sine";
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        // Increased default volume gain to 0.4 for clear audibility
        const targetVol = n.vol ?? 0.4;
        gain.gain.setValueAtTime(targetVol, now + n.time);
        gain.gain.linearRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);

        activeSourcesRef.current.push(osc);
        osc.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== osc);
        };
      });
    } catch (e) {
      console.warn("Audio playNotes failed", e);
    }
  }, [muted]);

  // 1. Soft Cyber Tap (Audible 800Hz sine tap for general UI navigation/buttons)
  const playClick = useCallback(() => {
    if (muted) return;
    playNotes([{ freq: 800, time: 0, dur: 0.08, vol: 0.35, type: "sine" }]);
  }, [muted, playNotes]);

  // 2. Action Pulse (600Hz -> 950Hz for primary buttons)
  const playAction = useCallback(() => {
    if (muted) return;
    playNotes([
      { freq: 600, time: 0, dur: 0.08, vol: 0.35, type: "sine" },
      { freq: 950, time: 0.06, dur: 0.1, vol: 0.4, type: "sine" },
    ]);
  }, [muted, playNotes]);

  // 3. ⚔️ MATCH & QUEUE FOUND THRILL (Arcade Chime: A4 -> C#5 -> E5 -> A5)
  const playQueueFound = useCallback(() => {
    if (muted) return;
    playNotes([
      { freq: 440.00, time: 0, dur: 0.25, vol: 0.4, type: "triangle" },
      { freq: 554.37, time: 0.07, dur: 0.25, vol: 0.4, type: "triangle" },
      { freq: 659.25, time: 0.14, dur: 0.25, vol: 0.4, type: "triangle" },
      { freq: 880.00, time: 0.22, dur: 0.35, vol: 0.45, type: "triangle" },
    ]);
  }, [muted, playNotes]);

  // 4. 🏆 VICTORY & KHUSHI (5-Note Celebration Fanfare: C5 -> E5 -> G5 -> C6 -> E6)
  const playVictory = useCallback(() => {
    if (muted) return;
    playNotes([
      { freq: 523.25, time: 0, dur: 0.15, vol: 0.4, type: "sine" },
      { freq: 659.25, time: 0.10, dur: 0.15, vol: 0.4, type: "sine" },
      { freq: 783.99, time: 0.20, dur: 0.18, vol: 0.4, type: "sine" },
      { freq: 1046.50, time: 0.32, dur: 0.22, vol: 0.45, type: "sine" },
      { freq: 1318.51, time: 0.46, dur: 0.55, vol: 0.5, type: "sine" },
    ]);
  }, [muted, playNotes]);

  // 5. 😔 SADNESS & LOSS (Descending Melancholic Triad: A4 -> F4 -> D4)
  const playSadness = useCallback(() => {
    if (muted) return;
    playNotes([
      { freq: 440.00, time: 0, dur: 0.22, vol: 0.4, type: "triangle" },
      { freq: 349.23, time: 0.16, dur: 0.22, vol: 0.4, type: "triangle" },
      { freq: 293.66, time: 0.32, dur: 0.55, vol: 0.45, type: "triangle" },
    ]);
  }, [muted, playNotes]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        stopAllAudio();
      } else {
        playAction();
      }
      return next;
    });
  }, [stopAllAudio, playAction]);

  // Global Intelligent Button Click Event Delegation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalClick = (e) => {
      if (muted) return;

      const target = e.target;
      if (!target) return;

      const clickable = target.closest("button, a, [role='button']");
      if (!clickable) return;

      if (clickable.disabled || clickable.getAttribute("data-sound") === "none") return;

      const customSound = clickable.getAttribute("data-sound");
      const btnText = (clickable.innerText || "").toLowerCase();

      if (customSound === "sadness" || btnText.includes("end session") || btnText.includes("forfeit") || btnText.includes("cancel")) {
        playSadness();
      } else if (customSound === "victory" || btnText.includes("check my submission") || btnText.includes("claim")) {
        playVictory();
      } else if (customSound === "queue" || btnText.includes("search match") || btnText.includes("find race")) {
        playQueueFound();
      } else if (customSound === "action" || btnText.includes("start practice") || btnText.includes("link account") || btnText.includes("submit")) {
        playAction();
      } else {
        playClick();
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [muted, playClick, playAction, playSadness, playVictory, playQueueFound]);

  return (
    <SoundContext.Provider
      value={{
        muted,
        toggleMute,
        playClick,
        playAction,
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
