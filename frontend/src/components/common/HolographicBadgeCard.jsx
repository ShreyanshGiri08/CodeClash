import { useState, useRef } from "react";
import { motion } from "framer-motion";
import SpotlightCard from "./SpotlightCard";

export default function HolographicBadgeCard({ badge, isUnlocked = true, progress = 100 }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rX = ((mouseY - height / 2) / height) * -20;
    const rY = ((mouseX - width / 2) / width) * 20;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformStyle: "preserve-3d" }}
      className="perspective-1000 cursor-pointer"
    >
      <SpotlightCard className={`rounded-2xl border p-6 transition-all duration-300 ${
        isUnlocked 
          ? "bg-black/90 border-accent/40 shadow-[0_0_25px_rgba(255,230,12,0.15)] hover:border-accent hover:shadow-[0_0_40px_rgba(255,230,12,0.3)]" 
          : "bg-black/60 border-border/60 opacity-60 grayscale hover:grayscale-0"
      }`}>
        {/* Holographic metallic shine sweep overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none duration-500" />

        <div className="relative z-10 space-y-4 text-center">
          {/* Badge Icon Container with Circular Progress Ring */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isUnlocked ? "text-accent" : "text-status-live"}
                strokeDasharray={`${progress}, 100`}
                strokeWidth="2.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-4xl shadow-inner">
              {badge.icon}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-base tracking-tight text-text-primary">{badge.name}</h3>
            <p className="font-mono text-xs text-text-muted">{badge.description}</p>
          </div>

          {/* Progress / Status Bar */}
          <div className="pt-2">
            <span className={`inline-block font-mono text-[10px] font-black px-3 py-1 rounded-full border ${
              isUnlocked 
                ? "bg-accent/20 text-accent border-accent/60 shadow-sm" 
                : "bg-bg-elevated text-text-dim border-border"
            }`}>
              {isUnlocked ? "UNLOCKED ✨" : `PROGRESS: ${progress}%`}
            </span>
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
