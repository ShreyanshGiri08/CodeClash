import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getRace, checkRaceStatus, getProblem, getVerdicts, forfeitRace } from "../api/races";
import { useAuth } from "../context/AuthContext";
import { useSound } from "../context/SoundContext";
import PageLayout from "../components/layout/PageLayout";
import CyberMonacoEditor from "../components/editor/CyberMonacoEditor";
import toast from "react-hot-toast";



const AVATARS = {
  avatar1: "⚡", avatar2: "🔥", avatar3: "💀", avatar4: "🎯",
  avatar5: "🚀", avatar6: "⚔️", avatar7: "🏆", avatar8: "💎",
  avatar9: "🐉", avatar10: "👾", avatar11: "🦊", avatar12: "🎮",
};

const VERDICT_COLORS = {
  OK: "text-status-live",
  WRONG_ANSWER: "text-status-error",
  TIME_LIMIT_EXCEEDED: "text-status-warning",
  RUNTIME_ERROR: "text-status-error",
  COMPILATION_ERROR: "text-status-error",
  MEMORY_LIMIT_EXCEEDED: "text-status-warning",
};

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function cleanCFMath(html) {
  if (!html) return "";
  let clean = html;

  // 1. Daggers, stars & special superscript symbols
  clean = clean.replace(/\\\^\{\\dagger\}/g, "<sup>†</sup>");
  clean = clean.replace(/\^\{\\dagger\}/g, "<sup>†</sup>");
  clean = clean.replace(/\^\\dagger/g, "<sup>†</sup>");
  clean = clean.replace(/\\dagger/g, "†");
  clean = clean.replace(/\^\{\\ddagger\}/g, "<sup>‡</sup>");
  clean = clean.replace(/\\ddagger/g, "‡");
  clean = clean.replace(/\^\{\\star\}/g, "<sup>*</sup>");
  clean = clean.replace(/\\star/g, "*");

  // 2. Math operators & Greek letters
  clean = clean.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, "∑<sub>$1</sub><sup>$2</sup> ");
  clean = clean.replace(/\\sum_\{([^}]+)\}/g, "∑<sub>$1</sub> ");
  clean = clean.replace(/\\sum/g, "∑");

  clean = clean.replace(/\\max_\{([^}]+)\}\^\{([^}]+)\}/g, "max<sub>$1</sub><sup>$2</sup> ");
  clean = clean.replace(/\\max_\{([^}]+)\}/g, "max<sub>$1</sub> ");
  clean = clean.replace(/\\max/g, "max");

  clean = clean.replace(/\\min_\{([^}]+)\}\^\{([^}]+)\}/g, "min<sub>$1</sub><sup>$2</sup> ");
  clean = clean.replace(/\\min_\{([^}]+)\}/g, "min<sub>$1</sub> ");
  clean = clean.replace(/\\min/g, "min");

  clean = clean.replace(/\\cdot/g, "·");
  clean = clean.replace(/\\times/g, "×");
  clean = clean.replace(/\\rightarrow|\\to/g, "→");
  clean = clean.replace(/\\leftarrow/g, "←");
  clean = clean.replace(/\\Rightarrow/g, "⇒");
  clean = clean.replace(/\\Leftarrow/g, "⇐");
  clean = clean.replace(/\\gt/g, ">");
  clean = clean.replace(/\\ge/g, "≥");
  clean = clean.replace(/\\le/g, "≤");
  clean = clean.replace(/\\ne/g, "≠");
  clean = clean.replace(/\\dots/g, "...");
  clean = clean.replace(/\\infty/g, "∞");
  clean = clean.replace(/\\bmod/g, "mod");
  clean = clean.replace(/\\gcd/g, "gcd");

  // 3. Braces, parentheses & brackets
  clean = clean.replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  clean = clean.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")");
  clean = clean.replace(/\\left\[/g, "[").replace(/\\right\]/g, "]");

  // 4. Subscripts & Superscripts (e.g. p_i, p_j, a_i)
  clean = clean.replace(/([a-zA-Z0-9])_([a-zA-Z0-9])/g, "$1<sub>$2</sub>");
  clean = clean.replace(/([a-zA-Z0-9])_\{([^}]+)\}/g, "$1<sub>$2</sub>");

  // 5. Clean up Codeforces $$$math$$$ wrappers
  clean = clean.replace(/\$\$\$(.*?)\$\$\$/g, (match, inner) => {
    let content = inner.trim();
    // Arrays like [2,3,1,5,4]
    if (content.startsWith("[") && content.endsWith("]")) {
      return `<code class="font-mono text-amber-300 font-bold bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.5 rounded">${content}</code>`;
    }
    // Simple variable or math formula
    return `<span class="font-mono text-accent font-semibold px-1">${content}</span>`;
  });

  clean = clean.replace(/\$\$(.*?)\$\$/g, '<span class="font-mono text-accent font-semibold px-1">$1</span>');

  // 6. Add 1-click Copy buttons to Codeforces sample input and output boxes
  clean = clean.replace(
    /<div class="input">/g,
    '<div class="input relative group"><button onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'pre\').innerText); const btn=this; btn.innerText=\'✓ Copied!\'; setTimeout(() => btn.innerText=\'📋 Copy Input\', 1500);" class="absolute top-2 right-2 bg-accent/20 border border-accent/60 text-accent font-mono text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer hover:bg-accent hover:text-black transition-all shadow-md z-20">📋 Copy Input</button>'
  );

  clean = clean.replace(
    /<div class="output">/g,
    '<div class="output relative group"><button onclick="navigator.clipboard.writeText(this.parentElement.querySelector(\'pre\').innerText); const btn=this; btn.innerText=\'✓ Copied!\'; setTimeout(() => btn.innerText=\'📋 Copy Output\', 1500);" class="absolute top-2 right-2 bg-status-live/20 border border-status-live/60 text-status-live font-mono text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer hover:bg-status-live hover:text-black transition-all shadow-md z-20">📋 Copy Output</button>'
  );

  return clean;
}








const CP_QUOTES = [
  { quote: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { quote: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { quote: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
  { quote: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra" },
  { quote: "Speed + Accuracy = Victory. Solve fast, claim your Elo!", author: "CodeClash Legend" },
];



// Client-side CF scraper — used when backend scraping fails
function cleanLaTeX(html) {
  if (!html) return "";
  try {
    let clean = html
      .replace(/\\gt/g, ">")
      .replace(/\\lt/g, "<")
      .replace(/\\ge/g, "≥")
      .replace(/\\le/g, "≤")
      .replace(/\\dots/g, "...")
      .replace(/\\cdot/g, "·")
      .replace(/\\ne/g, "≠")
      .replace(/\\times/g, "×")
      .replace(/\\to/g, "→")
      .replace(/\\color\{[^}]*\}/g, "")
      .replace(/\\texttt\{([^}]*)\}/g, "$1")
      .replace(/\\text\{([^}]*)\}/g, "$1");

    clean = clean.replace(/\$\$\$(.*?)\$\$\$/g, '<code class="font-mono text-accent bg-accent/15 border border-accent/40 px-1.5 py-0.5 rounded text-xs font-bold">$1</code>');
    clean = clean.replace(/\$\$(.*?)\$\$/g, '<code class="font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded text-xs font-bold">$1</code>');
    clean = clean.replace(/\$(.*?)\$/g, '<code class="font-mono text-accent bg-accent/10 border border-accent/20 px-1 py-0.5 rounded text-xs">$1</code>');

    if (!clean.includes("📋 Copy Input")) {
      clean = clean.replace(
        /<div class="input">/g,
        `<div class="input relative group"><button onclick="try{const txt=this.parentElement.querySelector('pre').innerText; navigator.clipboard.writeText(txt); const b=this; b.innerText='✓ Copied!'; setTimeout(()=>b.innerText='📋 Copy Input', 1500);}catch(_){}" style="position:absolute; top:6px; right:6px; z-index:20;" class="bg-accent/20 hover:bg-accent hover:text-black border border-accent/60 text-accent font-mono text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-md">📋 Copy Input</button>`
      );
    }

    if (!clean.includes("📋 Copy Output")) {
      clean = clean.replace(
        /<div class="output">/g,
        `<div class="output relative group"><button onclick="try{const txt=this.parentElement.querySelector('pre').innerText; navigator.clipboard.writeText(txt); const b=this; b.innerText='✓ Copied!'; setTimeout(()=>b.innerText='📋 Copy Output', 1500);}catch(_){}" style="position:absolute; top:6px; right:6px; z-index:20;" class="bg-status-live/20 hover:bg-status-live hover:text-black border border-status-live/60 text-status-live font-mono text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-md">📋 Copy Output</button>`
      );
    }

    return clean;

  } catch (e) {
    return html;
  }
}


async function fetchCFStatementClientSide(contestId, index) {
  // 1. Try backend statement scraper first (fastest & zero CORS restrictions)
  try {
    const backendData = await apiCall(`/cf/problem-statement/${contestId}/${index}`).catch(() => null);
    if (backendData && backendData.html) {
      return cleanLaTeX(backendData.html);
    }
  } catch (_) { }

  // 2. Client-side CORS proxies fetching mobile & desktop Codeforces HTML in English
  const desktopUrl = `https://codeforces.com/contest/${contestId}/problem/${index}?locale=en`;
  const mobileUrl = `https://m.codeforces.com/contest/${contestId}/problem/${index}?locale=en`;

  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(desktopUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(mobileUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(desktopUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(mobileUrl)}`,
  ];


  for (const pUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(pUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);
      if (!resp || !resp.ok) continue;

      let html = await resp.text();
      if (!html || html.length < 50) continue;

      if (html.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(html);
          if (parsed && parsed.contents) html = parsed.contents;
        } catch (_) { }
      }

      if (!html || html.length < 100) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const stDiv =
        doc.querySelector(".problem-statement") ||
        doc.querySelector(".problemstatement") ||
        doc.querySelector(".ttypography") ||
        doc.querySelector(".sample-tests");

      if (stDiv) {
        stDiv.querySelectorAll("img").forEach((img) => {
          const rawSrc = img.getAttribute("src") || "";
          if (rawSrc && !rawSrc.startsWith("http")) {
            if (rawSrc.startsWith("/")) {
              img.src = "https://codeforces.com" + rawSrc;
            } else {
              img.src = "https://codeforces.com/" + rawSrc;
            }
          }
        });

        const hdr = stDiv.querySelector(".header");
        if (hdr) hdr.remove();
        return cleanLaTeX(stDiv.innerHTML);
      }
    } catch (_) { }
  }


  return null;
}



export default function Race() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const { playVictory, playSadness } = useSound();

  const [race, setRace] = useState(null);
  const [problem, setProblem] = useState(null);
  const [clientHtml, setClientHtml] = useState(null);  // client-side scraped HTML
  const [clientScraping, setClientScraping] = useState(false);
  const [verdicts, setVerdicts] = useState({ player1: [], player2: [] });
  const [elapsed, setElapsed] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [forfeiting, setForfeiting] = useState(false);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const RACE_DURATION = 40 * 60; // 40 minutes

  useEffect(() => {
    // Cycle CP quotes every 5 seconds while loading
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % CP_QUOTES.length);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, []);

  const [wsConnected, setWsConnected] = useState(false);
  const [opponentChecking, setOpponentChecking] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    getRace(raceId).then((r) => {
      if (r && r.id) {
        setRace(r);
        if (r.status === "finished") setShowResult(true);
      }
    }).catch((err) => {
      console.error("Failed to load race:", err);
    });
    getProblem(raceId).then((p) => {
      if (p) setProblem(p);
    }).catch(() => { });

    // WebSocket real-time connection setup
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const rawWsUrl = import.meta.env.VITE_WS_URL || "wss://codeclash-hmgz.onrender.com";
    const hostOnly = rawWsUrl.replace(/^wss?:\/\//, "").replace(/\/+$/, "");
    const wsUrl = `${wsProtocol}//${hostOnly}/races/ws/${raceId}`;


    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Send heartbeat ping every 25s
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
        ws.pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "RACE_UPDATE" && data.race) {
            setRace(data.race);
            if (data.race.status === "finished") {
              clearInterval(timerRef.current);
              clearTimeout(pollRef.current);
              setShowResult(true);
            }
          } else if (data.type === "OPPONENT_CHECKING") {
            if (user && data.user_id !== user.id) {
              setOpponentChecking(true);
              toast("⚔ Opponent is checking their submission on Codeforces!", { icon: "⚡" });
              setTimeout(() => setOpponentChecking(false), 4000);
            }
          }
        } catch (e) { }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (ws.pingInterval) clearInterval(ws.pingInterval);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      setWsConnected(false);
    }


    // Start timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Poll verdicts & check race status every 5 seconds (serves as resilient fallback)
    let checkCounter = 0;
    async function pollVerdicts() {
      try {
        const v = await getVerdicts(raceId);
        if (v && Array.isArray(v.player1) && Array.isArray(v.player2)) {
          setVerdicts(v);
        }
        checkCounter++;
        // Automatically trigger backend check every 2 polls (10s) if WS disconnected or backup check
        if (checkCounter % 2 === 0) {
          const updated = await checkRaceStatus(raceId);
          if (updated && updated.id) {
            setRace(updated);
            if (updated.status === "finished") {
              clearInterval(timerRef.current);
              clearTimeout(pollRef.current);
              if (updated.winner_id === user?.id) {
                playVictory();
              } else {
                playSadness();
              }

              setShowResult(true);
              return;
            }


          }
        }
      } catch (e) { /* ignore */ }
      pollRef.current = setTimeout(pollVerdicts, 5000);
    }

    pollVerdicts();

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pollRef.current);
      if (wsRef.current) {
        if (wsRef.current.pingInterval) clearInterval(wsRef.current.pingInterval);
        wsRef.current.close();
      }
    };
  }, [raceId, user]);


  // When backend scraping fails, try client-side scraping via CORS proxy
  useEffect(() => {
    if (problem && !problem.is_valid && !clientHtml && !clientScraping) {
      let i = 0;
      const pid = problem.url?.match(/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);
      if (pid) {
        setClientScraping(true);
        fetchCFStatementClientSide(pid[1], pid[2]).then((html) => {
          if (html) setClientHtml(html);
        }).finally(() => setClientScraping(false));
      }
    }
  }, [problem]);

  // Calculate real elapsed from race start in UTC
  let realElapsed = elapsed;
  const raceDurationSeconds = race?.duration_minutes ? race.duration_minutes * 60 : (40 * 60);

  if (race?.started_at) {
    const rawIso = String(race.started_at);
    const isoString = (rawIso.endsWith("Z") || rawIso.includes("+")) ? rawIso : (rawIso + "Z");
    const startedTime = new Date(isoString).getTime();
    if (!isNaN(startedTime)) {
      let endTime = Date.now();
      if (race?.ended_at) {
        const endIso = String(race.ended_at);
        const endIsoString = (endIso.endsWith("Z") || endIso.includes("+")) ? endIso : (endIso + "Z");
        const parsedEndTime = new Date(endIsoString).getTime();
        if (!isNaN(parsedEndTime)) endTime = parsedEndTime;
      }
      const diff = Math.floor((endTime - startedTime) / 1000);
      realElapsed = Math.max(0, diff);
    }
  }

  const remaining = Math.max(0, raceDurationSeconds - realElapsed);
  const finished = race?.status === "finished" || remaining <= 0;

  // Freeze elapsed timer once finished or expired (do not count infinitely past match duration)
  if (finished) {
    realElapsed = Math.min(realElapsed, raceDurationSeconds);
  }




  // Determine which player is "me"
  const isP1 = user && race && user.id === race.player1_id;

  async function handleCheckNow() {
    if (checking) return;
    setChecking(true);
    setCheckError(null);

    let secondsLeft = 12;
    const toastId = toast.loading(`Searching Codeforces for your submission... (${secondsLeft}s)`);

    const timerInterval = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 3);
      if (secondsLeft > 0) {
        toast.loading(`Searching Codeforces for your submission... (${secondsLeft}s)`, { id: toastId });
      } else {
        toast.loading(`Finalizing search on Codeforces...`, { id: toastId });
      }
    }, 3000);

    let foundAccepted = false;

    try {
      // 4 attempts (12 seconds max duration)
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const updated = await checkRaceStatus(raceId).catch(() => null);
          if (updated && updated.id) {
            setRace(updated);
            if (updated.status === "finished") {
              foundAccepted = true;
              setShowResult(true);
              break;
            }
          }
          const v = await getVerdicts(raceId).catch(() => null);
          if (v && Array.isArray(v.player1)) setVerdicts(v);
        } catch (_) {
          /* continue searching */
        }
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
    } finally {
      clearInterval(timerInterval);
      toast.dismiss(toastId);
      setChecking(false);
    }

    if (foundAccepted) {
      setCheckError(null);
      toast.success("🎉 Accepted submission detected! Victory!", { duration: 6000 });
    } else {
      const msg = "Oops! Couldn't find an Accepted (AC) submission on Codeforces yet. Make sure you submitted under your handle and try again!";
      setCheckError(msg);
      toast.error(msg, { duration: 7000 });
    }
  }




  async function handleForfeit() {
    if (!window.confirm("Are you sure you want to forfeit? Your opponent will win.")) return;
    setForfeiting(true);
    try {
      const updated = await forfeitRace(raceId);
      setRace(updated);
      setShowResult(true);
      clearInterval(timerRef.current);
      clearTimeout(pollRef.current);
      toast.error("You forfeited the race.");
    } catch (e) {
      toast.error(e.message || "Failed to forfeit");
    }
    setForfeiting(false);
  }


  if (!race) {
    return (
      <PageLayout hideFooter>
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4 px-4 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-accent font-bold animate-pulse">Initializing Race Room...</p>
        </div>
      </PageLayout>
    );
  }

  // Parse problem for CF link
  const problemId = race.problem_id;
  let cfContestId = "", cfIndex = "";
  if (problemId) {
    let i = 0;
    while (i < problemId.length && problemId[i] >= "0" && problemId[i] <= "9") i++;
    cfContestId = problemId.substring(0, i);
    cfIndex = problemId.substring(i);
  }

  const currentQuote = CP_QUOTES[quoteIndex];

  return (
    <PageLayout hideFooter>
      {/* Background Cyber Coder Setup Wallpaper Layer with Glassglow & Motion */}
      <div className="relative min-h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
        {/* Animated Neon Aura Motion Spheres */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-purple-600/30 rounded-full blur-[130px] pointer-events-none"
        />

        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            x: [0, -60, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -right-24 w-[550px] h-[550px] bg-cyan-500/35 rounded-full blur-[150px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-accent/20 rounded-full blur-[170px] pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55 pointer-events-none" />


        <div className="relative max-w-7xl mx-auto px-4 py-4 z-10">

          <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-6.5rem)]">

            {/* ── Left: Race Clock & Problem Statement Panel ──────────────── */}
            <div className="lg:w-[45%] flex flex-col gap-4">

              {/* Race Clock + Matchup Header */}
              <div className="bg-bg-card/90 backdrop-blur-2xl border border-border/80 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center px-5 py-3 bg-bg-elevated/70 border-b border-border/80">
                  <span className="font-mono text-xs font-bold text-text-dim tracking-wider">// RACE CLOCK & MATCHUP</span>
                  <span className="font-mono text-xs flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${finished ? "bg-text-muted" : "bg-status-live animate-pulse"}`} />
                    <span className={`font-extrabold ${finished ? "text-text-muted" : "text-status-live"}`}>
                      {finished ? "FINISHED" : "MATCH IN PROGRESS"}
                    </span>
                  </span>
                </div>

                <div className="p-5">
                  {/* Digital Clock display */}
                  <div className="flex items-center justify-between bg-bg-input/70 border border-border/60 p-4 rounded-xl shadow-inner">
                    <div>
                      <p className="font-mono text-xs text-text-dim mb-1 font-bold">⏱ REMAINING TIME</p>
                      <p className="font-mono text-4xl sm:text-5xl font-black text-text-primary tracking-tight">
                        {finished ? "00:00" : formatTime(remaining)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-text-dim mb-1 font-bold">ELAPSED</p>
                      <p className="font-mono text-xl font-bold text-accent">
                        {formatTime(race.duration_seconds - remaining)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Statement Glass Panel */}
              <div className="bg-black/80 backdrop-blur-2xl border border-accent/40 rounded-2xl overflow-hidden flex flex-col min-h-[580px] shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex-1">
                <div className="px-5 py-3.5 bg-bg-elevated/80 border-b border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                    <span className="font-mono text-xs font-extrabold text-accent tracking-wider">// PROBLEM STATEMENT</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${wsConnected ? 'bg-status-live/15 border-status-live/40 text-status-live' : 'bg-status-warning/15 border-status-warning/40 text-status-warning'}`}>
                      {wsConnected ? '⚡ WS LIVE' : '📡 POLLING'}
                    </span>
                  </div>
                  {problem?.url && (
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs bg-accent text-black font-extrabold px-3 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(255,230,12,0.5)] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      ↗ CODEFORCES LINK
                    </a>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar min-h-[750px] max-h-[900px]">
                  {problem ? (
                    (problem.is_valid || clientHtml) ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 mb-5">
                          <h2 className="text-xl font-extrabold text-accent tracking-tight">{problem.title}</h2>
                          <span className="font-mono text-xs px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent font-extrabold shadow-sm">
                            {cfContestId}{cfIndex}
                          </span>
                        </div>
                        <div
                          className="problem-statement text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: cleanCFMath(problem.is_valid ? problem.html : clientHtml) }}
                        />
                      </motion.div>
                    ) : clientScraping ? (
                      <div className="py-12 space-y-5 text-center">
                        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="font-mono text-xs text-accent font-bold animate-pulse">// FETCHING PROBLEM STATEMENT...</p>
                        <p className="text-text-dim text-xs">Connecting to Codeforces via proxy...</p>
                      </div>
                    ) : (
                      <div className="w-full min-h-[750px] flex flex-col rounded-xl overflow-hidden border border-accent/40 shadow-2xl bg-black/60">
                        <div className="bg-black/90 px-4 py-2.5 flex items-center justify-between border-b border-accent/30">
                          <span className="font-mono text-xs text-accent font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                            ⚡ DIRECT CODECLASH EMBEDDED READER
                          </span>
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] bg-accent/20 hover:bg-accent hover:text-black border border-accent/40 text-accent font-bold px-2.5 py-1 rounded transition-all"
                          >
                            ↗ Open on Codeforces
                          </a>
                        </div>
                        <iframe
                          src={`https://r.jina.ai/https://codeforces.com/contest/${cfContestId}/problem/${cfIndex}?locale=en`}
                          className="w-full h-[750px] bg-[#14141e] text-text-primary rounded-b-xl border-none p-2"
                          title="Codeforces Problem Statement"
                        />


                      </div>
                    )


                  ) : (
                    <div className="py-8 space-y-6 text-center">
                      <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                      <div className="p-6 rounded-2xl bg-bg-elevated/60 border border-accent/30 shadow-inner max-w-md mx-auto space-y-2">
                        <p className="font-mono text-xs text-accent font-bold tracking-widest">// CP WISDOM</p>
                        <p className="text-text-primary text-sm font-medium italic leading-relaxed">
                          "{currentQuote.quote}"
                        </p>
                        <p className="text-text-dim text-xs font-mono font-bold">— {currentQuote.author}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: Massive 750px Monaco Code Studio & Race Actions ──────────────── */}
            <div className="lg:w-[55%] flex flex-col gap-4">

              {/* TOP ACTION BAR */}
              {!finished && (
                <div className="bg-bg-card/95 backdrop-blur-2xl border border-accent/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(255,230,12,0.1)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-text-dim px-1">
                    <span className="flex items-center gap-1.5 text-accent">
                      <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      RACE ACTIONS
                    </span>
                    <button
                      onClick={handleForfeit}
                      disabled={forfeiting}
                      className="text-status-error/80 hover:text-status-error hover:underline transition-all cursor-pointer font-normal text-[11px]"
                    >
                      🏳 Forfeit Match
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://codeforces.com/contest/${cfContestId}/problem/${cfIndex}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full"
                    >
                      <button className="w-full font-mono text-xs font-black bg-accent text-black py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(255,230,12,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                        ↗ SUBMIT SOLUTION ON CF
                      </button>
                    </a>

                    <button
                      onClick={handleCheckNow}
                      disabled={checking}
                      className="w-full font-mono text-xs font-extrabold bg-bg-elevated/90 border border-accent/50 text-accent py-3.5 rounded-xl hover:bg-accent/15 hover:border-accent hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg"
                    >
                      {checking ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          SEARCHING SUBMISSION...
                        </>
                      ) : (
                        <>✓ I SUBMITTED, CHECK NOW</>
                      )}
                    </button>

                    {checkError && (
                      <div className="p-3.5 rounded-xl bg-status-error/15 border border-status-error/60 text-status-error font-mono text-[11px] space-y-1 shadow-lg animate-pulse col-span-1 sm:col-span-2">
                        <p className="font-extrabold flex items-center gap-1.5 text-xs">
                          <span>⚠️</span> SUBMISSION NOT DETECTED YET
                        </p>
                        <p className="leading-relaxed opacity-95">{checkError}</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              <div className="flex-1 min-h-[620px] flex flex-col">
                <CyberMonacoEditor />
              </div>

              {/* Full-Width Live Submission Stream Panel */}
              <div className="bg-black/80 backdrop-blur-2xl border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="flex justify-between items-center px-5 py-3 bg-bg-elevated/70 border-b border-border/80">
                  <span className="font-mono text-xs font-bold text-text-dim tracking-wider">// LIVE SUBMISSION STREAM</span>
                  <span className="font-mono text-xs text-status-live flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-status-live animate-ping" />
                    WATCHING CODEFORCES
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-4">
                  {/* My submissions */}
                  <div>
                    <p className="font-mono text-[11px] font-extrabold text-accent mb-2 tracking-wider flex items-center gap-1.5">
                      <span>⚡</span> YOUR SUBMISSIONS
                    </p>
                    {((isP1 ? verdicts?.player1 : verdicts?.player2) || []).length === 0 ? (
                      <div className="p-3 rounded-xl bg-bg-input/40 border border-border/40 text-text-dim text-xs font-mono">
                        No submissions recorded yet. Submit on Codeforces!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {((isP1 ? verdicts?.player1 : verdicts?.player2) || []).map((v, i) => (
                          <div key={i} className="flex items-center justify-between bg-bg-elevated/80 border border-border/60 rounded-xl px-4 py-2 font-mono text-xs shadow-sm">
                            <span className={`font-bold ${VERDICT_COLORS[v.verdict] || "text-text-muted"}`}>
                              {v.verdict === "OK" ? "✓ ACCEPTED" : v.verdict}
                            </span>
                            <span className="text-text-dim">{v.language}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Opponent submissions */}
                  <div>
                    <p className="font-mono text-[11px] font-extrabold text-status-error mb-2 tracking-wider flex items-center gap-1.5">
                      <span>⚔️</span> OPPONENT SUBMISSIONS
                    </p>
                    {((isP1 ? verdicts?.player2 : verdicts?.player1) || []).length === 0 ? (
                      <div className="p-3 rounded-xl bg-bg-input/40 border border-border/40 text-text-dim text-xs font-mono">
                        No submissions recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {((isP1 ? verdicts?.player2 : verdicts?.player1) || []).map((v, i) => (
                          <div key={i} className="flex items-center justify-between bg-bg-elevated/80 border border-border/60 rounded-xl px-4 py-2 font-mono text-xs shadow-sm">
                            <span className={`font-bold ${VERDICT_COLORS[v.verdict] || "text-text-muted"}`}>
                              {v.verdict === "OK" ? "✓ ACCEPTED" : v.verdict}
                            </span>
                            <span className="text-text-dim">{v.language}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Victory / Result Screen Modal */}
              <AnimatePresence>
                {showResult && finished && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-bg-card/95 backdrop-blur-2xl border-2 border-accent rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,230,12,0.2)]"
                  >
                    <div className="flex justify-between items-center px-5 py-3.5 bg-accent/10 border-b border-accent/30">
                      <span className="font-mono text-xs font-black text-accent tracking-wider">// RACE MATCH RESULT</span>
                      <span className="text-lg">🏆</span>
                    </div>
                    <div className="p-6 text-center">
                      <span className={`inline-block font-mono text-base font-black px-6 py-2 rounded-xl mb-4 shadow-lg ${race.winner_id === user?.id
                          ? "bg-status-live text-black font-extrabold shadow-status-live/30"
                          : race.winner_id
                            ? "bg-status-error text-white font-extrabold shadow-status-error/30"
                            : "bg-status-warning text-black font-extrabold shadow-status-warning/30"
                        }`}>
                        {race.winner_id === user?.id
                          ? "🎉 VICTORY!"
                          : race.winner_id
                            ? "💀 DEFEAT"
                            : "⏱ TIME EXPIRED — DRAW"}
                      </span>

                      {!race.winner_id && (
                        <p className="text-text-muted text-xs mb-4">
                          Neither player submitted an Accepted solution within the 40-minute limit.
                        </p>
                      )}

                      <div className="flex items-center justify-center gap-10 mt-5 p-4 rounded-xl bg-bg-elevated/70 border border-border/60">
                        <div className="text-center">
                          <p className="text-sm font-extrabold text-text-primary">{isP1 ? race.player1_handle : race.player2_handle}</p>
                          <p className={`font-mono text-xl font-extrabold ${(isP1 ? (race.p1_elo_after - race.p1_elo_before) : (race.p2_elo_after - race.p2_elo_before)) > 0
                              ? "text-status-live" : (race.p1_elo_after === race.p1_elo_before ? "text-text-muted" : "text-status-error")
                            }`}>
                            {isP1
                              ? (race.p1_elo_after && race.p1_elo_before ? `${race.p1_elo_after - race.p1_elo_before > 0 ? "+" : ""}${race.p1_elo_after - race.p1_elo_before}` : "+0")
                              : (race.p2_elo_after && race.p2_elo_before ? `${race.p2_elo_after - race.p2_elo_before > 0 ? "+" : ""}${race.p2_elo_after - race.p2_elo_before}` : "+0")
                            }
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-extrabold text-text-primary">{isP1 ? race.player2_handle : race.player1_handle}</p>
                          <p className={`font-mono text-xl font-extrabold ${(isP1 ? (race.p2_elo_after - race.p1_elo_before) : (race.p1_elo_after - race.p1_elo_before)) > 0
                              ? "text-status-live" : (race.p1_elo_after === race.p1_elo_before ? "text-text-muted" : "text-status-error")
                            }`}>
                            {isP1
                              ? (race.p2_elo_after && race.p2_elo_before ? `${race.p2_elo_after - race.p2_elo_before > 0 ? "+" : ""}${race.p2_elo_after - race.p2_elo_before}` : "+0")
                              : (race.p1_elo_after && race.p1_elo_before ? `${race.p1_elo_after - race.p1_elo_before > 0 ? "+" : ""}${race.p1_elo_after - race.p1_elo_before}` : "+0")
                            }
                          </p>
                        </div>
                      </div>

                      <Link to="/dashboard">
                        <button className="mt-6 font-mono text-sm bg-accent text-black font-extrabold px-8 py-3 rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(255,230,12,0.4)] transition-all cursor-pointer">
                          Back to Dashboard
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
}