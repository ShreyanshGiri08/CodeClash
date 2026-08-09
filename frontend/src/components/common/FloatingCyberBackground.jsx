import { motion } from "framer-motion";

const CODE_SYMBOLS = [
  { text: "</>", x: "8%", y: "15%", duration: 18, delay: 0, color: "text-accent" },
  { text: "{ }", x: "85%", y: "22%", duration: 22, delay: 2, color: "text-status-live" },
  { text: "fn()", x: "12%", y: "75%", duration: 20, delay: 1, color: "text-purple-400" },
  { text: "O(N log N)", x: "78%", y: "80%", duration: 25, delay: 3, color: "text-cyan-400" },
  { text: "AC 100ms", x: "90%", y: "45%", duration: 21, delay: 4, color: "text-status-live" },
  { text: "Elo +24", x: "5%", y: "48%", duration: 19, delay: 2.5, color: "text-accent" },
  { text: "0101", x: "50%", y: "10%", duration: 24, delay: 5, color: "text-text-muted" },
  { text: "dp[i][j]", x: "70%", y: "60%", duration: 23, delay: 1.5, color: "text-purple-300" },
];

const ORBS = [
  { size: "w-72 h-72", color: "bg-purple-600/25", top: "-10%", left: "-5%", duration: 14 },
  { size: "w-96 h-96", color: "bg-cyan-500/25", bottom: "-15%", right: "-5%", duration: 18 },
  { size: "w-80 h-80", color: "bg-accent/20", top: "40%", left: "45%", duration: 12 },
  { size: "w-64 h-64", color: "bg-emerald-500/20", top: "70%", left: "10%", duration: 16 },
];

export default function FloatingCyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* ── Glowing Floating Cyber Orbs ─────────────────── */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.25, 1],
            x: [0, (i % 2 === 0 ? 40 : -40), 0],
            y: [0, (i % 2 === 0 ? -30 : 30), 0],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom }}
          className={`absolute ${orb.size} ${orb.color} rounded-full blur-[140px] pointer-events-none`}
        />
      ))}

      {/* ── Floating Glowing Code Symbols & Badges ──────── */}
      {CODE_SYMBOLS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            y: [0, -35, 0, 35, 0],
            x: [0, 20, 0, -20, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.25, 0.75, 0.35, 0.75, 0.25],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut",
          }}
          style={{ left: item.x, top: item.y }}
          className={`absolute font-mono text-xs sm:text-sm font-bold tracking-widest ${item.color} select-none pointer-events-none drop-shadow-[0_0_12px_rgba(255,230,12,0.3)] bg-bg-card/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5`}
        >
          {item.text}
        </motion.div>
      ))}

      {/* ── Cyber Neon Grid Overlay Lines ────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,230,12,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,230,12,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
