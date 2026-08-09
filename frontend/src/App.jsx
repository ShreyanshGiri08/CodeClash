import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SoundProvider } from "./context/SoundContext";
import { Toaster } from "react-hot-toast";



// Pages
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FindRace from "./pages/FindRace";
import Race from "./pages/Race";
import Challenge from "./pages/Challenge";
import JoinChallenge from "./pages/JoinChallenge";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import LinkCF from "./pages/LinkCF";
import Practice from "./pages/Practice";
import Analytics from "./pages/Analytics";
import MatchDetails from "./pages/MatchDetails";
import Badges from "./pages/Badges";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg-primary" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}


function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
        <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />

        <Route path="/practice" element={<Practice />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<Badges />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/challenge/:token" element={<JoinChallenge />} />

        {/* Protected Pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/race/find" element={<ProtectedRoute><FindRace /></ProtectedRoute>} />
        <Route path="/race/:raceId" element={<ProtectedRoute><Race /></ProtectedRoute>} />
        <Route path="/race/:raceId/summary" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
        <Route path="/challenge" element={<ProtectedRoute><Challenge /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/link-cf" element={<ProtectedRoute><LinkCF /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}





import CommandPalette from "./components/common/CommandPalette";

export default function App() {
  return (
    <ThemeProvider>
      <SoundProvider>
        <BrowserRouter>
          <AuthProvider>
            <CommandPalette />
            <AppRoutes />
            <Toaster


            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111116",
                color: "#e0e0d3",
                border: "1px solid rgba(224,224,211,0.12)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#111116" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#111116" },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </SoundProvider>
  </ThemeProvider>
  );
}