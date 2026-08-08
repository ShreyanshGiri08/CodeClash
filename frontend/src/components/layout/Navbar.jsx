import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";

const AVATARS = {
  avatar1: "⚡", avatar2: "🔥", avatar3: "💀", avatar4: "🎯",
  avatar5: "🚀", avatar6: "⚔️", avatar7: "🏆", avatar8: "💎",
  avatar9: "🐉", avatar10: "👾", avatar11: "🦊", avatar12: "🎮",
};

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();


  // Extract route label from pathname
  const routeLabels = {
    "/": "HOME",
    "/dashboard": "DASHBOARD",
    "/race/find": "QUEUE",
    "/leaderboard": "LADDER",
    "/settings": "SETTINGS",
    "/challenge": "CHALLENGE",
    "/signup": "AUTH",
    "/login": "AUTH",
    "/link-cf": "SETTINGS",
  };

  const currentRoute = Object.entries(routeLabels).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  const routeLabel = currentRoute ? currentRoute[1] : "ROUTE";

  // Check if on a race page
  if (location.pathname.startsWith("/race/") && location.pathname !== "/race/find") {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-mono font-bold text-sm tracking-wider text-text-primary hover:text-accent transition-colors">
            CODECLASH
          </Link>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-full bg-bg-elevated/90 border border-border hover:border-accent text-text-primary transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="hidden sm:inline">{theme === "dark" ? "LIGHT" : "DARK"}</span>
            </motion.button>
            <span className="font-mono text-text-dim text-xs">// RACE</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 cursor-pointer">
          <span className="font-mono font-bold text-sm tracking-wider text-text-primary group-hover:text-accent transition-colors">
            CODECLASH
          </span>
          <span className="w-6 h-0.5 bg-accent rounded-full" />
        </Link>


        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="px-2.5 py-1 rounded-full bg-bg-elevated/90 border border-border hover:border-accent text-text-primary transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="hidden sm:inline">{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </motion.button>

          <span className="font-mono text-text-dim text-xs hidden sm:block">
            // {routeLabel}
          </span>


          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/leaderboard"
                className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors hidden sm:block"
              >
                Ladder
              </Link>
              <button
                onClick={() => navigate("/settings")}
                className="w-8 h-8 rounded-full bg-bg-elevated border border-border hover:border-accent transition-colors flex items-center justify-center text-sm cursor-pointer"
                title={user?.cf_handle || user?.email}
              >
                {AVATARS[user?.avatar] || "⚡"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/signup"
                  className="font-mono text-xs border border-accent text-accent px-3 py-1.5 rounded hover:bg-accent hover:text-black transition-all"
                >
                  Sign up
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
