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
          className={`absolute font-mono text-xs font-black px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 ${item.color} shadow-[0_0_20px_rgba(255,255,255,0.08)]`}
        >
          {item.text}
        </motion.div>
      ))}

      {/* ── Floating Cyber Dust Particles ────────────────── */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          animate={{
            y: [0, -120],
            x: [0, (i % 2 === 0 ? 30 : -30)],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: 8 + (i % 5) * 2,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
          style={{
            left: `${(i * 7) % 95}%`,
            top: `${20 + (i * 6) % 70}%`,
          }}
          className={`absolute w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-accent shadow-[0_0_10px_#ffe60c]' : i % 3 === 1 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-purple-400 shadow-[0_0_10px_#c084fc]'}`}
        />
      ))}
    </div>
  );
}
