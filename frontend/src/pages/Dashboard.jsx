import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRaceHistory, getRatingHistory } from "../api/auth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import PageLayout from "../components/layout/PageLayout";

const AVATARS = {
  avatar1: "⚡", avatar2: "🔥", avatar3: "💀", avatar4: "🎯",
  avatar5: "🚀", avatar6: "⚔️", avatar7: "🏆", avatar8: "💎",
  avatar9: "🐉", avatar10: "👾", avatar11: "🦊", avatar12: "🎮",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

function StatCard({ label, value, color = "text-accent", delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
      className="bg-bg-card border border-border rounded-lg p-5 hover:border-border-bright transition-colors"
    >
      <p className="font-mono text-xs text-text-dim tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="skeleton h-24 rounded-lg" />;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [raceHistory, setRaceHistory] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      Promise.all([
        getRaceHistory().catch(() => []),
        getRatingHistory(user.id).catch(() => []),
      ]).then(([races, ratings]) => {
        setRaceHistory(races);
        setRatingHistory(ratings);
        setDataLoading(false);
      }).catch(() => {
        setDataLoading(false);
      });
    } else {
      setDataLoading(false);
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (dataLoading && user)) {
    return (
      <PageLayout>
        <div className="relative min-h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-8 animate-pulse">
            {/* Header User Profile Banner Skeleton */}
            <div className="bg-black/70 border border-accent/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/40" />
                <div className="space-y-2">
                  <div className="h-6 w-44 bg-accent/20 rounded-md" />
                  <div className="h-4 w-32 bg-border/60 rounded-md" />
                </div>
              </div>
              <div className="h-10 w-28 bg-accent/20 rounded-xl" />
            </div>

            {/* 4 Stat Cards Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-black/70 border border-border/60 rounded-xl p-5 space-y-2">
                  <div className="h-3 w-20 bg-border/60 rounded" />
                  <div className="h-8 w-16 bg-accent/20 rounded-md" />
                </div>
              ))}
            </div>

            {/* Action Buttons Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-14 bg-accent/20 rounded-xl" />
              <div className="h-14 bg-border/60 rounded-xl" />
            </div>

            {/* Rating Graph Card Skeleton */}
            <div className="bg-black/70 border border-accent/20 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-48 bg-accent/20 rounded" />
              <div className="h-64 bg-border/40 rounded-xl" />
            </div>

            {/* Match History Table Skeleton */}
            <div className="bg-black/70 border border-border/60 rounded-2xl p-6 space-y-3">
              <div className="h-5 w-40 bg-accent/20 rounded" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-border/40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }



  const winRate = user.races_played > 0
    ? Math.round((user.races_won / user.races_played) * 100)
    : 0;

  const chartData = ratingHistory.length > 0
    ? [{ elo_after: 1200, recorded_at: "" }, ...ratingHistory]
    : [];

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
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-purple-600/30 rounded-full blur-[130px] pointer-events-none"
        />

        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            x: [0, -60, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 w-[550px] h-[550px] bg-cyan-500/30 rounded-full blur-[150px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-accent/20 rounded-full blur-[170px] pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60 pointer-events-none" />


        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10">



        {/* Unverified Handle Alert Banner */}
        {!user.cf_verified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-mono text-xs font-bold text-accent tracking-wider">// CODEFORCES UNVERIFIED</p>
                <p className="text-xs text-text-muted">Link your Codeforces handle to participate in 1v1 races.</p>
              </div>
            </div>
            <Link to="/link-cf">
              <button className="font-mono text-xs font-bold bg-accent text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer">
                LINK HANDLE NOW ▸
              </button>
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-2xl">
              {AVATARS[user.avatar] || "⚡"}
            </div>
            <div>
              <p className="font-mono text-xs text-text-dim tracking-widest">// SIGNED IN</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-accent">
                {user.display_name || user.cf_handle || user.email}
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="ELO" value={user.elo} delay={0} />
          <StatCard label="RACES" value={user.races_played} delay={1} />
          <StatCard label="WINS" value={user.races_won} delay={2} color="text-status-live" />
          <StatCard label="WIN RATE" value={`${winRate}%`} delay={3} color="text-text-primary" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Link to="/race/find" className="block">
              <button className="w-full bg-accent text-black font-mono font-bold text-sm py-4 rounded-lg glow-yellow-hover cursor-pointer">
                ⚔ FIND A RACE (MATCHMAKING)
              </button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Link to="/challenge" className="block">
              <button className="w-full bg-bg-card border border-border text-text-primary font-mono font-bold text-sm py-4 rounded-lg hover:border-accent transition-colors cursor-pointer">
                👥 CREATE A CHALLENGE ROOM
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Quick Join Room Code */}
        <div className="bg-bg-card border border-border rounded-lg p-4 mb-10 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <p className="font-mono text-xs text-text-dim tracking-wider mb-1">// GOT A FRIEND'S ROOM CODE?</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = e.target.elements.roomCode.value.trim().toUpperCase().replace(/^.*\/challenge\//i, "");
                if (code) navigate(`/challenge/${code}`);
              }}
              className="flex gap-2"
            >
              <input
                name="roomCode"
                placeholder="Enter 6-char Room Code (e.g. 8F2K4B)"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-xs font-mono font-bold uppercase tracking-wider text-accent placeholder:text-text-dim"
              />
              <button
                type="submit"
                className="font-mono text-xs font-bold bg-bg-elevated border border-accent text-accent px-4 py-2 rounded-lg hover:bg-accent hover:text-black transition-all cursor-pointer whitespace-nowrap"
              >
                JOIN ▸
              </button>
            </form>
          </div>
        </div>


        {/* Rating Chart */}
        {chartData.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/80 backdrop-blur-2xl border border-accent/40 rounded-2xl p-6 mb-10 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
              <div>
                <p className="font-mono text-xs font-bold text-accent tracking-widest">// ELO PROGRESSION GRAPH</p>
                <h3 className="text-lg font-extrabold text-text-primary">Rating Curve & History</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent font-bold">
                  PEAK: {Math.max(...chartData.map((d) => d.elo_after))} ELO
                </span>
                <span className="px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-muted">
                  START: 1200 ELO
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffe60c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffe60c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="recorded_at" hide />
                  <YAxis
                    domain={["dataMin - 30", "dataMax + 30"]}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    width={45}
                  />
                  <ReferenceLine y={1200} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" label={{ value: '1200 BASE', fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-black/90 backdrop-blur-md border border-accent/40 shadow-2xl font-mono text-xs space-y-1">
                            <p className="font-bold text-accent">RATING: {data.elo_after} ELO</p>
                            {data.elo_change != null && (
                              <p className={data.elo_change >= 0 ? "text-status-live font-bold" : "text-status-error font-bold"}>
                                CHANGE: {data.elo_change >= 0 ? `+${data.elo_change}` : data.elo_change} ELO
                              </p>
                            )}
                            {data.recorded_at && (
                              <p className="text-[10px] text-text-dim">{new Date(data.recorded_at).toLocaleDateString()}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="elo_after"
                    stroke="#ffe60c"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#eloGradient)"
                    dot={{ fill: "#ffe60c", r: 4, strokeWidth: 1, stroke: "#000" }}
                    activeDot={{ r: 7, fill: "#ffe60c", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}


        {/* Recent Races */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="font-mono text-xs text-text-dim tracking-widest mb-4">// RECENT RACES</p>
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
            </div>
          ) : raceHistory.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-text-muted text-sm">No races yet. Find a race to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {raceHistory.slice(0, 10).map((race) => (
                <Link
                  key={race.id}
                  to={`/race/${race.id}`}
                  className="flex items-center justify-between bg-bg-card border border-border rounded-lg px-5 py-3 hover:border-border-bright transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      race.result === "win"
                        ? "bg-status-live/10 text-status-live"
                        : race.result === "loss"
                        ? "bg-status-error/10 text-status-error"
                        : "bg-text-dim/10 text-text-muted"
                    }`}>
                      {race.result === "win" ? "W" : race.result === "loss" ? "L" : "D"}
                    </span>
                    <span className="text-sm">
                      vs <span className="font-mono font-medium">{race.opponent_handle || "Unknown"}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-text-dim">{race.problem_id}</span>
                    {race.elo_change != null && (
                      <span className={`font-mono text-sm font-bold ${
                        race.elo_change > 0 ? "text-status-live" : "text-status-error"
                      }`}>
                        {race.elo_change > 0 ? "+" : ""}{race.elo_change}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="flex gap-3 mt-8">
          <Link to="/leaderboard" className="font-mono text-xs text-text-muted hover:text-accent transition-colors">
            Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  </PageLayout>
);
}