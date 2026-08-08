import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { joinQueue, leaveQueue } from "../api/races";

export default function FindRace() {
  const [status, setStatus] = useState("searching");
  const [elapsed, setElapsed] = useState(0);
  const navigate = useNavigate();
  const pollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    async function poll() {
      try {
        const res = await joinQueue();
        if (res.status === "matched") {
          clearInterval(timer);
          navigate(`/race/${res.race_id}`);
        } else {
          pollRef.current = setTimeout(poll, 3000);
        }
      } catch (e) {
        console.error(e);
      }
    }
    poll();

    return () => {
      clearInterval(timer);
      clearTimeout(pollRef.current);
      leaveQueue().catch(() => {});
    };
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono-display">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mb-8"
      />
      <p className="text-zinc-500 tracking-widest mb-2">// SCANNING FOR OPPONENT</p>
      <p className="text-4xl font-bold text-yellow-400">{mins}:{secs}</p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-10 text-zinc-500 underline"
      >
        Cancel
      </button>
    </div>
  );
}