import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getChallenge, joinChallenge } from "../api/challenges";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";

export default function JoinChallenge() {
  const { token } = useParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId = null;
    let retryCount = 0;

    async function fetchStatus() {
      try {
        const data = await getChallenge(token);
        setChallenge(data);
        setError("");
        setLoading(false);
        // If race is active, redirect both creator and joiner directly to race room
        if (data.status === "active" && data.race_id) {
          navigate(`/race/${data.race_id}`);
        }
      } catch (err) {
        console.warn("Challenge room fetch error:", err);
        retryCount++;
        // Only set hard error if it's a genuine 404 or after 3 retries
        if (retryCount >= 3 || (err.message && !err.message.includes("Failed to fetch"))) {
          setError(err.message || "Could not connect to challenge room.");
        }
        setLoading(false);
      }
    }

    fetchStatus();

    // Poll every 3 seconds for room updates (e.g. when opponent joins)
    intervalId = setInterval(fetchStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, navigate]);

  async function handleJoin() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setJoining(true);
    setError("");
    try {
      const data = await joinChallenge(token);
      navigate(`/race/${data.race_id}`);
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  }

  function handleDecline() {
    navigate("/dashboard");
  }

  if (loading || authLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="skeleton w-64 h-8 rounded" />
        </div>
      </PageLayout>
    );
  }

  if (error && !challenge) {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-2xl mb-4">⚔️</p>
          <h1 className="text-xl font-bold mb-2">Connecting to Challenge Room...</h1>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setError(""); setLoading(true); }}
              className="font-mono text-sm bg-accent text-black font-bold px-6 py-2.5 rounded cursor-pointer"
            >
              ↻ Retry Connection
            </button>
            <Link to="/dashboard">
              <button className="font-mono text-sm bg-bg-elevated border border-border text-text-primary px-6 py-2.5 rounded cursor-pointer">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }


  const isCreator = Boolean(
    user && challenge && (
      (user.id && challenge.creator_id && String(user.id).toLowerCase() === String(challenge.creator_id).toLowerCase()) ||
      (user.cf_handle && challenge.creator_handle && user.cf_handle.toLowerCase() === challenge.creator_handle.toLowerCase()) ||
      (user.display_name && challenge.creator_name && user.display_name.toLowerCase() === challenge.creator_name.toLowerCase())
    )
  );



  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors mb-8"
        >
          ← BACK TO DASHBOARD
        </Link>

        {isCreator ? (
          /* CREATOR LOBBY VIEW */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-bg-elevated border border-accent/40 rounded-lg flex items-center justify-center text-xl text-accent animate-pulse">
                ⚔️
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">CHALLENGE ROOM LOBBY</h1>
                <p className="text-text-muted text-xs font-mono mt-0.5">ROOM CREATOR VIEW</p>
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              {/* Radar pulse animation */}
              <div className="bg-bg-input/90 border border-accent/30 rounded-xl p-6 text-center space-y-4 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  WAITING FOR OPPONENT TO ARRIVE...
                </div>

                <div className="space-y-1">
                  <p className="font-mono text-xs text-text-dim tracking-widest">// SHARE THIS ROOM CODE</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="font-mono text-4xl font-extrabold text-accent tracking-widest">
                      {token}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(token);
                        toast.success(`Room Code '${token}' copied!`);
                      }}
                      className="font-mono text-xs bg-accent text-black font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      📋 COPY CODE
                    </button>
                  </div>
                </div>

                <p className="text-text-muted text-xs max-w-md mx-auto">
                  Send code <strong className="text-accent font-mono">{token}</strong> to your friend. As soon as they click Join, the race room will launch automatically for both of you!
                </p>
              </div>

              <div className="bg-bg-elevated border border-border/80 rounded-lg p-4 flex items-center justify-between text-xs font-mono">
                <span className="text-text-muted">Problem Rating: ~{challenge.problem_rating}</span>
                <span className="text-text-muted">Race Duration: 40 Min</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* OPPONENT JOIN VIEW */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 bg-bg-elevated border border-accent/40 rounded-lg flex items-center justify-center text-xl text-accent">
                ⚔️
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold">YOU'VE BEEN CHALLENGED</h1>
                <p className="text-text-muted text-sm mt-0.5">Accept to start a live 1v1 CodeClash race.</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="flex items-center gap-4 bg-bg-input/60 border border-border rounded-lg p-4">
                <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-2xl">
                  ⚔️
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-text-primary">
                    {challenge.creator_name || challenge.creator_handle}
                  </h3>
                  <p className="text-text-muted text-xs font-mono">
                    Elo {challenge.creator_elo} · Codeforces: @{challenge.creator_handle}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-bg-elevated border border-border/80 rounded-lg p-4 text-xs font-mono">
                <span className="text-text-muted">Problem Rating: ~{challenge.problem_rating}</span>
                <span className="text-text-muted">Duration: 40 Min</span>
              </div>

              {error && (
                <p className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex-1 font-mono text-sm font-bold bg-accent text-black py-3.5 rounded-lg glow-yellow-hover disabled:opacity-50 cursor-pointer"
                >
                  {joining ? "Entering Race Room…" : "⚔ ACCEPT & JOIN RACE ▸"}
                </motion.button>
                <button
                  onClick={handleDecline}
                  className="font-mono text-sm font-bold border border-border text-text-muted px-6 py-3.5 rounded-lg hover:border-text-muted transition-colors cursor-pointer"
                >
                  DECLINE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}

