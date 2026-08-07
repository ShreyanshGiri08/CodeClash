import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getMe } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => navigate("/login"));
  }, []);

  if (!user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono-display">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-zinc-500 text-sm tracking-widest">// SIGNED IN</p>
            <h1 className="text-4xl font-extrabold text-yellow-400">
              {user.cf_handle || user.email}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "ELO", value: user.elo },
            { label: "RACES", value: user.races_played },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
            >
              <p className="text-zinc-500 text-xs tracking-widest">{stat.label}</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/race/find")}
          className="w-full bg-yellow-400 text-black font-bold text-lg py-4 rounded-lg mb-4"
        >
          ⚔ QUICK MATCH
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/leaderboard")}
          className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-lg py-4 rounded-lg"
        >
          🏆 LEADERBOARD
        </motion.button>
      </motion.div>
    </div>
  );
}