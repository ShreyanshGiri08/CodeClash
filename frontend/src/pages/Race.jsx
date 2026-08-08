import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getRace, checkRaceStatus, getProblem } from "../api/races";

export default function Race() {
  const { raceId } = useParams();
  const [race, setRace] = useState(null);
  const [problem, setProblem] = useState(null);

  useEffect(() => {
    getRace(raceId).then(setRace);
    getProblem(raceId).then(setProblem);

    const interval = setInterval(async () => {
      const updated = await checkRaceStatus(raceId);
      setRace(updated);
      if (updated.status === "finished") clearInterval(interval);
    }, 4000);

    return () => clearInterval(interval);
  }, [raceId]);

  if (!race) return <div className="min-h-screen bg-black" />;

  const finished = race.status === "finished";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono-display p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-6"
      >
        {problem && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-left text-sm max-h-72 overflow-y-auto">
            <h2 className="text-xl font-bold mb-2 text-yellow-400">{problem.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: problem.html }} />
            <a href={problem.url} target="_blank" rel="noreferrer" className="text-yellow-400 underline text-xs block mt-2">
              Open on Codeforces →
            </a>
          </div>
        )}

        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-800">
            <span className="text-zinc-500 text-sm">// RACE · {race.problem_id}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={finished ? "done" : "live"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={finished ? "text-zinc-400" : "text-blue-400"}
              >
                ● {finished ? "FINISHED" : "LIVE"}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="p-8 text-center">
            {!finished ? (
              <>
               <p className="text-zinc-500 tracking-widest mb-4">// JUDGING IN PROGRESS</p>
               <p className="text-zinc-400">Solve the problem on Codeforces and submit.</p>
              <p className="text-yellow-400 mt-2">Checking for a verdict every 4 seconds...</p>
              </>
            ) : (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <p className="text-3xl font-bold text-yellow-400 mb-2">🏆 RACE OVER</p>
                <p className="text-zinc-400">Winner: {race.winner_id}</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}