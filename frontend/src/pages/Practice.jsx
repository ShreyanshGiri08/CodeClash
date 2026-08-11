import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import AntigravityCyberBackground from "../components/common/AntigravityCyberBackground";
import toast from "react-hot-toast";
import { useSound } from "../context/SoundContext";
import { useAuth } from "../context/AuthContext";
import CyberMonacoEditor from "../components/editor/CyberMonacoEditor";






const RATINGS = [
  800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400
];
const TAGS = [
  "implementation", "dp", "math", "greedy", "graphs", "trees",
  "data structures", "strings", "binary search", "sortings", "two pointers",
  "constructive algorithms", "number theory", "combinatorics", "geometry",
  "bitmasks", "dfs and similar", "brute force", "shortest paths", "dsu",
  "divide and conquer", "matrices", "probabilities", "games", "hashing"
];


// Clean Codeforces TeX delimiters & LaTeX math symbols
function cleanLaTeX(html) {
  if (!html) return "";
  try {
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
    clean = clean.replace(/\\lt/g, "<");
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
      if (content.startsWith("[") && content.endsWith("]")) {
        return `<code class="font-mono text-amber-300 font-bold bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.5 rounded">${content}</code>`;
      }
      return `<span class="font-mono text-accent font-semibold px-0.5">${content}</span>`;
    });

    clean = clean.replace(/\$\$(.*?)\$\$/g, '<span class="font-mono text-accent font-semibold px-0.5">$1</span>');
    clean = clean.replace(/\$(.*?)\$/g, '<span class="font-mono text-accent font-semibold px-0.5">$1</span>');

    // 6. Add 1-click Copy buttons to Codeforces sample input and output boxes
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





function convertJinaMarkdownToCFHTML(mdText) {
  if (!mdText || !mdText.includes("Markdown Content:")) return null;

  const contentStart = mdText.indexOf("Markdown Content:");
  let content = mdText.substring(contentStart + "Markdown Content:".length).trim();

  const lines = content.split("\n");
  let htmlParts = ['<div class="problem-statement">'];
  let inCodeBlock = false;
  let codeLines = [];
  let boxCount = 0;

  for (let line of lines) {
    let trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        const rawCodeText = codeLines.join("\n");
        boxCount++;
        const isInput = boxCount % 2 === 1;
        const boxLabel = isInput ? `INPUT ${Math.ceil(boxCount / 2)}` : `OUTPUT ${Math.ceil(boxCount / 2)}`;

        htmlParts.push(`
          <div class="sample-test-container my-3 rounded-xl overflow-hidden border border-accent/30 bg-[#0b0b14] shadow-lg">
            <div class="px-3.5 py-1.5 bg-[#121220] border-b border-accent/20 flex items-center justify-between font-mono text-xs">
              <span class="text-accent font-bold tracking-wider">// ${boxLabel}</span>
              <button 
                onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(rawCodeText)}')).then(()=>{this.innerText='✓ COPIED!';setTimeout(()=>this.innerText='📋 COPY',2000)})"
                class="font-mono text-[10px] font-extrabold bg-accent/15 hover:bg-accent hover:text-black text-accent border border-accent/40 px-2.5 py-0.5 rounded transition-all cursor-pointer"
              >
                📋 COPY
              </button>
            </div>
            <pre class="p-3.5 font-mono text-xs text-purple-200 overflow-x-auto select-all m-0"><code>${rawCodeText}</code></pre>
          </div>
        `);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }


    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "Input") {
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-5 mb-2 border-b border-accent/20 pb-1">// INPUT SPECIFICATION</div>');
    } else if (trimmed === "Output") {
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-5 mb-2 border-b border-accent/20 pb-1">// OUTPUT SPECIFICATION</div>');
    } else if (trimmed === "Example" || trimmed === "Examples") {
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-5 mb-2 border-b border-accent/20 pb-1">// SAMPLE TEST CASES</div>');
    } else if (trimmed === "Note") {
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-5 mb-2 border-b border-accent/20 pb-1">// NOTE</div>');
    } else if (trimmed === "Copy" || trimmed.startsWith("Title:") || trimmed.startsWith("URL Source:") || trimmed === "---") {
      continue;
    } else if (trimmed) {
      let formattedLine = line.replace(/\$([^\$]+)\$/g, '<span class="tex-span font-mono text-accent/90">$1</span>');
      htmlParts.push(`<p class="mb-3 text-sm leading-relaxed text-text-primary">${formattedLine}</p>`);
    }
  }

  htmlParts.push('</div>');
  return htmlParts.join("");
}

// Fetch problem statement via CORS proxies
async function fetchCFStatementClientSide(contestId, index) {
  // 1. Try backend statement scraper first (fastest & zero CORS restrictions)
  try {
    const backendData = await apiCall(`/cf/problem-statement/${contestId}/${index}`).catch(() => null);
    if (backendData && backendData.html) {
      return backendData.html;
    }
  } catch (_) { }

  // 2. Client-side CORS proxies fetching Codeforces Markdown & HTML in English
  const contestUrl = `https://codeforces.com/contest/${contestId}/problem/${index}?locale=en`;
  const desktopUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}?locale=en`;

  const proxyUrls = [
    `https://r.jina.ai/${contestUrl}`,
    `https://r.jina.ai/${desktopUrl}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(contestUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(desktopUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(contestUrl)}`,
  ];

  for (const pUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(pUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);
      if (!resp || !resp.ok) continue;

      let html = await resp.text();
      if (!html || html.length < 50) continue;

      if (pUrl.includes("r.jina.ai") && html.includes("Markdown Content:")) {
        const parsedHtml = convertJinaMarkdownToCFHTML(html);
        if (parsedHtml) return parsedHtml;
      }

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
        return stDiv.innerHTML;
      }
    } catch (_) { }
  }

  return null;
}



// Dynamically fetch REAL problem matching EXACT target rating and tags from Codeforces API
async function fetchRealCFProblem(targetRating, selectedTags) {
  try {
    const tagQuery = (selectedTags && selectedTags.length > 0) ? selectedTags.join(";") : "";
    const url = tagQuery
      ? `https://codeforces.com/api/problemset.problems?tags=${encodeURIComponent(tagQuery)}`
      : `https://codeforces.com/api/problemset.problems`;
    const resp = await fetch(url);

    if (resp.ok) {
      const data = await resp.json();
      if (data.status === "OK" && data.result?.problems) {
        // Strict exact rating filter
        let matching = data.result.problems.filter((p) => p.rating === targetRating);
        // Fallback: if tag combo is too restrictive for exact rating, search rating directly
        if (matching.length === 0) {
          matching = data.result.problems.filter((p) => Math.abs((p.rating || 0) - targetRating) <= 100);
        }
        if (matching.length > 0) {
          const picked = matching[Math.floor(Math.random() * matching.length)];
          return {
            contestId: picked.contestId,
            index: picked.index,
            title: `Task ${picked.contestId}${picked.index} - ${picked.name}`,
            rating: picked.rating || targetRating,
            tags: picked.tags || selectedTags,
            url: `https://codeforces.com/problemset/problem/${picked.contestId}/${picked.index}`,
          };
        }
      }
    }
  } catch (e) {
    console.warn("Codeforces API fetch error", e);
  }

  // Fallback if CF API rate-limited or offline
  const fallbackContests = [
    { contestId: 1906, index: "A", name: "Got Any Grapes?" },
    { contestId: 1850, index: "B", name: "Ten Words of Wisdom" },
    { contestId: 1791, index: "C", name: "Prepend and Append" },
    { contestId: 1873, index: "D", name: "1D Eraser" },
  ];
  const picked = fallbackContests[Math.floor(Math.random() * fallbackContests.length)];
  return {
    contestId: picked.contestId,
    index: picked.index,
    title: `Task ${picked.contestId}${picked.index} - ${picked.name}`,
    rating: targetRating,
    tags: selectedTags,
    url: `https://codeforces.com/problemset/problem/${picked.contestId}/${picked.index}`,
  };
}

export default function Practice() {
  const { user } = useAuth();
  const { playVictory, playSadness, playAction } = useSound();

  const [rating, setRating] = useState(1200);
  const [selectedTags, setSelectedTags] = useState([]);
  const [duration, setDuration] = useState(30);
  const [phase, setPhase] = useState("setup"); // 'setup' | 'practicing' | 'completed'
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState(null);
  const [statementHtml, setStatementHtml] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const timerRef = useRef(null);

  // 1. Session Persistence & Mount Recovery (Auto-purge sessions older than 2 hours)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("codeclash_practice_session");
      if (savedSession) {
        const data = JSON.parse(savedSession);
        const age = Date.now() - (data?.savedAt || 0);

        if (age > 7200000 || !data?.problem?.contestId || !data?.problem?.index) {
          localStorage.removeItem("codeclash_practice_session");
        } else {
          setProblem(data.problem);
          setElapsed((data.elapsed || 0) + Math.floor(age / 1000));
          setRating(data.rating || 1200);
          setSelectedTags(data.selectedTags || []);
          setDuration(data.duration || 30);
          setPhase("practicing");

          // Re-fetch statement HTML safely
          setLoadingProblem(true);
          fetchCFStatementClientSide(data.problem.contestId, data.problem.index)
            .then((html) => {
              if (html) setStatementHtml(html);
            })
            .finally(() => setLoadingProblem(false));

          timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        }
      }
    } catch (_) {
      localStorage.removeItem("codeclash_practice_session");
    }

    return () => clearInterval(timerRef.current);
  }, []);



  // 2. Save active practice session metadata to localStorage on tick (lightweight only!)
  useEffect(() => {
    if (phase === "practicing" && problem) {
      try {
        localStorage.setItem(
          "codeclash_practice_session",
          JSON.stringify({
            problem,
            elapsed,
            rating,
            selectedTags,
            duration,
            savedAt: Date.now(),
          })
        );
      } catch (_) { }
    }
  }, [phase, problem, elapsed, rating, selectedTags, duration]);


  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };


  const startPractice = async () => {
    setLoadingProblem(true);
    setPhase("practicing");
    setElapsed(0);
    setStatementHtml(null);

    // Fetch REAL Codeforces problem matching selected rating & tags
    const pickedProblem = await fetchRealCFProblem(rating, selectedTags);
    setProblem(pickedProblem);

    // Start timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    // Save initial session
    localStorage.setItem(
      "codeclash_practice_session",
      JSON.stringify({
        problem: pickedProblem,
        elapsed: 0,
        rating,
        selectedTags,
        duration,
        savedAt: Date.now(),
      })
    );


    // Fetch problem statement HTML & clean TeX
    fetchCFStatementClientSide(pickedProblem.contestId, pickedProblem.index)
      .then((html) => {
        if (html) setStatementHtml(html);
      })
      .finally(() => setLoadingProblem(false));
  };

  const handleCheckSubmission = async () => {
    if (checking) return;
    setChecking(true);
    setCheckError(null);
    playAction();


    try {
      let userHandle = user?.cf_handle || "";
      if (!userHandle) {
        userHandle = prompt("Enter your Codeforces Handle to check submission:") || "";
      }

      if (!userHandle || !userHandle.trim()) {
        const errStr = "Oops! Couldn't check submission. Please enter your Codeforces handle in Settings!";
        setCheckError(errStr);
        toast.error(errStr);
        return;
      }

      userHandle = userHandle.trim();
      let secondsLeft = 12;
      const toastId = toast.loading(`Searching Codeforces API for @${userHandle}... (${secondsLeft}s)`);

      const countdownTimer = setInterval(() => {
        secondsLeft = Math.max(0, secondsLeft - 3);
        if (secondsLeft > 0) {
          toast.loading(`Searching Codeforces API for @${userHandle}... (${secondsLeft}s)`, { id: toastId });
        } else {
          toast.loading(`Finalizing search for @${userHandle}...`, { id: toastId });
        }
      }, 3000);

      let foundAccepted = false;

      try {
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(userHandle)}&from=1&count=10`;
            let res = await fetch(url, { signal: controller.signal }).catch(() => null);
            clearTimeout(timeoutId);

            if (!res || !res.ok) {
              const controller2 = new AbortController();
              const timeoutId2 = setTimeout(() => controller2.abort(), 4000);
              res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: controller2.signal }).catch(() => null);
              clearTimeout(timeoutId2);
            }

            if (res && res.ok) {
              const data = await res.json();
              if (data && data.status === "OK" && Array.isArray(data.result)) {
                const sub = data.result.find(
                  (s) =>
                    String(s.problem?.contestId) === String(problem?.contestId) &&
                    String(s.problem?.index).toUpperCase() === String(problem?.index).toUpperCase()
                );

                if (sub && sub.verdict === "OK") {
                  foundAccepted = true;
                  break;
                }
              }
            }
          } catch (_) {
            /* retry next attempt */
          }
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        }
      } finally {
        clearInterval(countdownTimer);
        toast.dismiss(toastId);
      }

      if (foundAccepted) {
        setCheckError(null);
        playVictory();
        toast.success("VERDICT: ACCEPTED! Solo Practice Task Cleared 🎉");
        setPhase("completed");
        clearInterval(timerRef.current);
        localStorage.removeItem("codeclash_practice_session");
      } else {
        playSadness();
        const msg = `Oops! Couldn't find an Accepted (AC) submission on Codeforces for @${userHandle} on task ${problem?.contestId}${problem?.index}. Please check your handle & submission!`;
        setCheckError(msg);
        toast.error(msg, { duration: 7000 });
      }
    } catch (e) {
      const err = "Error checking submission: " + (e.message || "Unknown error");
      setCheckError(err);
      toast.error(err);
    } finally {
      setChecking(false);
    }
  };


  const endPractice = () => {
    clearInterval(timerRef.current);
    localStorage.removeItem("codeclash_practice_session");
    playSadness();
    setPhase("setup");
  };






  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <PageLayout>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <AntigravityCyberBackground />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              ← DASHBOARD
            </Link>
            <span className="font-mono text-xs px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/40 text-accent font-bold">
              🎯 SOLO SPEED ARENA
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-primary">
              SOLO TRAINING ARENA
            </h1>
            <p className="text-text-muted text-sm max-w-xl">
              Sharpen your speed solving skills against a live timer. Select rating & topic tags to begin.
            </p>
          </div>

          {/* SETUP PHASE */}
          {phase === "setup" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/80 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl"
            >
              {/* Rating Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// TARGET PROBLEM RATING</label>
                <div className="flex flex-wrap gap-2.5">
                  {RATINGS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className={`font-mono text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${rating === r
                          ? "bg-accent text-black shadow-[0_0_20px_rgba(255,230,12,0.4)] scale-105"
                          : "bg-bg-elevated border border-border text-text-muted hover:border-accent"
                        }`}
                    >
                      {r} ELO
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// TOPIC TAGS (OPTIONAL — SELECT ANY OR NONE FOR ALL TOPICS)</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const active = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`font-mono text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer ${active
                            ? "bg-purple-600/30 border border-purple-400 text-purple-300 shadow-sm"
                            : "bg-bg-elevated/70 border border-border text-text-dim hover:text-text-muted"
                          }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-3">
                <label className="font-mono text-xs font-bold text-accent tracking-wider">// PRACTICE TIMER DURATION</label>
                <div className="flex gap-3">
                  {[15, 30, 40, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`font-mono text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer ${duration === d
                          ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-sm"
                          : "bg-bg-elevated border border-border text-text-muted"
                        }`}
                    >
                      {d} MINS
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startPractice}
                  className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl shadow-[0_0_25px_rgba(255,230,12,0.5)] cursor-pointer"
                >
                  ⚡ START SOLO PRACTICE SESSION ({rating} ELO{selectedTags.length > 0 ? ` - #${selectedTags.join(", #")}` : " - ALL TOPICS"})
                </motion.button>
              </div>

            </motion.div>
          )}

          {/* PRACTICING PHASE — 2-COLUMN SIDE-BY-SIDE SPLIT LAYOUT */}
          {phase === "practicing" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Problem Panel & Controls (Left 6 Columns) */}
              <div className="lg:col-span-6 space-y-6">

                <div className="bg-black/90 backdrop-blur-2xl border border-accent/40 rounded-2xl p-6 space-y-6 shadow-2xl flex flex-col min-h-[750px]">
                  <div className="flex items-center justify-between border-b border-border/80 pb-4">
                    <div>
                      <span className="font-mono text-xs text-accent font-bold tracking-widest">// PRACTICE TASK ({problem?.rating} ELO)</span>
                      <h2 className="text-xl font-extrabold text-text-primary">{problem?.title}</h2>
                    </div>
                    {problem?.url && (
                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs bg-accent text-black font-extrabold px-3.5 py-1.5 rounded-lg hover:shadow-[0_0_15px_rgba(255,230,12,0.5)] transition-all cursor-pointer"
                      >
                        ↗ CODEFORCES LINK
                      </a>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-[750px] max-h-[900px] custom-scrollbar">
                    {loadingProblem ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="font-mono text-xs text-accent font-bold animate-pulse">// SCRAPING MATCHING CF TASK...</p>
                      </div>
                    ) : statementHtml ? (
                      <div
                        className="problem-statement text-text-primary p-2 space-y-4 select-text cursor-text"
                        dangerouslySetInnerHTML={{ __html: cleanLaTeX(statementHtml) }}
                      />
                    ) : (
                      <div className="w-full min-h-[750px] flex flex-col rounded-xl overflow-hidden border border-accent/40 shadow-2xl bg-black/60">
                        <div className="bg-black/90 px-4 py-2.5 flex items-center justify-between border-b border-accent/30">
                          <span className="font-mono text-xs text-accent font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                            ⚡ DIRECT CODECLASH EMBEDDED READER
                          </span>
                          <a
                            href={problem?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] bg-accent/20 hover:bg-accent hover:text-black border border-accent/40 text-accent font-bold px-2.5 py-1 rounded transition-all"
                          >
                            ↗ Open on Codeforces
                          </a>
                        </div>
                        <iframe
                          src={`https://r.jina.ai/https://codeforces.com/contest/${problem?.contestId}/problem/${problem?.index}?locale=en`}
                          className="w-full h-[750px] bg-[#14141e] text-text-primary rounded-b-xl border-none p-2"
                          title="Codeforces Problem Statement"
                        />


                      </div>
                    )}


                  </div>
                </div>

                {/* Sidebar Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Timer Card */}
                  <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 text-center space-y-1 shadow-2xl">
                    <p className="font-mono text-[10px] text-text-dim tracking-widest">// ELAPSED TIME</p>
                    <p className="font-mono text-3xl font-black text-accent tracking-wider">{formatTime(elapsed)}</p>
                    <p className="font-mono text-[10px] text-text-muted">Target: {duration}:00</p>
                  </div>

                  {/* Submission Action */}
                  <div className="bg-black/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-5 space-y-2 shadow-2xl flex flex-col justify-center">
                    <button
                      onClick={handleCheckSubmission}
                      disabled={checking}
                      className="w-full font-mono text-xs font-black bg-accent text-black py-3 rounded-xl hover:shadow-[0_0_20px_rgba(255,230,12,0.5)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {checking ? "CHECKING SUBMISSION..." : "✓ CHECK SUBMISSION"}
                    </button>

                    {checkError && (
                      <div className="p-3.5 rounded-xl bg-status-error/15 border border-status-error/60 text-status-error font-mono text-[11px] space-y-1 shadow-lg animate-pulse">
                        <p className="font-extrabold flex items-center gap-1.5 text-xs">
                          <span>⚠️</span> SUBMISSION NOT DETECTED
                        </p>
                        <p className="leading-relaxed opacity-95">{checkError}</p>
                      </div>
                    )}

                    <button
                      onClick={endPractice}
                      className="w-full font-mono text-[10px] text-status-error hover:underline cursor-pointer text-center pt-1"
                    >
                      🏳 End Session
                    </button>


                  </div>
                </div>
              </div>

              {/* Code Studio IDE (Right 6 Columns — Massive 750px Height!) */}
              <div className="lg:col-span-6 h-full min-h-[750px] flex flex-col">
                <CyberMonacoEditor />
              </div>
            </motion.div>
          )}



          {/* ── SPECTACULAR CELEBRATORY VICTORY SCREEN ───────────── */}
          {phase === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative max-w-xl mx-auto z-30"
            >
              {/* Animated Floating Starburst Particle Explosion */}
              {Array.from({ length: 24 }).map((_, idx) => {
                const angle = (idx / 24) * 360;
                const radius = 180 + (idx % 3) * 40;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <motion.div
                    key={`star-${idx}`}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{
                      x: [0, x],
                      y: [0, y],
                      opacity: [1, 0],
                      scale: [0.5, 1.4, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      delay: (idx % 6) * 0.1,
                      ease: "easeOut",
                    }}
                    className={`absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center font-bold text-xs pointer-events-none ${idx % 3 === 0
                        ? "text-accent"
                        : idx % 3 === 1
                          ? "text-cyan-400"
                          : "text-purple-400"
                      }`}
                  >
                    {idx % 4 === 0 ? "★" : idx % 4 === 1 ? "✦" : idx % 4 === 2 ? "❖" : "⚡"}
                  </motion.div>
                );
              })}

              <div className="bg-black/95 backdrop-blur-3xl border-2 border-accent/80 rounded-3xl p-8 sm:p-10 text-center space-y-8 shadow-[0_0_60px_rgba(255,230,12,0.35)] relative overflow-hidden">
                {/* Glowing Golden Trophy SVG */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-accent/50 shadow-[0_0_30px_rgba(255,230,12,0.4)]"
                  />
                  <svg width="72" height="72" viewBox="0 0 40 40" fill="none">
                    <defs>
                      <linearGradient id="vic_gold" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#ffe60c" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path d="M12 9 C12 9 8 9 8 15 C8 20 12 21 15 21 L15 9 Z" fill="url(#vic_gold)" fillOpacity="0.4" stroke="#ffe60c" strokeWidth="1.5" />
                    <path d="M28 9 C28 9 32 9 32 15 C32 20 28 21 25 21 L25 9 Z" fill="url(#vic_gold)" fillOpacity="0.4" stroke="#ffe60c" strokeWidth="1.5" />
                    <path d="M14 8 H26 V18 C26 22 23 25 20 25 C17 25 14 22 14 18 V8 Z" fill="url(#vic_gold)" stroke="#fef08a" strokeWidth="2" />
                    <path d="M18 25 H22 V29 H18 Z" fill="url(#vic_gold)" />
                    <path d="M13 29 H27 V33 H13 Z" fill="url(#vic_gold)" rx="2" stroke="#fef08a" strokeWidth="1" />
                    <path d="M20 11 L21.5 14 L25 14.5 L22.5 17 L23 20.5 L20 18.8 L17 20.5 L17.5 17 L15 14.5 L18.5 14 L20 11 Z" fill="#000" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs px-4 py-1.5 rounded-full bg-accent/20 border border-accent/60 text-accent font-black tracking-widest shadow-md">
                    100% ACCEPTED (AC)
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight pt-2">
                    SOLO ARENA VICTORY!
                  </h2>
                  <p className="text-text-muted text-sm font-medium max-w-sm mx-auto">
                    {problem?.title || "Practice Task"}
                  </p>
                </div>

                {/* Victory Stats Row */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-bg-elevated/80 border border-border/80 rounded-2xl p-4 text-center space-y-1">
                    <p className="font-mono text-[10px] text-text-dim tracking-wider">// SOLVE TIME</p>
                    <p className="font-mono text-2xl font-black text-accent">{formatTime(elapsed)}</p>
                  </div>
                  <div className="bg-bg-elevated/80 border border-border/80 rounded-2xl p-4 text-center space-y-1">
                    <p className="font-mono text-[10px] text-text-dim tracking-wider">// TASK RATING</p>
                    <p className="font-mono text-2xl font-black text-status-live">{problem?.rating || rating} ELO</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPhase("setup")}
                    className="w-full font-mono text-sm font-black bg-accent text-black py-4 rounded-xl shadow-[0_0_25px_rgba(255,230,12,0.5)] cursor-pointer"
                  >
                    ⚡ NEXT PRACTICE TASK
                  </motion.button>
                  <Link to="/achievements">
                    <button className="w-full font-mono text-xs font-bold border border-border hover:border-accent text-text-muted hover:text-accent py-3 rounded-xl transition-all cursor-pointer">
                      🏆 VIEW UNLOCKED BADGES
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </PageLayout>
  );
}
