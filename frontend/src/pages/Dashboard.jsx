import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getMe } from "../api/auth";
import { joinQueue } from "../api/races";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [matching, setMatching] = useState(false);
  const [waitMsg, setWaitMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => {
        if (!data.cf_handle) {
          navigate("/link-cf");
        } else {
          setUser(data);
        }
      })
      .catch(() => navigate("/login"));
  }, []);

  async function handleQuickMatch() {
    setMatching(true);
    setWaitMsg("Searching for an opponent...");
    try {
      const result = await joinQueue();
      if (result.status === "matched") {
        navigate(`/race/${result.race_id}`);
      } else {
        setWaitMsg("You're in queue — try again in a moment.");
        setMatching(false);
      }
    } catch (err) {
      setWaitMsg(err.message);
      setMatching(false);
    }
  }

  if (!user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono-display">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="mb-10">
          <p className="text-zinc-500 text-sm tracking-widest">// SIGNED IN</p>
          <h1 className="text-4xl font-extrabold text-yellow-400">{user.cf_handle || user.email}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-zinc-500 text-xs tracking-widest">ELO</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{user.elo}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-zinc-500 text-xs tracking-widest">RACES</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{user.races_played}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleQuickMatch}
          disabled={matching}
          className="w-full bg-yellow-400 text-black font-bold text-lg py-4 rounded-lg mb-2 disabled:opacity-50"
        >
          {matching ? "MATCHING..." : "⚔ QUICK MATCH"}
        </motion.button>
        {waitMsg && <p className="text-zinc-500 text-sm mb-4">{waitMsg}</p>}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/leaderboard")}
          className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-lg py-4 rounded-lg"
        >
          🏆 LEADERBOARD
        </motion.button>
      </motion.div>
    </div>
  );
}