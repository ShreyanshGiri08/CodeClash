import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSound } from "../../context/SoundContext";
import { motion, AnimatePresence } from "framer-motion";

const AVATARS = {
  avatar1: "⚡", avatar2: "🔥", avatar3: "💀", avatar4: "🎯",
  avatar5: "🚀", avatar6: "⚔️", avatar7: "🏆", avatar8: "💎",
  avatar9: "🐉", avatar10: "👾", avatar11: "🦊", avatar12: "🎮",
};

const NAV_LINKS = [
  { path: "/practice", label: "PRACTICE" },
  { path: "/analytics", label: "ANALYTICS" },
  { path: "/achievements", label: "BADGES" },
  { path: "/leaderboard", label: "LADDER" },
  { path: "/docs", label: "DOCS" },
];

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { muted, toggleMute } = useSound();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);





  // Minimal navbar for active race room
  if (location.pathname.startsWith("/race/") && location.pathname !== "/race/find" && !location.pathname.endsWith("/summary")) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-mono font-black text-base tracking-wider text-text-primary hover:text-accent transition-colors">
            CODECLASH <span className="text-accent text-xs">⚡ RACE</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Sound SFX Toggle */}
            <button
              onClick={toggleMute}
              data-sound="none"
              className={`px-3 py-1.5 rounded-full border transition-all text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm ${
                !muted
                  ? "bg-accent/20 border-accent/60 text-accent shadow-[0_0_12px_rgba(255,230,12,0.3)]"
                  : "bg-bg-elevated border-border text-text-dim hover:text-text-primary"
              }`}
              title={muted ? "Unmute Cyber SFX Sound" : "Mute Cyber SFX Sound"}
            >
              <span>{!muted ? "🔊" : "🔇"}</span>
              <span className="hidden sm:inline">{!muted ? "SFX ON" : "MUTED"}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-full bg-bg-elevated border border-border hover:border-accent text-text-primary transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
              <span>{theme === "dark" ? "LIGHT" : "DARK"}</span>
            </button>
          </div>
        </div>
      </nav>
    );
  }


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b border-border/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link to="/" className="group flex items-center gap-2 cursor-pointer">
          <span className="font-mono font-black text-lg tracking-wider text-text-primary group-hover:text-accent transition-colors">
            CODECLASH
          </span>
          <span className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#ffe60c]" />
        </Link>

        {/* Center: Desktop Navigation Links (Large, Bold, Clear) */}
        <div className="hidden md:flex items-center gap-6 font-mono text-sm font-black">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-all py-1 border-b-2 ${
                  active
                    ? "text-accent border-accent shadow-[0_4px_12px_rgba(255,230,12,0.3)]"
                    : "text-text-primary/80 border-transparent hover:text-accent hover:border-accent/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Sound SFX Toggle */}
          <button
            onClick={toggleMute}
            data-sound="none"
            className={`px-3 py-1.5 rounded-full border transition-all text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm ${
              !muted
                ? "bg-accent/20 border-accent/60 text-accent shadow-[0_0_12px_rgba(255,230,12,0.3)]"
                : "bg-bg-elevated border-border text-text-dim hover:text-text-primary"
            }`}
            title={muted ? "Unmute Cyber SFX Sound" : "Mute Cyber SFX Sound"}
          >
            <span>{!muted ? "🔊" : "🔇"}</span>
            <span className="hidden sm:inline">{!muted ? "SFX ON" : "MUTED"}</span>
          </button>



          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-full bg-bg-elevated border border-border hover:border-accent text-text-primary transition-all text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="hidden sm:inline">{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </button>


          {/* User Auth Profile or Sign In */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="font-mono text-xs font-black bg-accent/20 border border-accent/60 text-accent px-3.5 py-1.5 rounded-xl hover:bg-accent hover:text-black transition-all shadow-sm hidden sm:inline-block"
              >
                DASHBOARD
              </Link>
              <button
                onClick={() => navigate("/settings")}
                className="w-9 h-9 rounded-full bg-bg-elevated border border-accent/40 hover:border-accent transition-all flex items-center justify-center text-base cursor-pointer shadow-md"
                title={user?.cf_handle || user?.email}
              >
                {AVATARS[user?.avatar] || "⚡"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              <Link
                to="/login"
                className="text-text-primary hover:text-accent transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="bg-accent text-black px-4 py-2 rounded-xl font-black hover:scale-105 transition-all shadow-md"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-primary hover:text-accent text-xl p-1 cursor-pointer"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-2xl border-b border-accent/40 px-6 py-4 space-y-3 font-mono text-sm font-black"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-2 ${
                  location.pathname === link.path ? "text-accent" : "text-text-primary hover:text-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block text-accent py-2"
              >
                ⚡ DASHBOARD
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
