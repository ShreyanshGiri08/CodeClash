import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";
import SpotlightCard from "../components/common/SpotlightCard";
import HolographicBadgeCard from "../components/common/HolographicBadgeCard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

// Animated SVG icons for each step
function IconStepUp() {
  return (
    <motion.svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle cx="19" cy="10" r="5" fill="currentColor" opacity="0.9"
        animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
      <motion.path d="M10 30 Q19 20 28 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"
        animate={{ pathLength: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.path d="M19 36 L19 22 M15 26 L19 22 L23 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
    </motion.svg>
  );
}

function IconFaceOff() {
  return (
    <motion.svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <motion.rect x="4" y="10" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"
        animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <rect x="22" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <motion.rect x="24" y="10" width="10" height="6" rx="1" fill="currentColor" opacity="0.4"
        animate={{ opacity: [0.7, 0.3, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.path d="M21 14 L17 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        animate={{ scaleX: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      <motion.rect x="6" y="22" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.25" />
      <motion.rect x="6" y="22" width="26" height="3" rx="1.5" fill="currentColor"
        animate={{ width: [26, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
    </motion.svg>
  );
}

function IconGetJudged() {
  return (
    <motion.svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle cx="19" cy="19" r="13" stroke="currentColor" strokeWidth="2"
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
      <motion.path d="M12 19 L17 24 L26 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }} />
      <motion.circle cx="19" cy="19" r="13" stroke="currentColor" strokeWidth="1" opacity="0.4"
        animate={{ r: [13, 18], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
    </motion.svg>
  );
}

function IconClimbOrCope() {
  return (
    <motion.svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path d="M13 6 H25 V18 C25 23 13 23 13 18 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
      <path d="M19 23 V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 28 H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <motion.path d="M13 10 Q8 10 8 15 Q8 18 13 18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"
        animate={{ x: [-1, 0, -1] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.path d="M25 10 Q30 10 30 15 Q30 18 25 18" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"
        animate={{ x: [1, 0, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.circle cx="19" cy="14" r="2" fill="currentColor"
        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.4, repeat: Infinity }} />
    </motion.svg>
  );
}

const STEP_ICONS = [IconStepUp, IconFaceOff, IconGetJudged, IconClimbOrCope];

const steps = [
  {
    num: "01",
    title: "STEP UP",
    desc: "Queue up for a quick match. We'll pair you with someone close to your Elo in seconds.",
    color: "text-accent",
  },
  {
    num: "02",
    title: "FACE OFF",
    desc: "Same problem, same timer. You both see the Codeforces problem and the countdown starts.",
    color: "text-status-live",
  },
  {
    num: "03",
    title: "GET JUDGED",
    desc: "Submit on Codeforces or test locally in Monaco IDE. Real-time verdicts directly from CF.",
    color: "text-status-warning",
  },
  {
    num: "04",
    title: "CLIMB OR COPE",
    desc: "First AC takes the round and the Elo. Climb the ladder or queue up and try again.",
    color: "text-status-error",
  },
];

const marqueeItems = [
  "Elo-rated matchmaking",
  "Embedded Monaco IDE",
  "Multi-language (C++, Py, Java, JS)",
  "Live verdict tracking",
  "Challenge your friends",
  "40-minute match clock",
  "Real Codeforces problems",
  "3D Holographic Badges",
  "1v1 esports arena",
];

export default function Landing() {
  const { user, isAuthenticated } = useAuth();

  return (
    <PageLayout>
      <div className="relative min-h-screen bg-transparent overflow-hidden">
        {/* Animated Neon Glow Spheres */}
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
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-accent/20 rounded-full blur-[180px] pointer-events-none"
        />

        <div className="relative z-10 space-y-12">
          {/* ── 1. Hero Section with Spotlight Glow & Cyber IDE Preview ───────────────── */}
          <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-4 pt-8 pb-12 overflow-hidden">
            <motion.div
              initial="hidden"
              animate="visible"
              className="relative z-10 text-center max-w-4xl space-y-6"
            >
              {/* Signed-In User Greeting Badge */}
              {isAuthenticated ? (
                <motion.div
                  variants={fadeUp}
                  custom={0}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-accent/20 border-2 border-accent/60 text-accent font-mono text-sm sm:text-base font-black shadow-[0_0_30px_rgba(255,230,12,0.45)] backdrop-blur-2xl"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                  ⚡ WELCOME BACK, <span className="text-white underline decoration-accent/60 decoration-2">{user?.cf_handle || user?.display_name || "CHAMPION"}</span> ({user?.elo || 1200} ELO)
                </motion.div>
              ) : (
                <motion.p
                  variants={fadeUp}
                  custom={0}
                  className="font-mono text-xs tracking-[0.3em] text-accent flex items-center justify-center gap-2 font-bold"
                >
                  <span className="w-2.5 h-2.5 bg-status-live rounded-full animate-ping" />
                  NEXT-GEN 1V1 COMPETITIVE PROGRAMMING ARENA
                </motion.p>
              )}

              {/* Main Glowing Title */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-6xl sm:text-8xl font-black tracking-tight drop-shadow-[0_0_35px_rgba(255,230,12,0.4)]"
                style={{ color: "#ffe60c", fontFamily: "'Inter', sans-serif" }}
              >
                CODE<br />CLASH
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-text-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed font-medium"
              >
                Race head-to-head on live Codeforces problems. Write, run, and test code in embedded Monaco IDE with instant local execution and real-time verdicts.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
              >
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-mono text-sm font-black bg-accent text-black px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(255,230,12,0.5)] transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        ⚡ GO TO DASHBOARD
                      </motion.button>
                    </Link>
                    <Link to="/race/find">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-mono text-sm font-bold bg-bg-elevated/90 border border-accent/50 text-accent px-6 py-3.5 rounded-xl hover:bg-accent/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        ⚔ FIND A RACE
                      </motion.button>
                    </Link>
                    <Link to="/practice">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-mono text-sm font-bold bg-bg-elevated/90 border border-border text-text-primary px-6 py-3.5 rounded-xl hover:border-accent hover:text-accent transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        🎯 SOLO PRACTICE
                      </motion.button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signup">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-mono text-sm font-black bg-accent text-black px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(255,230,12,0.5)] transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        ⚡ GET STARTED (FREE)
                      </motion.button>
                    </Link>
                    <Link to="/login">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-mono text-sm font-bold bg-bg-elevated/90 border border-accent/40 text-accent px-6 py-3.5 rounded-xl hover:bg-accent/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        🔑 SIGN IN
                      </motion.button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </section>

          {/* ── 2. Interactive Spotlight Live Race Simulator Card ──────────────── */}
          <section className="max-w-5xl mx-auto px-4 py-8">
            <SpotlightCard className="p-1">
              <div className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-2 font-mono text-xs text-accent font-black tracking-widest px-4 py-1.5 rounded-full bg-accent/15 border border-accent/40 shadow-[0_0_20px_rgba(255,230,12,0.25)]">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    LIVE 1V1 ESPORTS CLASH ARENA
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary">REAL-TIME MATCHUP PREVIEW</h2>
                </div>

                {/* Match Simulator Card */}
                <div className="bg-[#121217] border border-accent/30 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-center px-5 py-3 border-b border-border/80 bg-[#191922]">
                    <span className="font-mono text-text-dim text-xs font-bold">// MATCH 1892B · RATED LADDER</span>
                    <span className="font-mono text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-status-live rounded-full animate-ping" />
                      <span className="text-status-live font-extrabold">LIVE MATCH IN PROGRESS</span>
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 items-center">
                      {/* Left Competitor */}
                      <div className="sm:col-span-3 text-center bg-black/60 border border-accent/50 p-5 rounded-2xl space-y-2">
                        <p className="font-mono text-[10px] text-accent font-bold tracking-widest">// CHAMPION</p>
                        <h3 className="text-xl font-extrabold text-text-primary">ALICE_CODE</h3>
                        <p className="text-accent font-mono font-extrabold text-sm">1640 ELO (+24)</p>
                        <span className="inline-block font-mono text-xs text-status-live font-bold px-3 py-0.5 rounded-full bg-status-live/20 border border-status-live/40">
                          ✓ 2/2 SAMPLES AC
                        </span>
                      </div>

                      {/* VS Center Badge */}
                      <div className="sm:col-span-1 text-center py-2">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-accent text-black font-black text-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,230,12,0.5)]">
                          VS
                        </div>
                      </div>

                      {/* Right Competitor */}
                      <div className="sm:col-span-3 text-center bg-black/60 border border-cyan-400/40 p-5 rounded-2xl space-y-2">
                        <p className="font-mono text-[10px] text-cyan-400 font-bold tracking-widest">// CHALLENGER</p>
                        <h3 className="text-xl font-extrabold text-text-primary">BOB_DEV</h3>
                        <p className="text-cyan-400 font-mono font-extrabold text-sm">1610 ELO (-24)</p>
                        <span className="inline-block font-mono text-xs text-amber-300 font-bold px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 animate-pulse">
                          ⚡ RUNNING CODE...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-5 py-3 border-t border-border/80 bg-[#191922]">
                    <span className="font-mono text-text-dim text-xs font-bold">// MATCH CLOCK</span>
                    <span className="font-mono font-black text-accent text-sm tracking-wider">⏱ 14:32 REMAINING</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </section>

          {/* ── 3. Marquee Ticker ────────────────────────────────── */}
          <div className="border-y-2 border-accent/40 bg-black/80 backdrop-blur-2xl overflow-hidden py-5 relative shadow-[0_0_25px_rgba(255,230,12,0.2)]">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black via-black/80 to-transparent z-10" />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <span key={i} className="font-mono text-sm sm:text-base text-text-primary mx-8 tracking-wider font-black flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping shadow-[0_0_10px_#ffe60c]" />
                  {item} <span className="text-accent text-lg font-bold">⚡</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── 4. How It Works Grid ──────────────── */}
          <section className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-12 text-center tracking-tight text-text-primary">
              HOW A RACE PLAYS OUT
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, scale: 1.03 }}
                    className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 hover:border-accent hover:shadow-[0_10px_30px_rgba(255,230,12,0.2)] transition-all shadow-2xl group flex flex-col justify-between"
                  >
                    <div>
                      <div className={`mb-4 ${step.color} opacity-90 group-hover:opacity-100 transition-opacity`}>
                        <Icon />
                      </div>
                      <p className={`font-mono text-xs font-black mb-2 ${step.color}`}>{step.num}</p>
                      <h3 className="font-extrabold text-lg mb-3 text-text-primary">{step.title}</h3>
                      <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>



          {/* ── 5. CTA Section ───────────────────────────────── */}
          <section className="border-t border-accent/25 py-20 text-center px-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {isAuthenticated ? (
                <div className="max-w-md mx-auto space-y-4">
                  <span className="inline-block px-6 py-2.5 rounded-full bg-accent/20 border-2 border-accent/60 text-accent font-mono text-sm sm:text-base font-black shadow-[0_0_25px_rgba(255,230,12,0.4)] backdrop-blur-xl">
                    ⚡ ACTIVE SIGNED-IN SESSION
                  </span>

                  <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
                    PROCEED TO ARENA
                  </h2>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Signed in as <span className="text-accent font-mono font-bold">{user?.cf_handle || user?.display_name || user?.email}</span> ({user?.elo || 1200} ELO). Ready to climb the ladder?
                  </p>
                  <Link to="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4 font-mono text-sm font-black bg-accent text-black px-10 py-4 rounded-xl hover:shadow-[0_0_35px_rgba(255,230,12,0.6)] transition-all cursor-pointer shadow-2xl"
                    >
                      ⚡ PROCEED TO DASHBOARD ▸
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl sm:text-4xl font-black mb-4">
                    READY TO CLAIM YOUR ELO?
                  </h2>
                  <p className="text-text-muted mb-8 max-w-md mx-auto font-medium">
                    Sign up free, link your Codeforces handle, and jump straight into your first 1v1 match.
                  </p>
                  <Link to="/signup">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="font-mono text-sm font-black bg-accent text-black px-10 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(255,230,12,0.5)] transition-all cursor-pointer shadow-2xl"
                    >
                      GET STARTED (FREE) →
                    </motion.button>
                  </Link>
                </>
              )}
            </motion.div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
