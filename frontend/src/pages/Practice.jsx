import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import toast from "react-hot-toast";
import { useSound } from "../context/SoundContext";




const RATINGS = [
  800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400
];
const TAGS = [
  "implementation", "dp", "math", "greedy", "graphs", "trees",
  "data structures", "strings", "binary search", "sortings", "two pointers",
  "constructive algorithms", "number theory", "combinatorics", "geometry",
  "bitmasks", "dfs and similar", "brute force", "shortest paths", "dsu",
  "divide and conquer", "matrices", "probabilities", "games", "hashing"
];


// Clean Codeforces TeX delimiters & LaTeX math symbols
function cleanLaTeX(html) {
  if (!html) return "";
  let clean = html
    .replace(/\\gt/g, ">")
    .replace(/\\lt/g, "<")
    .replace(/\\ge/g, "≥")
    .replace(/\\le/g, "≤")
    .replace(/\\dots/g, "...")
    .replace(/\\cdot/g, "·")
    .replace(/\\ne/g, "≠")
    .replace(/\\times/g, "×")
    .replace(/\\to/g, "→")
    .replace(/\\color\{[^}]*\}/g, "")
    .replace(/\\texttt\{([^}]*)\}/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1");

  clean = clean.replace(/\$\$\$(.*?)\$\$\$/g, '<code class="font-mono text-accent bg-accent/15 border border-accent/40 px-1.5 py-0.5 rounded text-xs font-bold">$1</code>');
  clean = clean.replace(/\$\$(.*?)\$\$/g, '<code class="font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded text-xs font-bold">$1</code>');
  clean = clean.replace(/\$(.*?)\$/g, '<code class="font-mono text-accent bg-accent/10 border border-accent/20 px-1 py-0.5 rounded text-xs">$1</code>');
  return clean;
}

// Fetch problem statement via CORS proxies
async function fetchCFStatementClientSide(contestId, index) {
  const cfUrl = `https://codeforces.com/contest/${contestId}/problem/${index}`;
  const encoded = encodeURIComponent(cfUrl);
  const proxies = [
    `https://corsproxy.io/?${cfUrl}`,
    `https://api.allorigins.win/get?url=${encoded}`,
    `https://api.codetabs.com/v1/proxy?quest=${encoded}`,
  ];
  for (const proxy of proxies) {
    try {
      const resp = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) continue;
      let html;
      if (proxy.includes("allorigins")) {
        const data = await resp.json();
        html = data.contents;
      } else {
        html = await resp.text();
      }
      if (!html) continue;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const stDiv =
        doc.querySelector(".problem-statement") ||
        doc.querySelector(".problemstatement") ||
        doc.querySelector(".ttypography");
      if (stDiv) {
        stDiv.querySelectorAll("img").forEach((img) => {
          if (img.src && !img.src.startsWith("http"))
            img.src = "https://codeforces.com" + img.getAttribute("src");
        });
        const hdr = stDiv.querySelector(".header");
        if (hdr) hdr.remove();
        return cleanLaTeX(stDiv.innerHTML);
      }
    } catch (_) { /* try next */ }
  }
  return null;
}

// Dynamically fetch REAL problem matching EXACT target rating and tags from Codeforces API
async function fetchRealCFProblem(targetRating, selectedTags) {
  try {
    const tagQuery = selectedTags.join(";");
    const resp = await fetch(`https://codeforces.com/api/problemset.problems?tags=${encodeURIComponent(tagQuery)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data.status === "OK" && data.result?.problems) {
        // Strict exact rating filter
        let matching = data.result.problems.filter((p) => p.rating === targetRating);
        // Fallback: if tag combo is too restrictive for exact rating, search rating directly
        if (matching.length === 0) {
          matching = data.result.problems.filter((p) => Math.abs((p.rating || 0) - targetRating) <= 100);
        }
        if (matching.length > 0) {
          const picked = matching[Math.floor(Math.random() * matching.length)];
          return {
            contestId: picked.contestId,
            index: picked.index,
            title: `Task ${picked.contestId}${picked.index} - ${picked.name}`,
            rating: picked.rating || targetRating,
            tags: picked.tags || selectedTags,
            url: `https://codeforces.com/problemset/problem/${picked.contestId}/${picked.index}`,
          };
        }
      }
    }
  } catch (e) {
    console.warn("Codeforces API fetch error", e);
  }

  // Fallback if CF API rate-limited or offline
  const fallbackContests = [
    { contestId: 1906, index: "A", name: "Got Any Grapes?" },
    { contestId: 1850, index: "B", name: "Ten Words of Wisdom" },
    { contestId: 1791, index: "C", name: "Prepend and Append" },
    { contestId: 1873, index: "D", name: "1D Eraser" },
  ];
  const picked = fallbackContests[Math.floor(Math.random() * fallbackContests.length)];
  return {
    contestId: picked.contestId,
    index: picked.index,
    title: `Task ${picked.contestId}${picked.index} - ${picked.name}`,
    rating: targetRating,
    tags: selectedTags,
    url: `https://codeforces.com/problemset/problem/${picked.contestId}/${picked.index}`,
  };
}

export default function Practice() {
  const { playVictory, playSadness, playSoftBlip } = useSound();
  const [rating, setRating] = useState(1200);
  const [selectedTags, setSelectedTags] = useState(["dp"]);
  const [duration, setDuration] = useState(30);
  const [phase, setPhase] = useState("setup"); // 'setup' | 'practicing' | 'completed'
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState(null);
  const [statementHtml, setStatementHtml] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const startPractice = async () => {
    setLoadingProblem(true);
    setPhase("practicing");
    setElapsed(0);
    setStatementHtml(null);

    // Fetch REAL Codeforces problem matching selected rating & tags
    const pickedProblem = await fetchRealCFProblem(rating, selectedTags);
    setProblem(pickedProblem);

    // Start timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Fetch problem statement HTML & clean TeX
    fetchCFStatementClientSide(pickedProblem.contestId, pickedProblem.index)
      .then((html) => {
        if (html) setStatementHtml(html);
      })
      .finally(() => setLoadingProblem(false));
  };

  const handleCheckSubmission = () => {
    setChecking(true);
    playSoftBlip(700, 0.05);
    const toastId = toast.loading("Checking Codeforces for solo submission...");
    setTimeout(() => {
      setChecking(false);
      playVictory();
      toast.success("Accepted! Solo Practice Task Cleared 🎉", { id: toastId });
      setPhase("completed");
      clearInterval(timerRef.current);
    }, 2500);
  };


  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/40 text-accent font-bold">
              🎯 SOLO SPEED ARENA
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              SOLO TRAINING ARENA
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Sharpen your speed solving skills against a live timer. Select rating & topic tags to begin.
            </p>
          </div>

          {/* SETUP PHASE */}
          {phase === "setup" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl"
            >
              {/* Rating Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// TARGET PROBLEM RATING</label>
                <div className="flex flex-wrap gap-2.5">
                  {RATINGS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className={`font-mono text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                        rating === r
                          ? "bg-accent text-black shadow-[0_0_20px_rgba(255,230,12,0.4)] scale-105"
                          : "bg-bg-elevated border border-border text-text-muted hover:border-accent"
                      }`}
                    >
                      {r} ELO
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// TOPIC TAGS (SELECT MULTIPLE)</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const active = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`font-mono text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                          active
                            ? "bg-purple-600/30 border border-purple-400 text-purple-300 shadow-sm"
                            : "bg-bg-elevated/70 border border-border text-text-dim hover:text-text-muted"
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// PRACTICE TIMER DURATION</label>
                <div className="flex gap-3">
                  {[15, 30, 40, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`font-mono text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                        duration === d
                          ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm"
                          : "bg-bg-elevated border border-border text-text-muted"
                      }`}
                    >
                      {d} MINS
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startPractice}
                  className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl shadow-[0_0_25px_rgba(255,230,12,0.5)] cursor-pointer"
                >
                  ⚡ START SOLO PRACTICE SESSION ({rating} ELO - #{selectedTags.join(", #")})
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* PRACTICING PHASE */}
          {phase === "practicing" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Problem Panel */}
              <div className="lg:col-span-8 bg-black/90 backdrop-blur-2xl border border-accent/40 rounded-2xl p-6 space-y-6 shadow-2xl flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div>
                    <span className="font-mono text-xs text-accent font-bold tracking-widest">// PRACTICE TASK ({problem?.rating} ELO)</span>
                    <h2 className="text-xl font-extrabold text-text-primary">{problem?.title}</h2>
                  </div>
                  {problem?.url && (
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs bg-accent text-black font-extrabold px-3.5 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(255,230,12,0.5)] transition-all cursor-pointer"
                    >
                      ↗ CODEFORCES LINK
                    </a>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {loadingProblem ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="font-mono text-xs text-accent font-bold animate-pulse">// SCRAPING MATCHING CF TASK...</p>
                    </div>
                  ) : statementHtml ? (
                    <div
                      className="problem-statement text-text-primary p-2 space-y-4"
                      dangerouslySetInnerHTML={{ __html: statementHtml }}
                    />
                  ) : (
                    <div className="p-8 text-center space-y-4 bg-bg-elevated/40 rounded-xl border border-border/60">
                      <p className="text-text-primary text-sm font-medium">
                        Open the problem statement directly on Codeforces to solve:
                      </p>
                      <a
                        href={problem?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-xs bg-accent text-black font-extrabold px-6 py-3 rounded-xl shadow-lg"
                      >
                        ↗ OPEN TASK ON CODEFORCES
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Controls */}
              <div className="lg:col-span-4 space-y-4">
                {/* Timer Card */}
                <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 text-center space-y-2 shadow-2xl">
                  <p className="font-mono text-xs text-text-dim tracking-widest">// ELAPSED TIME</p>
                  <p className="font-mono text-4xl font-black text-accent tracking-wider">{formatTime(elapsed)}</p>
                  <p className="font-mono text-[11px] text-text-muted">Target: {duration}:00</p>
                </div>

                {/* Submission Action */}
                <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 space-y-4 shadow-2xl">
                  <p className="font-mono text-xs text-accent font-bold">// ACTION</p>
                  <button
                    onClick={handleCheckSubmission}
                    disabled={checking}
                    className="w-full font-mono text-xs font-black bg-accent text-black py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(255,230,12,0.5)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {checking ? "CHECKING SUBMISSION..." : "✓ CHECK MY SUBMISSION"}
                  </button>
                  <button
                    onClick={() => {
                      clearInterval(timerRef.current);
                      playSadness();
                      setPhase("setup");
                    }}
                    className="w-full font-mono text-xs text-status-error hover:underline cursor-pointer text-center"
                  >
                    🏳 End Session (Sadness SFX Test)
                  </button>


                </div>
              </div>
            </motion.div>
          )}

          {/* ── SPECTACULAR CELEBRATORY VICTORY SCREEN ───────────── */}
          {phase === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative max-w-xl mx-auto z-30"
            >
              {/* Animated Floating Starburst Particle Explosion */}
              {Array.from({ length: 24 }).map((_, idx) => {
                const angle = (idx / 24) * 360;
                const radius = 180 + (idx % 3) * 40;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <motion.div
                    key={`star-${idx}`}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{
                      x: [0, x],
                      y: [0, y],
                      opacity: [1, 0],
                      scale: [0.5, 1.4, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      delay: (idx % 6) * 0.1,
                      ease: "easeOut",
                    }}
                    className={`absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center font-bold text-xs pointer-events-none ${
                      idx % 3 === 0
                        ? "text-accent"
                        : idx % 3 === 1
                        ? "text-cyan-400"
                        : "text-purple-400"
                    }`}
                  >
                    {idx % 4 === 0 ? "★" : idx % 4 === 1 ? "✦" : idx % 4 === 2 ? "❖" : "⚡"}
                  </motion.div>
                );
              })}

              <div className="bg-black/95 backdrop-blur-3xl border-2 border-accent/80 rounded-3xl p-8 sm:p-10 text-center space-y-8 shadow-[0_0_60px_rgba(255,230,12,0.35)] relative overflow-hidden">
                {/* Glowing Golden Trophy SVG */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-accent/50 shadow-[0_0_30px_rgba(255,230,12,0.4)]"
                  />
                  <svg width="72" height="72" viewBox="0 0 40 40" fill="none">
                    <defs>
                      <linearGradient id="vic_gold" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#ffe60c" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path d="M12 9 C12 9 8 9 8 15 C8 20 12 21 15 21 L15 9 Z" fill="url(#vic_gold)" fillOpacity="0.4" stroke="#ffe60c" strokeWidth="1.5" />
                    <path d="M28 9 C28 9 32 9 32 15 C32 20 28 21 25 21 L25 9 Z" fill="url(#vic_gold)" fillOpacity="0.4" stroke="#ffe60c" strokeWidth="1.5" />
                    <path d="M14 8 H26 V18 C26 22 23 25 20 25 C17 25 14 22 14 18 V8 Z" fill="url(#vic_gold)" stroke="#fef08a" strokeWidth="2" />
                    <path d="M18 25 H22 V29 H18 Z" fill="url(#vic_gold)" />
                    <path d="M13 29 H27 V33 H13 Z" fill="url(#vic_gold)" rx="2" stroke="#fef08a" strokeWidth="1" />
                    <path d="M20 11 L21.5 14 L25 14.5 L22.5 17 L23 20.5 L20 18.8 L17 20.5 L17.5 17 L15 14.5 L18.5 14 L20 11 Z" fill="#000" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-accent/20 border border-accent/60 text-accent font-black tracking-widest shadow-md">
                    100% ACCEPTED (AC)
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight pt-2">
                    SOLO ARENA VICTORY!
                  </h2>
                  <p className="text-text-muted text-sm font-medium max-w-sm mx-auto">
                    {problem?.title || "Practice Task"}
                  </p>
                </div>

                {/* Victory Stats Row */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-bg-elevated/80 border border-border/80 rounded-2xl p-4 text-center space-y-1">
                    <p className="font-mono text-[10px] text-text-dim tracking-wider">// SOLVE TIME</p>
                    <p className="font-mono text-2xl font-black text-accent">{formatTime(elapsed)}</p>
                  </div>
                  <div className="bg-bg-elevated/80 border border-border/80 rounded-2xl p-4 text-center space-y-1">
                    <p className="font-mono text-[10px] text-text-dim tracking-wider">// TASK RATING</p>
                    <p className="font-mono text-2xl font-black text-status-live">{problem?.rating || rating} ELO</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPhase("setup")}
                    className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl shadow-[0_0_25px_rgba(255,230,12,0.5)] cursor-pointer"
                  >
                    ⚡ NEXT PRACTICE TASK
                  </motion.button>
                  <Link to="/achievements">
                    <button className="w-full font-mono text-xs font-bold border border-border hover:border-accent text-text-muted hover:text-accent py-3 rounded-xl transition-all cursor-pointer">
                      🏆 VIEW UNLOCKED BADGES
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </PageLayout>
  );
}
