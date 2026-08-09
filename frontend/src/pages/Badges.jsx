import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import { useAuth } from "../context/AuthContext";

// Colorful High-Quality SVG Badge Component Icons
const BADGE_ICONS = {
  first_blood: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_sword" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_sword)" fillOpacity="0.2" stroke="url(#g_sword)" strokeWidth="2" />
      <path d="M12 28 L28 12 M23 12 L28 12 L28 17 M12 28 L15 25 M12 28 L15 31" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  speed_demon: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_bolt" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#ffe60c" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_bolt)" fillOpacity="0.2" stroke="url(#g_bolt)" strokeWidth="2" />
      <path d="M22 8 L11 22 H20 L18 32 L29 18 H20 L22 8 Z" fill="url(#g_bolt)" />
    </svg>
  ),
  century: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_shield" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_shield)" fillOpacity="0.2" stroke="url(#g_shield)" strokeWidth="2" />
      <path d="M20 10 L28 14 V20 C28 25 20 29 20 29 C20 29 12 25 12 20 V14 L20 10 Z" fill="url(#g_shield)" stroke="#60a5fa" strokeWidth="1.5" />
    </svg>
  ),
  master: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_diamond" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_diamond)" fillOpacity="0.2" stroke="url(#g_diamond)" strokeWidth="2" />
      <path d="M20 9 L29 17 L20 31 L11 17 L20 9 Z" fill="url(#g_diamond)" stroke="#c084fc" strokeWidth="1.5" />
    </svg>
  ),
  grandmaster: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_crown" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_crown)" fillOpacity="0.2" stroke="url(#g_crown)" strokeWidth="2" />
      <path d="M11 27 L13 14 L18 20 L20 12 L22 20 L27 14 L29 27 H11 Z" fill="url(#g_crown)" stroke="#fef08a" strokeWidth="1.5" />
    </svg>
  ),
  streak: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_flame" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_flame)" fillOpacity="0.2" stroke="url(#g_flame)" strokeWidth="2" />
      <path d="M20 9 C20 9 24 14 24 18 C24 20.5 22.5 22 20 22 C17.5 22 16 20.5 16 18 C16 14 20 9 20 9 Z" fill="url(#g_flame)" />
      <path d="M20 15 C20 15 22 18 22 20 C22 21 21 22 20 22 C19 22 18 21 18 20 C18 18 20 15 20 15 Z" fill="#fef08a" />
    </svg>
  ),
  flawless: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_target" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_target)" fillOpacity="0.2" stroke="url(#g_target)" strokeWidth="2" />
      <circle cx="20" cy="20" r="10" stroke="#34d399" strokeWidth="2" fill="none" />
      <circle cx="20" cy="20" r="4" fill="#34d399" />
    </svg>
  ),
  underdog: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="g_rocket" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#g_rocket)" fillOpacity="0.2" stroke="url(#g_rocket)" strokeWidth="2" />
      <path d="M20 10 C24 10 27 15 27 22 L20 27 L13 22 C13 15 16 10 20 10 Z" fill="url(#g_rocket)" />
    </svg>
  ),
};

export default function Badges() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const userElo = user?.elo || 1200;
  const racesPlayed = user?.races_played || 0;
  const racesWon = user?.races_won || 0;

  const ACHIEVEMENTS = [
    { id: 1, key: "first_blood", title: "First Blood", desc: "Complete your first 1v1 clash match.", category: "special", required: 1, current: racesPlayed },
    { id: 2, key: "speed_demon", title: "Speed Demon", desc: "Win a 1v1 clash in under 5 minutes.", category: "speed", required: 1, current: racesWon > 0 ? 1 : 0 },
    { id: 3, key: "century", title: "Century Club", desc: "Reach 1300+ Elo rating on the ladder.", category: "rating", required: 1300, current: userElo },
    { id: 4, key: "master", title: "Candidate Master", desc: "Reach 1600+ Elo rating on the ladder.", category: "rating", required: 1600, current: userElo },
    { id: 5, key: "grandmaster", title: "Grandmaster Legend", desc: "Reach 1900+ Elo rating on the ladder.", category: "rating", required: 1900, current: userElo },
    { id: 6, key: "streak", title: "Streak Master", desc: "Achieve a 5-win streak in ranked races.", category: "special", required: 5, current: Math.min(5, racesWon) },
    { id: 7, key: "flawless", title: "Flawless Victory", desc: "Win a race without any Wrong Answer verdicts.", category: "speed", required: 1, current: racesWon > 0 ? 1 : 0 },
    { id: 8, key: "underdog", title: "Underdog Hero", desc: "Defeat an opponent with 150+ higher Elo.", category: "special", required: 1, current: racesWon > 1 ? 1 : 0 },
  ];

  const processedBadges = ACHIEVEMENTS.map((b) => ({
    ...b,
    unlocked: b.current >= b.required,
  }));

  const filteredBadges = processedBadges.filter((b) => {
    if (filter === "unlocked") return b.unlocked;
    if (filter === "rating") return b.category === "rating";
    if (filter === "speed") return b.category === "speed";
    if (filter === "special") return b.category === "special";
    return true;
  });

  const unlockedCount = processedBadges.filter((b) => b.unlocked).length;

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-10">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold">
              🏆 UNLOCKED BADGES ({unlockedCount} / {ACHIEVEMENTS.length})
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              TROPHY & BADGES GALLERY
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Unlock prestigious badges as you climb the ladder, win speed races, and hit milestone achievements.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: "all", label: "ALL BADGES" },
              { id: "unlocked", label: `UNLOCKED (${unlockedCount})` },
              { id: "rating", label: "RATING MILESTONES" },
              { id: "speed", label: "SPEED & ACCURACY" },
              { id: "special", label: "SPECIAL FEATS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-accent text-black shadow-[0_0_15px_rgba(255,230,12,0.4)]"
                    : "bg-bg-elevated/70 border border-border text-text-muted hover:border-accent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Spacious Badges Grid — 2 Columns with generous room to breathe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {filteredBadges.map((badge, i) => {
              const progressPct = Math.min(100, Math.round((badge.current / badge.required) * 100));
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-black/90 backdrop-blur-2xl border rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xl transition-all relative overflow-hidden group ${
                    badge.unlocked
                      ? "border-accent/60 shadow-[0_0_30px_rgba(255,230,12,0.18)] hover:border-accent"
                      : "border-border/60 opacity-75 hover:opacity-95"
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 pt-0.5">
                      {BADGE_ICONS[badge.key] || BADGE_ICONS.first_blood}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-base text-text-primary">{badge.title}</h3>
                        <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          badge.unlocked ? "bg-status-live/20 text-status-live border border-status-live/40" : "bg-bg-elevated text-text-dim border border-border"
                        }`}>
                          {badge.unlocked ? "UNLOCKED ⚡" : "LOCKED 🔒"}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs leading-relaxed font-medium">{badge.desc}</p>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar & Data */}
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between font-mono text-xs text-text-dim">
                      <span>REQUIREMENT PROGRESS</span>
                      <span className="font-bold text-accent">{badge.current} / {badge.required} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-bg-elevated overflow-hidden border border-border/40">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${badge.unlocked ? 'bg-accent shadow-[0_0_12px_#ffe60c]' : 'bg-purple-500/50'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
