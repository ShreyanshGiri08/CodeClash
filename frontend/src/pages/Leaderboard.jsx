import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboard";
import PageLayout from "../components/layout/PageLayout";

const AVATARS = {
  avatar1: "⚡", avatar2: "🔥", avatar3: "💀", avatar4: "🎯",
  avatar5: "🚀", avatar6: "⚔️", avatar7: "🏆", avatar8: "💎",
  avatar9: "🐉", avatar10: "👾", avatar11: "🦊", avatar12: "🎮",
};

const TIERS = [
  { id: "all", label: "ALL TIERS", min: null, max: null },
  { id: "expert", label: "EXPERT (1900+)", min: 1900, max: null },
  { id: "candidate", label: "CANDIDATE (1600-1899)", min: 1600, max: 1899 },
  { id: "specialist", label: "SPECIALIST (1400-1599)", min: 1400, max: 1599 },
  { id: "recruit", label: "RECRUIT (<1400)", min: null, max: 1399 },
];

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState("all");
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const currentTierObj = TIERS.find((t) => t.id === activeTier) || TIERS[0];

  // Fetch initial or search/tier reset
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const data = await getLeaderboard(1, 20, search, currentTierObj.min, currentTierObj.max);
      setEntries(data.entries || []);
      setTotalCount(data.total || 0);
      setHasMore(data.has_more ?? false);
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
    } finally {
      setLoading(false);
    }
  }, [search, activeTier, currentTierObj.min, currentTierObj.max]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch next page for infinite scroll
  const fetchNextPage = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await getLeaderboard(nextPage, 20, search, currentTierObj.min, currentTierObj.max);
      if (data.entries && data.entries.length > 0) {
        setEntries((prev) => [...prev, ...data.entries]);
        setPage(nextPage);
        setHasMore(data.has_more ?? false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error loading next page:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting && hasMore && !loading && !loadingMore && entries.length > 0) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );


    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, search, activeTier]);

  const topThree = entries.slice(0, 3);

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
        {/* Animated Neon Aura Motion Spheres */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none"
        />

        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            x: [0, -60, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[650px] h-[650px] bg-cyan-500/30 rounded-full blur-[160px] pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 z-10">

        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
          >
            ← DASHBOARD
          </Link>
          <span className="font-mono text-xs text-text-dim">
            TOTAL PLAYERS: <strong className="text-accent">{totalCount}</strong>
          </span>
        </div>

        {/* Page Title Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center sm:text-left space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent font-mono text-xs font-bold">
            ⚔️ GLOBAL COMPETITIVE LADDER
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">THE HALL OF CLASHERS</h1>
          <p className="text-text-muted text-sm max-w-xl">
            Real-time Elo rankings. Compete in 1v1 speed races to climb the global leaderboard.
          </p>
        </motion.div>


        {/* Top 3 Podium Cards */}
        {!loading && topThree.length > 0 && !search && activeTier === "all" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
          >
            {/* Rank 2 - Silver */}
            {topThree[1] && (
              <div className="order-2 md:order-1 bg-black/80 backdrop-blur-2xl border border-slate-400/40 rounded-2xl p-5 flex flex-col items-center text-center shadow-xl relative overflow-hidden group hover:border-slate-300 transition-all">
                <span className="absolute top-3 left-3 font-mono text-xs font-black text-slate-300 px-2 py-0.5 rounded bg-slate-400/20 border border-slate-400/30">#2 SILVER</span>
                <div className="w-14 h-14 rounded-full bg-slate-400/20 border-2 border-slate-300 flex items-center justify-center text-2xl mb-3 shadow-[0_0_15px_rgba(203,213,225,0.4)]">
                  {AVATARS[topThree[1].avatar] || "⚡"}
                </div>
                <h3 className="font-extrabold text-base text-text-primary truncate w-full mb-1">
                  {topThree[1].display_name || topThree[1].cf_handle || "Anon"}
                </h3>
                <p className="font-mono text-lg font-black text-slate-300">{topThree[1].elo} ELO</p>
                <p className="text-xs text-text-dim font-mono mt-1">
                  {topThree[1].races_won}W / {topThree[1].races_played} Played ({topThree[1].races_played > 0 ? Math.round((topThree[1].races_won / topThree[1].races_played) * 100) : 0}%)
                </p>
              </div>
            )}

            {/* Rank 1 - Gold */}
            {topThree[0] && (
              <div className="order-1 md:order-2 bg-black/90 backdrop-blur-2xl border-2 border-amber-400/80 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_0_35px_rgba(251,191,36,0.3)] relative overflow-hidden transform md:-translate-y-2 group hover:scale-[1.02] transition-all">
                <span className="absolute top-3 left-3 font-mono text-xs font-black text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-400/50 shadow-md">🥇 CHAMPION</span>
                <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse">
                  {AVATARS[topThree[0].avatar] || "👑"}
                </div>
                <h3 className="font-black text-lg text-amber-300 truncate w-full mb-1">
                  {topThree[0].display_name || topThree[0].cf_handle || "Anon"}
                </h3>
                <p className="font-mono text-2xl font-black text-amber-400 tracking-tight">{topThree[0].elo} ELO</p>
                <p className="text-xs text-amber-200/80 font-mono font-bold mt-1">
                  {topThree[0].races_won} Wins · {topThree[0].races_played > 0 ? Math.round((topThree[0].races_won / topThree[0].races_played) * 100) : 0}% Win Rate
                </p>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {topThree[2] && (
              <div className="order-3 bg-black/80 backdrop-blur-2xl border border-amber-700/50 rounded-2xl p-5 flex flex-col items-center text-center shadow-xl relative overflow-hidden group hover:border-amber-600 transition-all">
                <span className="absolute top-3 left-3 font-mono text-xs font-black text-amber-600 px-2 py-0.5 rounded bg-amber-700/20 border border-amber-700/30">#3 BRONZE</span>
                <div className="w-14 h-14 rounded-full bg-amber-700/20 border-2 border-amber-600 flex items-center justify-center text-2xl mb-3 shadow-[0_0_15px_rgba(217,119,6,0.4)]">
                  {AVATARS[topThree[2].avatar] || "🎯"}
                </div>
                <h3 className="font-extrabold text-base text-text-primary truncate w-full mb-1">
                  {topThree[2].display_name || topThree[2].cf_handle || "Anon"}
                </h3>
                <p className="font-mono text-lg font-black text-amber-500">{topThree[2].elo} ELO</p>
                <p className="text-xs text-text-dim font-mono mt-1">
                  {topThree[2].races_won}W / {topThree[2].races_played} Played ({topThree[2].races_played > 0 ? Math.round((topThree[2].races_won / topThree[2].races_played) * 100) : 0}%)
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Filter Controls: Search Input + Tier Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search handle or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-card/90 border border-border/80 rounded-xl px-4 py-2.5 pl-10 font-mono text-xs text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none transition-all shadow-inner"
              />
              <span className="absolute left-3.5 top-3 text-text-dim text-xs">🔍</span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-text-dim hover:text-accent font-mono text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setActiveTier(tier.id)}
                  className={`font-mono text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTier === tier.id
                      ? "bg-accent text-black shadow-[0_0_15px_rgba(255,230,12,0.4)]"
                      : "bg-bg-elevated/70 border border-border text-text-muted hover:border-accent/60 hover:text-text-primary"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Leaderboard Table */}
          <div className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-4 bg-bg-elevated/80 border-b border-border/80 font-mono text-xs font-extrabold text-accent tracking-wider">
              <span className="col-span-2 sm:col-span-1">RANK</span>
              <span className="col-span-5 sm:col-span-5">CLASH PLAYER</span>
              <span className="col-span-2 text-right">ELO</span>
              <span className="col-span-3 sm:col-span-2 text-right">RACES</span>
              <span className="hidden sm:block sm:col-span-2 text-right">WIN RATE</span>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-shimmer h-14 rounded-xl border border-border/40" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-3xl">⚔️</div>
                <p className="text-text-primary font-mono text-sm font-bold">No Clashers found matching filters.</p>
                <p className="text-text-dim text-xs">Try clearing your search query or selecting a different tier.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {entries.map((entry, i) => {
                  const winRate = entry.races_played > 0 ? Math.round((entry.races_won / entry.races_played) * 100) : 0;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: (i % 20) * 0.02 }}
                      className="grid grid-cols-12 gap-2 px-6 py-3.5 hover:bg-accent/10 transition-colors items-center group"
                    >
                      {/* Rank */}
                      <span className="col-span-2 sm:col-span-1 font-mono text-sm font-black text-text-muted group-hover:text-accent">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                      </span>

                      {/* Player Info */}
                      <span className="col-span-5 sm:col-span-5 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-bg-elevated border border-accent/30 flex items-center justify-center text-sm shadow-inner group-hover:border-accent">
                          {AVATARS[entry.avatar] || "⚡"}
                        </span>
                        <span className="flex flex-col truncate">
                          <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                            {entry.display_name || entry.cf_handle || "Anon Player"}
                          </span>
                          {entry.cf_handle && (
                            <span className="font-mono text-[10px] text-text-dim truncate">
                              @{entry.cf_handle}
                            </span>
                          )}
                        </span>
                      </span>

                      {/* Elo */}
                      <span className="col-span-2 font-mono text-sm font-extrabold text-accent text-right tracking-tight">
                        {entry.elo}
                      </span>

                      {/* Races */}
                      <span className="col-span-3 sm:col-span-2 font-mono text-xs text-text-muted text-right">
                        {entry.races_won}W / {entry.races_played}P
                      </span>

                      {/* Win Rate */}
                      <span className="hidden sm:block sm:col-span-2 font-mono text-xs text-right">
                        <span className={`px-2 py-0.5 rounded font-bold ${winRate >= 50 ? 'bg-status-live/15 text-status-live' : 'bg-status-error/15 text-status-error'}`}>
                          {winRate}%
                        </span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Bottom Sentinel */}
            <div ref={sentinelRef} className="py-4 text-center">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 py-3 font-mono text-xs text-accent">
                  <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  LOADING NEXT CLASHERS...
                </div>
              )}
              {!hasMore && entries.length > 0 && (
                <p className="font-mono text-[11px] text-text-dim py-2">
                  // END OF LADDER RANKINGS ({entries.length} DISPLAYED)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}