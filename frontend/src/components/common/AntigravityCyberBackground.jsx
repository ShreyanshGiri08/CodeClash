import { motion } from "framer-motion";

export default function AntigravityCyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#07070b]">
      {/* ── Futuristic Cyber Grid Mesh Line Layer ─────────────── */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 230, 12, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 230, 12, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 100%)",
        }}
      />

      {/* ── Ambient Neon Motion Orbs ──────────────────────────── */}
      <motion.div
        animate={{
          scale: [1, 1.35, 1],
          x: [0, 60, 0],
          y: [0, -50, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          x: [0, -70, 0],
          y: [0, 70, 0],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-cyan-500/30 rounded-full blur-[170px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-accent/15 rounded-full blur-[180px]"
      />

      {/* ── Floating Interactive Antigravity Nodes ───────────── */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={`node-${i}`}
          animate={{
            y: [0, -140, 0],
            x: [0, (i % 2 === 0 ? 45 : -45), 0],
            rotate: [0, 180, 360],
            opacity: [0.2, 0.75, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 10 + (i % 6) * 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
          style={{
            left: `${(i * 5.8) % 94}%`,
            top: `${15 + (i * 7) % 75}%`,
          }}
          className={`absolute flex items-center justify-center font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
            i % 4 === 0
              ? "bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(255,230,12,0.3)]"
              : i % 4 === 1
              ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              : i % 4 === 2
              ? "bg-purple-600/10 border-purple-400/40 text-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.3)]"
              : "bg-emerald-500/10 border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          }`}
        >
          {i % 4 === 0 ? "◆ ELO" : i % 4 === 1 ? "▲ 1v1" : i % 4 === 2 ? "⬡ SPEED" : "● AC"}
        </motion.div>
      ))}

      {/* Radial Dark Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
    </div>
  );
}
