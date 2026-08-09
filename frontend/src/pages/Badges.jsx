import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import HolographicBadgeCard from "../components/common/HolographicBadgeCard";
import { useAuth } from "../context/AuthContext";

const BADGES_DATA = [
  { id: 1, key: "first_blood", icon: "⚔️", name: "First Blood", description: "Complete your first 1v1 clash match.", category: "special", required: 1 },
  { id: 2, key: "speed_demon", icon: "⚡", name: "Speed Demon", description: "Win a 1v1 clash in under 5 minutes.", category: "speed", required: 1 },
  { id: 3, key: "century", icon: "🛡️", name: "Century Club", description: "Reach 1300+ Elo rating on the ladder.", category: "rating", required: 1300 },
  { id: 4, key: "master", icon: "💎", name: "Candidate Master", description: "Reach 1600+ Elo rating on the ladder.", category: "rating", required: 1600 },
  { id: 5, key: "grandmaster", icon: "👑", name: "Grandmaster Legend", description: "Reach 1900+ Elo rating on the ladder.", category: "rating", required: 1900 },
  { id: 6, key: "streak", icon: "🔥", name: "Streak Master", description: "Achieve a 5-win streak in ranked races.", category: "special", required: 5 },
  { id: 7, key: "flawless", icon: "🎯", name: "Flawless Victory", description: "Win a race without any Wrong Answer verdicts.", category: "speed", required: 1 },
  { id: 8, key: "underdog", icon: "🚀", name: "Underdog Hero", description: "Defeat an opponent with 150+ higher Elo.", category: "special", required: 1 },
];

export default function Badges() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const userElo = user?.elo || 1200;
  const racesPlayed = user?.races_played || 0;
  const racesWon = user?.races_won || 0;

  const getProgress = (b) => {
    if (b.key === "century") return Math.min(100, Math.round((userElo / 1300) * 100));
    if (b.key === "master") return Math.min(100, Math.round((userElo / 1600) * 100));
    if (b.key === "grandmaster") return Math.min(100, Math.round((userElo / 1900) * 100));
    if (b.key === "first_blood") return racesPlayed >= 1 ? 100 : 0;
    if (b.key === "speed_demon" || b.key === "flawless") return racesWon > 0 ? 100 : 35;
    if (b.key === "streak") return Math.min(100, racesWon * 20);
    return racesWon > 0 ? 100 : 50;
  };

  const processedBadges = BADGES_DATA.map((b) => {
    const p = getProgress(b);
    return {
      ...b,
      progress: p,
      unlocked: p >= 100,
    };
  });

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
            <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold shadow-md">
              🏆 UNLOCKED BADGES ({unlockedCount} / {BADGES_DATA.length})
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              3D HOLOGRAPHIC BADGES GALLERY
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Hover & tilt 3D holographic badges as you climb the ladder, win speed clashes, and hit milestone achievements.
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

          {/* Holographic 3D Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBadges.map((badge) => (
              <HolographicBadgeCard
                key={badge.id}
                badge={badge}
                isUnlocked={badge.unlocked}
                progress={badge.progress}
              />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

