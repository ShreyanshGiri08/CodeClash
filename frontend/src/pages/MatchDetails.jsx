import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import { getRace } from "../api/races";
import { useAuth } from "../context/AuthContext";

export default function MatchDetails() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRace(raceId)
      .then((r) => setRace(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  const isWinner = race?.winner_id && user && race.winner_id === user.id;

  const TIMELINE_EVENTS = [
    { time: "00:00", title: "RACE STARTED", desc: "Both clashers received Codeforces problem & timer commenced.", icon: "⚡", type: "system" },
    { time: "04:12", title: "SUBMISSION DETECTED", desc: "Player 1 submitted solution on Codeforces.", icon: "📤", type: "p1" },
    { time: "04:15", title: "VERDICT RECEIVED: WRONG ANSWER", desc: "Codeforces judge returned WA on Test 3.", icon: "❌", type: "error" },
    { time: "08:45", title: "SUBMISSION DETECTED", desc: "Player 2 submitted solution on Codeforces.", icon: "📤", type: "p2" },
    { time: "08:48", title: "VERDICT RECEIVED: ACCEPTED (AC)", desc: "Codeforces judge returned AC! Race finalized.", icon: "🏆", type: "victory" },
  ];

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-8">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-purple-600/20 border border-purple-400/40 text-purple-300 font-bold">
              🔍 RACE POST-MORTEM SUMMARY
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-accent font-bold animate-pulse">LOADING MATCH REPLAY DATA...</p>
            </div>
          ) : (
            <>
              {/* Match Header Summary Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/80 backdrop-blur-2xl border border-accent/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/80 pb-6">
                  <div>
                    <span className="font-mono text-xs text-accent font-bold tracking-widest">// MATCH REPLAY RECAP</span>
                    <h1 className="text-2xl sm:text-4xl font-black text-text-primary">
                      {race?.problem_id ? `PROBLEM ${race.problem_id}` : "MATCH SUMMARY"}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl font-mono text-xs font-black border shadow-md ${
                      isWinner ? 'bg-status-live/20 border-status-live text-status-live' : 'bg-status-error/20 border-status-error text-status-error'
                    }`}>
                      {isWinner ? "🏆 VICTORY" : "🏳 MATCH CONCLUDED"}
                    </span>
                  </div>
                </div>

                {/* Head to Head Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-bg-elevated/70 border border-border/80 rounded-xl p-5 space-y-2 text-center sm:text-left">
                    <p className="font-mono text-[11px] text-accent font-bold">// PLAYER 1 (YOU)</p>
                    <p className="font-extrabold text-lg text-text-primary">{user?.cf_handle || user?.display_name || "Player 1"}</p>
                    <p className="font-mono text-xs text-text-muted">Elo Before: {race?.p1_elo_before || 1200} → After: {race?.p1_elo_after || 1200}</p>
                  </div>
                  <div className="bg-bg-elevated/70 border border-border/80 rounded-xl p-5 space-y-2 text-center sm:text-left">
                    <p className="font-mono text-[11px] text-cyan-400 font-bold">// OPPONENT</p>
                    <p className="font-extrabold text-lg text-text-primary">Opponent Clasher</p>
                    <p className="font-mono text-xs text-text-muted">Elo Before: {race?.p2_elo_before || 1200} → After: {race?.p2_elo_after || 1200}</p>
                  </div>
                </div>
              </motion.div>

              {/* Event Timeline */}
              <div className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
                <div className="border-b border-border/80 pb-4">
                  <span className="font-mono text-xs text-accent font-bold tracking-widest">// TIMELINE AUDIT LOG</span>
                  <h2 className="text-xl font-extrabold text-text-primary">Match Event Sequence</h2>
                </div>

                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-accent/30">
                  {TIMELINE_EVENTS.map((event, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex items-start gap-4 group"
                    >
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-black border-2 border-accent flex items-center justify-center text-[10px]" />
                      <div className="flex-1 bg-bg-elevated/60 border border-border/60 rounded-xl p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-accent">{event.icon} {event.title}</span>
                          <span className="font-mono text-xs text-text-dim">{event.time}</span>
                        </div>
                        <p className="text-text-muted text-xs">{event.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
