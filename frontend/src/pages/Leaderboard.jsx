import { useEffect, useState } from "react";
import { apiCall } from "../api/client";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    apiCall("/leaderboard").then(setPlayers);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono-display">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">THE LADDER</h1>
      <table className="w-full text-left">
        <thead className="text-zinc-500 text-sm border-b border-zinc-800">
          <tr><th className="py-2">RANK</th><th>PLAYER</th><th>ELO</th><th>RACES</th></tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.cf_handle} className="border-b border-zinc-900">
              <td className="py-3">{i + 1}</td>
              <td>{p.cf_handle}</td>
              <td className="text-yellow-400 font-bold">{p.elo}</td>
              <td className="text-zinc-500">{p.races_played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}