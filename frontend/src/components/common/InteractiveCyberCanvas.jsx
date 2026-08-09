import { useEffect, useRef } from "react";

const CP_GLYPHS = ["cin >>", "std::sort", "AC", "O(N log N)", "1v1", "DP", "★", "ELO +24", "Accepted"];

export default function InteractiveCyberCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;

    let width = (canvas.width = window.innerWidth || 1200);
    let height = (canvas.height = window.innerHeight || 800);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 1200;
      height = canvas.height = window.innerHeight || 800;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000, radius: 140 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const particleCount = Math.min(Math.floor((width * height) / 22000), 50);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        color: i % 4 === 0 ? "#ffe60c" : i % 4 === 1 ? "#22c55e" : i % 4 === 2 ? "#a855f7" : "#06b6d4",
        glyph: i % 3 === 0 ? CP_GLYPHS[Math.floor(Math.random() * CP_GLYPHS.length)] : null,
      });
    }

    const render = () => {
      try {
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = "rgba(255, 230, 12, 0.03)";
        ctx.lineWidth = 0.5;
        const gridSize = 80;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Render particles safely
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (!p || isNaN(p.x) || isNaN(p.y)) continue;

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x += (dx / dist) * force * 3;
            p.y += (dy / dist) * force * 3;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.radius > 2 ? 8 : 0;
          ctx.shadowColor = p.color;
          ctx.fill();

          if (p.glyph) {
            ctx.font = "10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fillText(p.glyph, p.x + 8, p.y + 4);
          }

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            if (!p2 || isNaN(p2.x) || isNaN(p2.y)) continue;
            const lx = p.x - p2.x;
            const ly = p.y - p2.y;
            const ldist = Math.sqrt(lx * lx + ly * ly);

            if (ldist > 0 && ldist < 130) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              const alpha = (1 - ldist / 130) * 0.18;
              ctx.strokeStyle = `rgba(255, 230, 12, ${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      } catch (_) {
        // Suppress canvas errors silently
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
