import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import { useAuth } from "../context/AuthContext";
import { getRaceHistory } from "../api/auth";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#94a3b8"];

export default function Analytics() {
  const { user } = useAuth();
  const [raceHistory, setRaceHistory] = useState([]);
  const [topicStats, setTopicStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaceHistory()
      .then((history) => {
        setRaceHistory(history || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Dynamic CF User Status Topic Scraper
    if (user?.cf_handle) {
      const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(user.cf_handle)}&from=1&count=60`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.status === "OK" && Array.isArray(data.result)) {
            const counts = {};
            const processedProblems = new Set();

            data.result.forEach((sub) => {
              if (sub.verdict === "OK" && sub.problem && Array.isArray(sub.problem.tags)) {
                const probId = `${sub.problem.contestId}${sub.problem.index}`;
                if (!processedProblems.has(probId)) {
                  processedProblems.add(probId);
                  sub.problem.tags.forEach((tag) => {
                    const lower = tag.toLowerCase();
                    counts[lower] = (counts[lower] || 0) + 1;
                  });
                }
              }
            });
            setTopicStats(counts);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const totalRaces = user?.races_played || raceHistory.length || 0;
  const totalWins = user?.races_won || raceHistory.filter((r) => r.result === "win").length || 0;
  const totalLosses = Math.max(0, totalRaces - totalWins);
  const winRate = totalRaces > 0 ? Math.round((totalWins / totalRaces) * 100) : 0;

  // Real Dynamic Radar Proficiency Engine (base skill + CF Solved Topic Bonus + Clash Wins)
  const baseSkill = Math.min(80, Math.max(30, Math.round((user?.elo || 1200) / 25)));

  const TOPIC_MAP = [
    { key: "implementation", name: "Implementation" },
    { key: "math", name: "Math" },
    { key: "greedy", name: "Greedy" },
    { key: "dp", name: "DP" },
    { key: "graphs", name: "Graphs" },
    { key: "strings", name: "Strings" },
  ];

  const radarData = TOPIC_MAP.map(({ key, name }) => {
    const cfSolved = topicStats[key] || 0;
    const raceWins = raceHistory.filter(
      (r) => r.result === "win" && r.problem?.tags?.some((t) => t.toLowerCase().includes(key))
    ).length;

    // Real dynamic skill formula: Base ELO Rating + CF Solved Multiplier + Match Win Multiplier
    const dynamicProficiency = Math.min(
      100,
      Math.max(25, baseSkill + cfSolved * 7 + raceWins * 12)
    );

    return {
      topic: name,
      proficiency: dynamicProficiency,
      cfSolved,
      raceWins,
    };
  });

  // Determine top proficiency topic
  const topTopic = [...radarData].sort((a, b) => b.proficiency - a.proficiency)[0]?.topic || "Implementation";

  const pieData = [
    { name: "Wins", value: totalWins },
    { name: "Losses", value: totalLosses },
  ];


  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-8">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold">
              📈 DYNAMIC ANALYTICS ENGINE
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              CLASH ANALYTICS & INSIGHTS
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Deep analytical breakdown of your topic proficiencies, win rates, and race performance statistics.
            </p>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 shadow-xl space-y-1">
              <p className="font-mono text-[11px] text-text-dim tracking-wider">// CURRENT RATING</p>
              <p className="font-mono text-3xl font-black text-accent">{user?.elo || 1200} ELO</p>
            </div>
            <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 shadow-xl space-y-1">
              <p className="font-mono text-[11px] text-text-dim tracking-wider">// TOTAL CLASHES</p>
              <p className="font-mono text-3xl font-black text-text-primary">{totalRaces}</p>
            </div>
            <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 shadow-xl space-y-1">
              <p className="font-mono text-[11px] text-text-dim tracking-wider">// WIN RATE</p>
              <p className="font-mono text-3xl font-black text-status-live">{winRate}%</p>
            </div>
            <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 shadow-xl space-y-1">
              <p className="font-mono text-[11px] text-text-dim tracking-wider">// TOP PROFICIENCY</p>
              <p className="font-mono text-xl font-black text-cyan-400">{topTopic}</p>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 6-Axis Radar Chart */}
            <div className="lg:col-span-7 bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <span className="font-mono text-xs text-accent font-bold tracking-widest">// RADAR PROFICIENCY</span>
                  <h3 className="text-base font-extrabold text-text-primary">Topic Skill Distribution</h3>
                </div>
                <span className="font-mono text-xs text-text-dim">Dynamic Calculation</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: "#e0e0d3", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" />
                    <Radar name="Proficiency" dataKey="proficiency" stroke="#ffe60c" fill="#ffe60c" fillOpacity={0.35} />
                    <Tooltip
                      contentStyle={{ background: "#111116", border: "1px solid #ffe60c", borderRadius: 8, fontSize: 12 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Outcome Pie Chart */}
            <div className="lg:col-span-5 bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-border/80 pb-3">
                <span className="font-mono text-xs text-accent font-bold tracking-widest">// RACE OUTCOMES</span>
                <h3 className="text-base font-extrabold text-text-primary">Win / Loss Breakdown</h3>
              </div>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#111116", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 font-mono text-xs">
                <span className="flex items-center gap-2 text-status-live font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-live" /> Wins ({totalWins})
                </span>
                <span className="flex items-center gap-2 text-status-error font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-error" /> Losses ({totalLosses})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
