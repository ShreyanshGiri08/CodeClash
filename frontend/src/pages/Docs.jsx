import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";

export default function Docs() {
  // Interactive Elo Calculator State
  const [myElo, setMyElo] = useState(1200);
  const [oppElo, setOppElo] = useState(1350);
  const [outcome, setOutcome] = useState("win"); // 'win' | 'loss'
  const [kFactor, setKFactor] = useState(30);

  // Elo Math Formula: Expected = 1 / (1 + 10 ^ ((opp - my) / 400))
  const expectedWin = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
  const actualScore = outcome === "win" ? 1 : 0;
  const eloChange = Math.round(kFactor * (actualScore - expectedWin));
  const newElo = Math.max(0, myElo + eloChange);

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-10">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
              📖 SYSTEM ARCHITECTURE & DOCS
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              DEVELOPER DOCS & SPECS
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Complete technical specification of CodeClash's Elo engine, WebSocket protocols, and system architecture.
            </p>
          </div>

          {/* ⚡ INTERACTIVE ELO CALCULATOR TOOL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/90 backdrop-blur-2xl border-2 border-accent/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_0_35px_rgba(255,230,12,0.2)]"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <span className="font-mono text-xs text-accent font-bold tracking-widest">// INTERACTIVE SIMULATOR</span>
                <h2 className="text-xl font-extrabold text-text-primary">Live Elo Calculator</h2>
              </div>
              <span className="font-mono text-xs text-text-dim">Standard Elo Formula</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Controls Column */}
              <div className="space-y-5">
                {/* My Elo Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs font-bold">
                    <span className="text-accent">YOUR RATING</span>
                    <span className="text-text-primary">{myElo} ELO</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="2400"
                    step="10"
                    value={myElo}
                    onChange={(e) => setMyElo(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>

                {/* Opponent Elo Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs font-bold">
                    <span className="text-cyan-400">OPPONENT RATING</span>
                    <span className="text-text-primary">{oppElo} ELO</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="2400"
                    step="10"
                    value={oppElo}
                    onChange={(e) => setOppElo(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Outcome Toggle */}
                <div className="space-y-2">
                  <label className="font-mono text-xs font-bold text-accent">// MATCH RESULT</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOutcome("win")}
                      className={`font-mono text-xs font-black py-3 rounded-xl transition-all cursor-pointer ${
                        outcome === "win"
                          ? "bg-status-live text-black shadow-lg"
                          : "bg-bg-elevated border border-border text-text-muted"
                      }`}
                    >
                      🏆 WIN MATCH
                    </button>
                    <button
                      onClick={() => setOutcome("loss")}
                      className={`font-mono text-xs font-black py-3 rounded-xl transition-all cursor-pointer ${
                        outcome === "loss"
                          ? "bg-status-error text-white shadow-lg"
                          : "bg-bg-elevated border border-border text-text-muted"
                      }`}
                    >
                      ❌ LOSS MATCH
                    </button>
                  </div>
                </div>
              </div>

              {/* Formula & Live Calculation Output */}
              <div className="bg-bg-elevated/70 border border-border/80 rounded-xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="font-mono text-xs text-text-dim">// EXPECTED WIN PROBABILITY</p>
                  <p className="font-mono text-3xl font-black text-accent">
                    {(expectedWin * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-1 pt-4 border-t border-border/60">
                  <p className="font-mono text-xs text-text-dim">// CALCULATED RATING CHANGE</p>
                  <p className={`font-mono text-4xl font-black ${eloChange >= 0 ? 'text-status-live' : 'text-status-error'}`}>
                    {eloChange >= 0 ? `+${eloChange}` : eloChange} ELO
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between font-mono text-xs font-bold">
                  <span className="text-text-muted">NEW ELO RATING:</span>
                  <span className="text-accent text-base">{newElo} ELO</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Architecture Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 space-y-3 shadow-xl">
              <span className="font-mono text-xs text-accent font-bold tracking-widest">// WEBSOCKET REAL-TIME PROTOCOL</span>
              <h3 className="text-lg font-extrabold text-text-primary">WebSocket Event Bus</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                Connects to <code className="text-accent">/ws/race/{`{race_id}`}</code> via full-duplex TCP socket. Broadcasts real-time events <code className="text-cyan-300">RACE_UPDATE</code> and <code className="text-purple-300">OPPONENT_CHECKING</code> with heartbeat ping/pong keep-alives.
              </p>
            </div>

            <div className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 space-y-3 shadow-xl">
              <span className="font-mono text-xs text-cyan-400 font-bold tracking-widest">// DATABASE & POOLING</span>
              <h3 className="text-lg font-extrabold text-text-primary">Asyncpg Connection Pool</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                Uses Neon PostgreSQL serverless DB with asyncpg connection pooling (<code className="text-accent">min=2, max=10</code>) for high concurrency and zero cold-start handshake latency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
