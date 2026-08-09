import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "../../context/SoundContext";


// Futuristic 3D Cyber Animated SVG Icon Set
const COMMAND_ITEMS = [
  {
    id: "practice",
    title: "Solo Training Arena",
    path: "/practice",
    category: "ARENA",
    desc: "Sharpen speed solving against live timer & CF problem scraper",
    gradient: "from-amber-500/20 to-yellow-500/10",
    borderColor: "border-amber-400/50",
    glowColor: "rgba(255, 230, 12, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "race",
    title: "Find 1v1 Ranked Race",
    path: "/race/find",
    category: "ESPORTS",
    desc: "Queue up for live Valorant-style 1v1 Elo rated matchup",
    gradient: "from-cyan-500/20 to-blue-500/10",
    borderColor: "border-cyan-400/50",
    glowColor: "rgba(34, 211, 238, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "analytics",
    title: "Performance Analytics",
    path: "/analytics",
    category: "STATS",
    desc: "Inspect solve velocity, accuracy, and Elo progression charts",
    gradient: "from-purple-500/20 to-pink-500/10",
    borderColor: "border-purple-400/50",
    glowColor: "rgba(192, 132, 252, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    title: "Global Leaderboard",
    path: "/leaderboard",
    category: "LADDER",
    desc: "Top competitive programming grandmasters & Elo rankings",
    gradient: "from-yellow-500/20 to-amber-600/10",
    borderColor: "border-yellow-400/50",
    glowColor: "rgba(250, 204, 21, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: "badges",
    title: "Badges & Achievements",
    path: "/achievements",
    category: "REWARDS",
    desc: "View 3D tilt holographic trophies & unlocked CP milestones",
    gradient: "from-emerald-500/20 to-teal-500/10",
    borderColor: "border-emerald-400/50",
    glowColor: "rgba(52, 211, 153, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: "settings",
    title: "Account & CF Handle",
    path: "/settings",
    category: "USER",
    desc: "Manage Codeforces verification handle, theme & preferences",
    gradient: "from-slate-500/20 to-gray-500/10",
    borderColor: "border-slate-400/50",
    glowColor: "rgba(148, 163, 184, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "docs",
    title: "System Architecture Docs",
    path: "/docs",
    category: "INFO",
    desc: "Inspect low-level WebSocket protocol, Elo math & topology",
    gradient: "from-blue-500/20 to-indigo-500/10",
    borderColor: "border-blue-400/50",
    glowColor: "rgba(96, 165, 250, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    title: "User Combat Dashboard",
    path: "/dashboard",
    category: "HOME",
    desc: "Main strategic command hub with match history & metrics",
    gradient: "from-rose-500/20 to-pink-500/10",
    borderColor: "border-rose-400/50",
    glowColor: "rgba(251, 113, 133, 0.4)",
    icon: (
      <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { toggleMute, muted } = useSound();
  const itemRefs = useRef([]);

  // Auto-scroll selected item into view when navigating with Arrow Up / Down keys
  useEffect(() => {
    if (open && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex, open]);

  // Listen for Ctrl+K or Cmd+K

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    setOpen(false);
    setQuery("");
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleKeyNav = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/85 backdrop-blur-xl">
          {/* Ambient Cyber Grid Mask */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 230, 12, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 230, 12, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl sm:max-w-3xl bg-[#0b0b10]/95 border border-accent/40 rounded-3xl shadow-[0_0_60px_rgba(255,230,12,0.25)] overflow-hidden flex flex-col relative z-10 backdrop-blur-2xl"
          >
            {/* 🔍 FUTURISTIC SEARCH BAR HEADER */}
            <div className="p-5 sm:p-6 border-b border-border/70 flex items-center gap-4 bg-black/60 relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,230,12,0.3)] shrink-0"
              >
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>

              <input
                type="text"
                autoFocus
                placeholder="Type a command or page search... (e.g. Practice, Leaderboard, Arena)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyNav}
                className="w-full bg-transparent font-mono text-sm sm:text-base text-white focus:outline-none placeholder:text-text-dim tracking-wide"
              />

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] font-black bg-accent/20 border border-accent/50 text-accent px-2.5 py-1 rounded-lg shadow-sm">
                  ⌘K / Ctrl+K
                </span>
                <span className="font-mono text-[11px] font-bold bg-black/60 border border-border text-text-dim px-2 py-1 rounded-lg">
                  ESC
                </span>
              </div>
            </div>

            {/* 📜 LUXURIOUS COMMAND LIST WITH SPACIOUS BREATHING ROOM */}
            <div className="max-h-[62vh] overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3.5">
              {filtered.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <span className="text-3xl">🔍</span>
                  <p className="font-mono text-xs text-text-dim">No matching commands or pages found.</p>
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <motion.div
                      key={item.id}
                      ref={(el) => (itemRefs.current[idx] = el)}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      whileHover={{ x: 6 }}

                      transition={{ duration: 0.15 }}
                      className={`p-4 sm:p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-200 relative group overflow-hidden border ${
                        isSelected
                          ? `bg-gradient-to-r ${item.gradient} ${item.borderColor} text-white shadow-xl`
                          : "bg-black/40 border-border/60 hover:bg-black/70 hover:border-accent/40 text-text-muted"
                      }`}
                      style={{
                        boxShadow: isSelected ? `0 0 25px ${item.glowColor}` : "none",
                      }}
                    >
                      {/* Left Side: 3D Rotating Icon & Title Info */}
                      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                        {/* 3D Rotating Glassmorphic Icon Container */}
                        <motion.div
                          animate={isSelected ? { rotateY: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 1.2, ease: "easeInOut" }}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                            isSelected
                              ? `${item.borderColor} bg-black/60 shadow-lg`
                              : "bg-black/50 border-border/80 group-hover:border-accent/50"
                          }`}
                        >
                          {item.icon}
                        </motion.div>

                        <div className="space-y-1 min-w-0">
                          <h4
                            className={`font-mono text-sm sm:text-base font-extrabold tracking-wide truncate ${
                              isSelected ? "text-white" : "text-text-primary group-hover:text-accent"
                            }`}
                          >
                            {item.title}
                          </h4>
                          <p
                            className={`font-mono text-xs truncate ${
                              isSelected ? "text-white/90 font-medium" : "text-text-dim"
                            }`}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Category Pill Badge */}
                      <div className="shrink-0 ml-4">
                        <span
                          className={`font-mono text-[10px] sm:text-[11px] font-black px-3.5 py-1.5 rounded-full border tracking-widest transition-all ${
                            isSelected
                              ? "bg-accent text-black border-accent font-extrabold shadow-md"
                              : "bg-black/60 border-border text-text-dim group-hover:border-accent/50 group-hover:text-accent"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ⚙️ FOOTER CONTROLS & KEYBOARD HINTS */}
            <div className="p-4 sm:p-5 border-t border-border/70 bg-black/60 flex flex-wrap justify-between items-center gap-3 font-mono text-xs text-text-dim">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-black/70 border border-border px-2 py-0.5 rounded text-[10px] text-accent font-extrabold">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-black/70 border border-border px-2 py-0.5 rounded text-[10px] text-accent font-extrabold">↵</kbd>
                  <span>Select</span>
                </span>
              </div>

              <button
                onClick={toggleMute}
                className="hover:text-accent flex items-center gap-2 cursor-pointer font-bold px-3 py-1 rounded-xl bg-black/50 border border-border/80 transition-all hover:border-accent/50"
              >
                <span>{muted ? "🔇 Sound Muted" : "🔊 Cyber Sound Synthesizer Active"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
