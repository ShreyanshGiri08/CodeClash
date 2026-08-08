import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createChallenge } from "../api/challenges";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";
import toast from "react-hot-toast";

export default function Challenge() {
  const [rating, setRating] = useState(1200);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [ratingPreset, setRatingPreset] = useState("custom");
  const [selectedTags, setSelectedTags] = useState([]);
  const [duration, setDuration] = useState(40);
  const { user } = useAuth();
  const navigate = useNavigate();

  const RATING_PRESETS = [
    { id: "easy", label: "🟢 EASY (800 - 1200)", rating: 1000, color: "border-status-live/40 text-status-live bg-status-live/10" },
    { id: "medium", label: "🟡 MEDIUM (1300 - 1600)", rating: 1400, color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
    { id: "hard", label: "🔴 HARD (1700 - 2100)", rating: 1800, color: "border-status-error/40 text-status-error bg-status-error/10" },
    { id: "expert", label: "⚡ EXPERT (2200+)", rating: 2300, color: "border-purple-500/40 text-purple-400 bg-purple-500/10" },
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
    setRating(preset.rating);
  }


  async function handleCreate() {
    if (user && !user.cf_verified) {
      setError("Please link & verify your Codeforces handle on the Settings page before creating a challenge room.");
      return;
    }

    setLoading(true);
    setError("");

    let attempts = 0;
    while (attempts < 3) {
      try {
        const data = await createChallenge({
          problem_rating: rating,
          tags: selectedTags,
          duration_minutes: duration,
        });
        setChallenge(data);
        toast.success("Challenge created! Share the 6-character room code with a friend.");
        setLoading(false);
        return;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          setError(err.message || "Failed to create challenge room. Please verify your Codeforces handle or try again.");
        } else {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    setLoading(false);
  }


  function copyCode() {
    const code = challenge.room_code || challenge.token;
    navigator.clipboard.writeText(code);
    toast.success(`Room Code '${code}' copied!`);
  }

  function copyLink() {
    const link = `${window.location.origin}/challenge/${challenge.token}`;
    navigator.clipboard.writeText(link);
    toast.success("Full link copied to clipboard!");
  }

  function handleJoinByCode(e) {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const cleanCode = joinCodeInput.trim().replace(/^.*\/challenge\//i, "");
    navigate(`/challenge/${cleanCode}`);
  }

  return (
    <PageLayout>
      {/* Background Cyber Coder Setup Wallpaper Layer */}

      <div className="relative min-h-[calc(100vh-4rem)] bg-bg-primary overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none filter blur-[2px] scale-105"
          style={{ backgroundImage: "url('/pro_coder_setup.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-bg-primary/95 to-black/95 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors mb-8"
          >
            ← BACK
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 bg-bg-elevated border border-border-accent rounded-lg flex items-center justify-center text-xl shadow-lg">
                👥
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  CHALLENGE A FRIEND{" "}
                  <span className="text-accent text-sm font-mono">// 1V1 ARENA</span>
                </h1>
              </div>
            </div>
            <p className="text-text-muted text-sm mb-8">
              Create a custom challenge room code or join a friend's private match.
            </p>
          </motion.div>

          {!challenge ? (
            <div className="space-y-8">
              {/* Create Challenge Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <span>⚡</span> CONFIGURE CHALLENGE ROOM
                </h2>

                {/* Rating presets */}
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

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-xs text-text-dim tracking-wider block font-bold">
                      EXACT RATING TARGET
                    </label>
                    <span className="font-mono text-lg font-extrabold text-accent">
                      {rating}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={3000}
                    step={100}
                    value={rating}
                    onChange={(e) => { setRating(Number(e.target.value)); setRatingPreset("custom"); }}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                {/* Topic tags */}
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

                {/* Race duration */}
                <div className="space-y-2">
                  <label className="font-mono text-xs text-text-dim tracking-wider block font-bold">
                    ⏱ MATCH TIME LIMIT
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
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl hover:shadow-[0_0_25px_rgba(255,230,12,0.5)] transition-all cursor-pointer"
                >
                  {loading ? "Creating Challenge..." : "⚔ CREATE CHALLENGE ROOM"}
                </motion.button>
              </motion.div>


            {/* Join with Code Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-card/90 backdrop-blur-md border border-border-bright/40 rounded-lg p-6 sm:p-8"
            >
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span>🔑</span> JOIN WITH ROOM CODE
              </h2>
              <p className="text-text-muted text-sm mb-4">
                Received a 6-character room code from your friend? Enter it below:
              </p>

              <form onSubmit={handleJoinByCode} className="flex gap-3">
                <input
                  placeholder="e.g., 8F2K4B"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-lg bg-bg-input border border-border text-sm font-mono uppercase tracking-wider text-accent font-bold placeholder:text-text-dim"
                />
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="font-mono text-sm font-bold bg-bg-elevated border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent hover:text-black transition-all disabled:opacity-50 cursor-pointer"
                >
                  JOIN ROOM ▸
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card/90 backdrop-blur-md border border-border-bright/60 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
          >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent text-xl animate-pulse">⚔</span>
              <h2 className="font-bold text-xl tracking-tight">CHALLENGE ROOM CREATED</h2>
            </div>
            <p className="text-text-muted text-sm">
              Send this 6-character Room Code to your opponent to start racing.
            </p>

            {/* Room Code Card */}
            <div className="bg-bg-input/90 border border-accent/40 rounded-xl p-6 text-center space-y-3 relative overflow-hidden shadow-inner">
              <p className="font-mono text-xs text-text-dim tracking-widest">// YOUR 6-CHARACTER ROOM CODE</p>
              <div className="flex items-center justify-center gap-4">
                <code className="font-mono text-4xl sm:text-5xl font-extrabold text-accent tracking-widest drop-shadow-[0_0_15px_rgba(255,230,12,0.4)]">
                  {challenge.room_code || challenge.token}
                </code>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyCode}
                  className="font-mono text-xs bg-accent text-black font-extrabold px-4 py-2.5 rounded-lg glow-yellow-hover transition-all cursor-pointer shadow-lg"
                >
                  📋 COPY CODE
                </motion.button>
              </div>
            </div>

            {/* Motivational CP Champion Graphic & Animated Ticker */}
            <div className="relative bg-bg-elevated/70 border border-border/80 rounded-xl p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Rotating Animated CP Badge */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-accent/50"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-1 rounded-full border border-accent/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-accent/15 rounded-full flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,230,12,0.3)]"
                  >
                    🏆
                  </motion.div>
                </div>

                {/* CP Motivational Content */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    STATUS: WAITING FOR OPPONENT
                  </div>
                  <h3 className="font-extrabold text-base text-text-primary tracking-wide">
                    READY FOR THE ARENA?
                  </h3>
                  <p className="text-text-muted text-xs leading-relaxed">
                    "Speed + Accuracy = Victory. Solve fast, submit clean, and claim your Elo!"
                  </p>
                </div>
              </div>

              {/* Animated Motivational Ticker Bar */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center overflow-hidden font-mono text-[11px] text-accent/80 tracking-wider">
                <motion.div
                  animate={{ x: [0, -500] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="whitespace-nowrap flex gap-8 font-bold"
                >
                  <span>⚡ SPEED & PRECISISION</span>
                  <span>🏆 CLAIM YOUR ELO</span>
                  <span>⚔️ NO MERCY IN 1V1</span>
                  <span>💻 CODE FAST OR DIE TRYING</span>
                  <span>⚡ SPEED & PRECISISION</span>
                  <span>🏆 CLAIM YOUR ELO</span>
                </motion.div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(`/challenge/${challenge.token}`)}
              className="w-full font-mono text-sm font-bold bg-accent text-black py-4 rounded-lg glow-yellow-hover cursor-pointer text-center tracking-wider"
            >
              GO TO RACE ROOM ▸
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  </PageLayout>
);
}

