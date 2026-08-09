import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSound } from "../../context/SoundContext";
import CPSnippetVault from "../common/CPSnippetVault";
import toast from "react-hot-toast";


const LANGUAGE_CONFIGS = {
  cpp: {
    name: "C++ 17 (g++)",
    pistonLang: "cpp",
    version: "10.2.0",
    judge0Id: 54,
    boilerplate: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
  },
  python: {
    name: "Python 3.10",
    pistonLang: "python",
    version: "3.10.0",
    judge0Id: 71,
    boilerplate: `import sys

def solve():
    # Write your solution here
    pass

if __name__ == "__main__":
    solve()
`,
  },
  java: {
    name: "Java 17",
    pistonLang: "java",
    version: "15.0.2",
    judge0Id: 62,
    boilerplate: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}
`,
  },
  javascript: {
    name: "JavaScript (Node 18)",
    pistonLang: "javascript",
    version: "18.15.0",
    judge0Id: 63,
    boilerplate: `const fs = require('fs');

function main() {
    // Write your solution here
    
}

main();
`,
  },
};

export default function CyberMonacoEditor({ initialCode = "", sampleInput = "", sampleOutput = "", onCodeChange }) {
  const { playAction, playVictory, playSadness } = useSound();
  const [lang, setLang] = useState("cpp");
  const [code, setCode] = useState(initialCode || LANGUAGE_CONFIGS.cpp.boilerplate);
  const [customInput, setCustomInput] = useState(sampleInput || "");
  const [expectedOutput, setExpectedOutput] = useState(sampleOutput || "");
  const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'input' | 'output'
  const [executing, setExecuting] = useState(false);
  const [execOutput, setExecOutput] = useState(null);
  const textareaRef = useRef(null);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    const template = LANGUAGE_CONFIGS[newLang].boilerplate;
    setCode(template);
    if (onCodeChange) onCodeChange(template, newLang);
  };

  const handleCodeInput = (newVal) => {
    setCode(newVal);
    if (onCodeChange) onCodeChange(newVal, lang);
  };

  // SMART NON-DESTRUCTIVE SNIPPET INSERTION ENGINE
  const handleSmartInsertSnippet = (snipObj) => {
    const existing = code || "";
    let updatedCode = existing;

    if (snipObj.id === "fastio") {
      if (existing.includes("sync_with_stdio")) {
        toast("Fast I/O is already in your code!", { icon: "⚡" });
        return;
      }
      if (existing.includes("main()")) {
        const fastIoLines = "    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n";
        updatedCode = existing.replace(/main\s*\([^)]*\)\s*\{/, (m) => m + "\n" + fastIoLines);
        toast.success("⚡ Injected Fast I/O inside main()!");
      } else {
        updatedCode = snipObj.code;
        toast.success("⚡ Fast I/O Template Loaded!");
      }
    } else {
      const symbol = snipObj.id === "modpow" ? "modpow" : snipObj.id === "dsu" ? "struct DSU" : "struct SegTree";
      if (existing.includes(symbol)) {
        toast(`${snipObj.title} is already in your code!`, { icon: "⚠️" });
        return;
      }

      if (existing.includes("main()")) {
        updatedCode = existing.replace(/int\s+main\s*\(|main\s*\(/, (m) => snipObj.code + "\n\n" + m);
        toast.success(`↙ Inserted ${snipObj.title} above main()!`);
      } else {
        updatedCode = snipObj.code + "\n\n" + existing;
        toast.success(`↙ Inserted ${snipObj.title}!`);
      }
    }

    handleCodeInput(updatedCode);
  };


  // SMART AUTO-INDENTATION & KEY EVENT HANDLER
  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // 1. ENTER KEY SMART AUTO-INDENTATION
    if (e.key === "Enter") {
      e.preventDefault();

      const lastLineStart = val.lastIndexOf("\n", start - 1) + 1;
      const currentLine = val.substring(lastLineStart, start);

      const indentMatch = currentLine.match(/^[\s]*/);
      let indent = indentMatch ? indentMatch[0] : "";

      const trimmedLine = currentLine.trim();
      if (trimmedLine.endsWith("{") || trimmedLine.endsWith(":") || trimmedLine.endsWith("(")) {
        indent += "    ";
      }

      const insertion = "\n" + indent;
      textarea.value = val.substring(0, start) + insertion + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      handleCodeInput(textarea.value);
      return;
    }

    // 2. TAB KEY INDENTATION
    if (e.key === "Tab") {
      e.preventDefault();
      textarea.value = val.substring(0, start) + "    " + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
      handleCodeInput(textarea.value);
      return;
    }

    // 3. AUTO-CLOSING BRACKETS
    const pairs = { "(": ")", "{": "}", "[": "]", '"': '"', "'": "'" };
    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const closing = pairs[e.key];
      textarea.value = val.substring(0, start) + e.key + closing + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      handleCodeInput(textarea.value);
      return;
    }
  };

  // REAL COMPILATION & STDOUT EVALUATION ENGINE
  const runCodeLocally = async () => {
    setExecuting(true);
    setActiveTab("output");
    playAction();
    const toastId = toast.loading("Compiling & Executing Code...");

    const selectedCfg = LANGUAGE_CONFIGS[lang];

    // Client-side JS execution engine for JavaScript
    if (lang === "javascript") {
      try {
        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
          error: (...args) => logs.push("[ERROR] " + args.join(" ")),
          warn: (...args) => logs.push("[WARN] " + args.join(" ")),
        };

        const runFn = new Function("console", "input", code);
        runFn(customConsole, customInput);

        setExecuting(false);
        const stdout = logs.join("\n").trim();
        const exp = expectedOutput.trim();

        let isMatch = true;
        if (exp) {
          isMatch = stdout === exp;
        }

        setExecOutput({
          status: isMatch ? (exp ? "PASSED" : "SUCCESS") : "FAILED",
          stdout: stdout || "(No output produced by code)",
          stderr: "",
          expected: exp,
          time: "< 5ms",
        });

        if (isMatch) {
          playVictory();
          toast.success(exp ? "✓ Test Passed! Matches Expected Output! ⚡" : "Executed Cleanly!", { id: toastId });
        } else {
          playSadness();
          toast.error("❌ Output Mismatch! Does not match expected output.", { id: toastId });
        }
        return;
      } catch (err) {
        setExecuting(false);
        setExecOutput({
          status: "COMPILE_ERROR",
          stdout: "",
          stderr: `${err.name}: ${err.message}\n${err.stack || ""}`,
          expected: expectedOutput.trim(),
          time: "< 5ms",
        });
        playSadness();
        toast.error("JavaScript Error!", { id: toastId });
        return;
      }
    }

    // Real Remote Compiler Endpoint (Piston v2 API)
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedCfg.pistonLang,
          version: "*",
          files: [{ content: code }],
          stdin: customInput,
        }),
      });

      const data = await res.json();

      if (data && data.run) {
        setExecuting(false);
        const stdout = (data.run.stdout || "").trim();
        const stderr = (data.run.stderr || data.compile?.stderr || data.compile?.output || "").trim();
        const codeExit = data.run.code;

        if (codeExit !== 0 || stderr) {
          setExecOutput({
            status: "COMPILE_ERROR",
            stdout: "",
            stderr: stderr || `Process exited with error code ${codeExit}`,
            expected: expectedOutput.trim(),
            time: data.run.time ? `${data.run.time}s` : "< 20ms",
          });
          playSadness();
          toast.error("Compilation Error!", { id: toastId });
          return;
        }

        const exp = expectedOutput.trim();
        let isMatch = true;
        if (exp) {
          isMatch = stdout === exp;
        }

        setExecOutput({
          status: isMatch ? (exp ? "PASSED" : "SUCCESS") : "FAILED",
          stdout: stdout || "(No output produced by code)",
          stderr: "",
          expected: exp,
          time: data.run.time ? `${data.run.time}s` : "< 20ms",
        });

        if (isMatch) {
          playVictory();
          toast.success(exp ? "✓ Test Passed! Matches Expected Output! ⚡" : "Execution Completed!", { id: toastId });
        } else {
          playSadness();
          toast.error("❌ Output Mismatch! Does not match expected output.", { id: toastId });
        }
        return;
      }
    } catch (_) {
      /* Fallback to secondary compiler */
    }

    // Secondary Real Compiler Endpoint (Judge0 API)
    try {
      const res = await fetch("https://ce.judge0.com/submissions?wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: selectedCfg.judge0Id,
          stdin: customInput,
        }),
      });

      const data = await res.json();
      setExecuting(false);

      const stdout = (data.stdout || "").trim();
      const stderr = (data.stderr || data.compile_output || "").trim();
      const isSuccess = data.status?.id === 3;

      if (!isSuccess || stderr) {
        setExecOutput({
          status: "COMPILE_ERROR",
          stdout: "",
          stderr: stderr || data.status?.description || "Compilation Failed",
          expected: expectedOutput.trim(),
          time: data.time ? `${data.time}s` : "< 30ms",
        });
        playSadness();
        toast.error("Compiler Error!", { id: toastId });
        return;
      }

      const exp = expectedOutput.trim();
      let isMatch = true;
      if (exp) {
        isMatch = stdout === exp;
      }

      setExecOutput({
        status: isMatch ? (exp ? "PASSED" : "SUCCESS") : "FAILED",
        stdout: stdout || "(No output produced by code)",
        stderr: "",
        expected: exp,
        time: data.time ? `${data.time}s` : "< 30ms",
      });

      if (isMatch) {
        playVictory();
        toast.success(exp ? "✓ Test Passed!" : "Execution Completed!", { id: toastId });
      } else {
        playSadness();
        toast.error("❌ Output Mismatch!", { id: toastId });
      }
    } catch (e) {
      setExecuting(false);
      setExecOutput({
        status: "COMPILE_ERROR",
        stdout: "",
        stderr: `Compilation Error:\n${e.message}`,
        expected: expectedOutput.trim(),
        time: "< 10ms",
      });
      playSadness();
      toast.error("Execution Error", { id: toastId });
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="bg-[#0b0b0e] border border-border/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono h-full w-full min-h-[750px]">


      {/* Editor Header Bar */}
      <div className="bg-[#14141a] border-b border-border/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-accent text-xs font-black">⚡ IDE</span>
          <select

            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="bg-[#08080a] border border-accent/50 text-accent text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-accent"
          >
            {Object.entries(LANGUAGE_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.name}
              </option>
            ))}
          </select>
          <CPSnippetVault onInsertSnippet={handleSmartInsertSnippet} />

        </div>


        {/* Action Tabs & Run Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "editor" ? "bg-accent/20 text-accent border border-accent/50" : "text-text-muted hover:text-text-primary"
            }`}
          >
            💻 Code
          </button>
          <button
            onClick={() => setActiveTab("input")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "input" ? "bg-accent/20 text-accent border border-accent/50" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📥 Test & Expected Output
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === "output" ? "bg-accent/20 text-accent border border-accent/50" : "text-text-muted hover:text-text-primary"
            }`}
          >
            📟 Result Output {execOutput && <span className={`w-2 h-2 rounded-full inline-block ml-1 ${execOutput.status === "PASSED" || execOutput.status === "SUCCESS" ? "bg-status-live" : "bg-status-error"}`} />}
          </button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={runCodeLocally}
            disabled={executing}
            className="bg-accent text-black font-black text-xs px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(255,230,12,0.4)] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {executing ? "⚡ RUNNING..." : "▶ RUN & COMPARE"}
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 min-h-[420px] flex flex-col bg-[#0b0b0e] text-text-primary">
        {/* Code Editor View */}
        {activeTab === "editor" && (
          <div className="relative flex flex-1 overflow-auto font-mono text-xs leading-relaxed">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 px-3.5 text-right bg-[#121217] border-r border-border/50 text-text-dim font-bold min-w-[3.2rem]">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 py-3 px-4 bg-transparent text-text-primary outline-none resize-none font-mono text-xs leading-relaxed selection:bg-amber-400/50 selection:text-black font-medium min-h-[620px]"
              placeholder="// Write your code here..."
            />


          </div>
        )}

        {/* Custom Input & Expected Output Tab */}
        {activeTab === "input" && (
          <div className="p-4 space-y-4 flex-1 flex flex-col overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {/* Standard Input */}
              <div className="space-y-1.5 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-accent font-bold">// 1. TEST INPUT (stdin)</span>
                  <button
                    onClick={() => setCustomInput("")}
                    className="text-[10px] text-status-error hover:underline cursor-pointer"
                  >
                    Clear Input
                  </button>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  spellCheck={false}
                  className="w-full flex-1 min-h-[200px] bg-[#14141a] border border-border/80 rounded-xl p-3 text-text-primary font-mono text-xs outline-none focus:border-accent selection:bg-amber-400/50 selection:text-black"
                  placeholder="Paste stdin sample input here..."
                />
              </div>

              {/* Expected Output */}
              <div className="space-y-1.5 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-status-live font-bold">// 2. EXPECTED OUTPUT (sample output)</span>
                  <button
                    onClick={() => setExpectedOutput("")}
                    className="text-[10px] text-status-error hover:underline cursor-pointer"
                  >
                    Clear Expected
                  </button>
                </div>
                <textarea
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  spellCheck={false}
                  className="w-full flex-1 min-h-[200px] bg-[#14141a] border border-border/80 rounded-xl p-3 text-text-primary font-mono text-xs outline-none focus:border-accent selection:bg-amber-400/50 selection:text-black"
                  placeholder="Paste expected output here to auto-compare..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Local Output Terminal Tab */}
        {activeTab === "output" && (
          <div className="p-4 space-y-4 flex-1 overflow-auto">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="text-xs text-text-dim font-bold">// COMPILER OUTPUT & RESULT COMPARISON</span>
              {execOutput && (
                <span className={`font-mono text-xs font-black px-3 py-1 rounded-full border ${
                  execOutput.status === "PASSED" || execOutput.status === "SUCCESS"
                    ? "bg-status-live/20 text-status-live border-status-live/50"
                    : execOutput.status === "FAILED"
                    ? "bg-status-error/20 text-status-error border-status-error/50"
                    : "bg-status-error/20 text-status-error border-status-error/50"
                }`}>
                  {execOutput.status === "PASSED"
                    ? "✓ PASSED (MATCHES EXPECTED)"
                    : execOutput.status === "SUCCESS"
                    ? "⚡ EXECUTED CLEANLY"
                    : execOutput.status === "FAILED"
                    ? "❌ FAILED (OUTPUT MISMATCH)"
                    : "❌ COMPILE / RUNTIME ERROR"}
                </span>
              )}
            </div>

            {executing ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-accent text-xs font-bold animate-pulse">// Compiling Code & Running Execution...</p>
              </div>
            ) : execOutput ? (
              <div className="space-y-4">
                {/* User Output (stdout) */}
                <div className="space-y-1">
                  <span className="font-mono text-xs text-accent font-bold">
                    {execOutput.status === "COMPILE_ERROR" ? "// COMPILER ERROR LOG:" : "// YOUR CODE OUTPUT (stdout):"}
                  </span>
                  <div className="bg-[#121217] border border-border/80 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <pre className={`whitespace-pre-wrap ${execOutput.status === "COMPILE_ERROR" ? "text-status-error font-semibold" : "text-text-primary"}`}>
                      {execOutput.status === "COMPILE_ERROR" ? execOutput.stderr : execOutput.stdout}
                    </pre>
                  </div>
                </div>

                {/* Expected Output (if provided) */}
                {execOutput.expected && (
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-status-live font-bold">// EXPECTED OUTPUT:</span>
                    <div className="bg-[#121217] border border-border/80 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-status-live font-semibold">
                        {execOutput.expected}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-text-dim text-xs">
                Click <span className="text-accent font-bold">"▶ RUN & COMPARE"</span> to compile your code and view the results!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Footer Status Bar */}
      <div className="bg-[#14141a] border-t border-border/60 px-4 py-2 flex items-center justify-between text-[10px] text-text-dim font-bold">
        <span>MODE: {LANGUAGE_CONFIGS[lang].name}</span>
        <span>{lineCount} LINES | UTF-8</span>
      </div>
    </div>
  );
}
