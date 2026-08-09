import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { joinQueue, getQueueStatus, leaveQueue, getQueueStats } from "../api/races";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";
import PageLayout from "../components/layout/PageLayout";

export default function FindRace() {
  const { playQueueFound } = useSound();

  const [phase, setPhase] = useState("idle"); // idle | searching | matched | timeout
  const [elapsed, setElapsed] = useState(0);
  const [band, setBand] = useState(100);
  const [queueStats, setQueueStats] = useState({ queued: 0, playing: 0 });
  const [error, setError] = useState("");
  const [ratingPreset, setRatingPreset] = useState("any");
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(2400);
  const [selectedTags, setSelectedTags] = useState([]);
  const [duration, setDuration] = useState(40);
  const navigate = useNavigate();
  const { user } = useAuth();
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const RATING_PRESETS = [
    { id: "any", label: "ANY RATING", min: 800, max: 3000, color: "border-accent/40 text-accent bg-accent/10" },
    { id: "easy", label: "🟢 EASY (800 - 1200)", min: 800, max: 1200, color: "border-status-live/40 text-status-live bg-status-live/10" },
    { id: "medium", label: "🟡 MEDIUM (1300 - 1600)", min: 1300, max: 1600, color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
    { id: "hard", label: "🔴 HARD (1700 - 2100)", min: 1700, max: 2100, color: "border-status-error/40 text-status-error bg-status-error/10" },
    { id: "expert", label: "⚡ EXPERT (2200+)", min: 2200, max: 3000, color: "border-purple-500/40 text-purple-400 bg-purple-500/10" },
  ];

  const POPULAR_TAGS = [
    "graphs", "trees", "dfs and similar", "dsu", "shortest paths",
    "two pointers", "hashing", "constructive algorithms",
    "implementation", "math", "greedy", "dp", "data structures",
    "brute force", "sortings", "strings", "number theory", "binary search"
  ];


  function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function handlePresetChange(preset) {
    setRatingPreset(preset.id);
    setMinRating(preset.min);
    setMaxRating(preset.max);
  }


  useEffect(() => {
    getQueueStats().then(setQueueStats).catch(() => {});
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pollRef.current);
    };
  }, []);

  const startSearch = useCallback(async () => {
    if (user && !user.cf_verified) {
      setError("Please link & verify your Codeforces handle on the Settings page before queuing for matches.");
      return;
    }

    setPhase("searching");
    setElapsed(0);
    setError("");

    // Start elapsed timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Initial queue join
    try {
      const res = await joinQueue();
      if (res.status === "matched") {
        clearInterval(timerRef.current);
        playQueueFound();

        setPhase("matched");
        setTimeout(() => navigate(`/race/${res.race_id}`), 500);
        return;
      }

    } catch (e) {
      setError(e.message || "Failed to join queue");
      setPhase("idle");
      clearInterval(timerRef.current);
      return;
    }


    // Start polling
    async function poll() {
      try {
        const status = await getQueueStatus();
        if (status.status === "matched") {
          clearInterval(timerRef.current);
          playQueueFound();

          setPhase("matched");
          setTimeout(() => navigate(`/race/${status.race_id}`), 500);
          return;
        }

        if (status.status === "timeout") {
          clearInterval(timerRef.current);
          setPhase("timeout");
          return;
        }
        if (status.band) setBand(status.band);
        pollRef.current = setTimeout(poll, 3000);
      } catch (e) {
        pollRef.current = setTimeout(poll, 5000);
      }
    }
    pollRef.current = setTimeout(poll, 3000);
  }, [navigate]);

  const cancelSearch = useCallback(async () => {
    clearInterval(timerRef.current);
    clearTimeout(pollRef.current);
    await leaveQueue().catch(() => {});
    setPhase("idle");
    setElapsed(0);
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <PageLayout>
      {/* Background Cyber Coder Setup Wallpaper Layer */}
      <div className="relative min-h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 z-10">

          {/* Back button */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors mb-8"
          >
            ← BACK
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <p className="font-mono text-xs text-accent tracking-widest mb-2">// ⚔ QUICK MATCH ARENA</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">FIND A RACE</h1>
            <p className="text-text-muted text-sm mb-4 max-w-md">
              Queue up and we'll match you with an opponent near your Elo for a live 1v1 battle.
            </p>

            {/* Queue stats */}
            <div className="flex items-center gap-4 font-mono text-xs mb-8">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-live/10 border border-status-live/30 text-status-live font-bold">
                <span className="w-2 h-2 bg-status-live rounded-full animate-ping" />
                {queueStats.queued} queued
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/30 text-status-warning font-bold">
                <span className="w-2 h-2 bg-status-warning rounded-full animate-pulse" />
                {queueStats.playing} playing live
              </span>
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card/90 backdrop-blur-2xl border border-accent/30 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {phase === "idle" && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="font-bold text-xl mb-1">CONFIGURE YOUR ARENA</h2>
                  <p className="text-text-muted text-xs">
                    Customize problem difficulty, topic tags, and race duration before searching.
                  </p>
                </div>

                {/* 1. Rating Difficulty Presets */}
                <div className="space-y-2">
                  <label className="font-mono text-xs text-text-dim tracking-wider block font-bold">
                    🎯 RATING DIFFICULTY PRESETS
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RATING_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetChange(p)}
                        className={`font-mono text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                          ratingPreset === p.id
                            ? `${p.color} ring-2 ring-accent/50 scale-105 shadow-lg`
                            : "border-border/80 text-text-muted hover:border-accent/40 hover:text-text-primary bg-bg-input/60"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Topic Tags Selection */}
                <div className="space-y-2">
                  <label className="font-mono text-xs text-text-dim tracking-wider block font-bold">
                    🏷 TOPIC TAGS (OPTIONAL)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? "bg-accent text-black font-extrabold border-accent shadow-[0_0_10px_rgba(255,230,12,0.4)]"
                              : "bg-bg-input/40 border-border/60 text-text-muted hover:border-accent/30 hover:text-accent"
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Race Duration Selection */}
                <div className="space-y-2">
                  <label className="font-mono text-xs text-text-dim tracking-wider block font-bold">
                    ⏱ RACE TIME LIMIT
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-w-md">
                    {[15, 30, 40, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`font-mono text-xs font-bold py-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                          duration === d
                            ? "bg-accent/20 border-accent text-accent shadow-md"
                            : "bg-bg-input/40 border-border/60 text-text-muted hover:border-accent/30"
                        }`}
                      >
                        {d} MINS
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Filters Summary Badge */}
                <div className="bg-bg-input/80 border border-accent/25 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-text-dim font-bold block mb-0.5">// ACTIVE ARENA FILTERS</span>
                    <span className="text-accent font-extrabold">
                      Rating: {minRating} - {maxRating} | Time: {duration} mins
                      {selectedTags.length > 0 && ` | Tags: ${selectedTags.join(", ")}`}
                    </span>
                  </div>
                  <span className="text-accent text-lg">⚡</span>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-status-error/15 border border-status-error/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-status-error text-xs font-mono font-bold shadow-md">
                    <span className="leading-relaxed">⚠️ {error}</span>
                    {(error.includes("Codeforces") || error.includes("verify")) && (
                      <Link to="/link-cf">
                        <button className="bg-accent text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shadow-sm">
                          LINK HANDLE NOW ▸
                        </button>
                      </Link>
                    )}
                  </div>
                )}


                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startSearch}
                  className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl hover:shadow-[0_0_25px_rgba(255,230,12,0.5)] transition-all cursor-pointer tracking-wider"
                >
                  ⚔ FIND A RACE (QUEUED SEARCH)
                </motion.button>
              </div>
            )}


          {phase === "searching" && (
            <div className="p-8 sm:p-12 text-center">
              {/* Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full mx-auto mb-6"
              />

              <p className="font-mono text-xs text-text-dim tracking-widest mb-3">
                // SCANNING FOR OPPONENT
              </p>
              <p className="text-4xl font-bold font-mono text-accent mb-4">
                {mins}:{secs}
              </p>
              <p className="text-text-muted text-sm mb-1">
                Rating band: ±{band}
              </p>
              <p className="text-text-dim text-xs mb-8">
                Band widens every 10 seconds for faster matching
              </p>

              <button
                onClick={cancelSearch}
                className="font-mono text-xs text-text-muted hover:text-status-error transition-colors underline cursor-pointer"
              >
                Cancel search
              </button>
            </div>
          )}

          {phase === "matched" && (
            <div className="p-8 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <p className="text-4xl mb-4">⚔️</p>
                <p className="text-2xl font-bold text-accent mb-2">OPPONENT FOUND</p>
                <p className="text-text-muted text-sm">Entering race room...</p>
              </motion.div>
            </div>
          )}

          {phase === "timeout" && (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-2xl mb-4">😔</p>
              <p className="text-xl font-bold mb-2">No opponent found</p>
              <p className="text-text-muted text-sm mb-6">
                No one with a similar rating is online right now. Try again or challenge a friend directly.
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setPhase("idle"); startSearch(); }}
                  className="font-mono text-sm font-bold bg-accent text-black px-5 py-2.5 rounded cursor-pointer"
                >
                  Try again
                </motion.button>
                <Link to="/challenge">
                  <button className="font-mono text-sm font-bold border border-border text-text-primary px-5 py-2.5 rounded hover:border-accent transition-colors cursor-pointer">
                    Challenge a friend
                  </button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  </PageLayout>
);
}