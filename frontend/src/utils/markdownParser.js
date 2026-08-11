/**
 * Codeforces Precision Statement Body Extractor & Markdown Parser
 * Clean Math Symbols, Sample Test Case Boxes with COPY Buttons, and Footer Stripping
 */
export function parseMarkdownToCFHTML(mdText) {
  if (!mdText) return "";

  // GUARD CLAUSE: If text is ALREADY parsed HTML from previous pass, return immediately!
  if (
    mdText.includes('class="problem-statement"') ||
    mdText.includes('class="sample-test-container"') ||
    mdText.includes('copy-btn-injected') ||
    mdText.includes('data-copy-text')
  ) {
    return mdText;
  }

  let content = mdText;
  if (mdText.includes("Markdown Content:")) {
    content = mdText.substring(mdText.indexOf("Markdown Content:") + "Markdown Content:".length).trim();
  }

  // Pre-process multiline Markdown images & links split across newlines by Jina Reader
  content = content.replace(/!\[([^\]]*)\]\s*\n+\s*\(([^)]+)\)/g, "![$1]($2)");
  content = content.replace(/\[([^\]]+)\]\s*\n+\s*\(([^)]+)\)/g, "[$1]($2)");

  // 1. TRUNCATE FOOTER JUNK
  const footerMarkers = [
    "Codeforces (c) Copyright",
    "The only programming contests Web 2.0 platform",
    "Desktop version, switch to mobile version",
    "Privacy Policy | Terms and Conditions",
    "User lists",
    "Server time:"
  ];
  for (const marker of footerMarkers) {
    if (content.includes(marker)) {
      content = content.substring(0, content.indexOf(marker)).trim();
    }
  }

  // 2. DISCARD ALL SIDEBARS & NAV UNTIL THE REAL PROBLEM TITLE / TIME LIMIT
  const lines = content.split("\n");
  let realStatementLines = [];
  let foundProblemBody = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();

    if (!foundProblemBody) {
      const isTitleLine = /^[A-Z][0-9]*\.\s+[A-Za-z0-9]/.test(trimmed);
      const isTimeLimitLine = trimmed.startsWith("time limit per test") || trimmed.startsWith("memory limit per test");

      if (isTitleLine || isTimeLimitLine) {
        foundProblemBody = true;
      } else {
        continue;
      }
    }

    if (foundProblemBody) {
      realStatementLines.push(line);
    }
  }

  if (realStatementLines.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      let trimmed = lines[i].trim();
      if (!foundProblemBody) {
        if (
          trimmed.length > 35 &&
          !trimmed.startsWith("Want to solve") &&
          !trimmed.startsWith("Virtual contest") &&
          !trimmed.startsWith("The package for") &&
          !trimmed.startsWith("Announcement") &&
          !trimmed.startsWith("Tutorial") &&
          !trimmed.startsWith("Problems")
        ) {
          foundProblemBody = true;
        } else {
          continue;
        }
      }
      if (foundProblemBody) realStatementLines.push(lines[i]);
    }
  }

  // 3. PARSE STATEMENT BODY WITH ADVANCED SAMPLE TESTCASE COPY BOX GENERATOR
  let htmlParts = ['<div class="problem-statement">'];
  let inCodeBlock = false;
  let codeLines = [];
  let boxCount = 0;
  let inSampleTestsSection = false;
  let currentSampleType = null; // 'input' or 'output'
  let currentSampleLines = [];

  const flushSampleBox = () => {
    if (!currentSampleType || currentSampleLines.length === 0) return;
    const sampleText = currentSampleLines.join("\n").trim();
    if (!sampleText || sampleText === "Copy") {
      currentSampleLines = [];
      return;
    }
    boxCount++;
    const isInput = currentSampleType === "input";
    const boxLabel = isInput ? `INPUT ${Math.ceil(boxCount / 2)}` : `OUTPUT ${Math.ceil(boxCount / 2)}`;
    const encodedText = encodeURIComponent(sampleText);

    htmlParts.push(`
      <div class="sample-test-container my-3 rounded-xl overflow-hidden border border-amber-400/40 bg-[#07070e] shadow-xl">
        <div class="px-4 py-2.5 bg-[#121224] border-b border-amber-400/30 flex items-center justify-between font-mono text-xs">
          <span style="color: #ffe600 !important; font-weight: 900 !important; font-size: 13px !important; text-shadow: 0 0 8px rgba(255, 230, 0, 0.4);" class="tracking-wider">// ${boxLabel}</span>
          <button 
            type="button"
            data-copy-text="${encodedText}"
            class="copy-btn-injected font-mono text-[10px] font-extrabold bg-indigo-500/30 hover:bg-indigo-500 hover:text-white text-indigo-200 border border-indigo-400/50 px-3 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 select-none shadow-md"
          >
            📋 COPY
          </button>
        </div>
        <pre class="p-4 font-mono text-sm font-bold text-[#00ff9d] overflow-x-auto select-all m-0 bg-[#040409]"><code>${sampleText}</code></pre>
      </div>
    `);
    currentSampleLines = [];
  };

  for (let i = 0; i < realStatementLines.length; i++) {
    let line = realStatementLines[i];
    let trimmed = line.trim();

    // Skip metadata lines
    if (
      !trimmed ||
      trimmed === "Copy" ||
      trimmed === "stdin" ||
      trimmed === "stdout" ||
      trimmed === "input" ||
      trimmed === "output" ||
      trimmed === "×" ||
      trimmed.startsWith("time limit per test") ||
      trimmed.startsWith("memory limit per test")
    ) {
      continue;
    }

    // Code Blocks (```)
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        const rawCodeText = codeLines.filter(l => l.trim() !== "Copy").join("\n");
        boxCount++;
        const isInput = boxCount % 2 === 1;
        const boxLabel = isInput ? `INPUT ${Math.ceil(boxCount / 2)}` : `OUTPUT ${Math.ceil(boxCount / 2)}`;
        const encodedText = encodeURIComponent(rawCodeText);

        htmlParts.push(`
          <div class="sample-test-container my-3 rounded-xl overflow-hidden border border-amber-400/40 bg-[#07070e] shadow-xl">
            <div class="px-4 py-2.5 bg-[#121224] border-b border-amber-400/30 flex items-center justify-between font-mono text-xs">
              <span style="color: #ffe600 !important; font-weight: 900 !important; font-size: 13px !important; text-shadow: 0 0 8px rgba(255, 230, 0, 0.4);" class="tracking-wider">// ${boxLabel}</span>
              <button 
                type="button"
                data-copy-text="${encodedText}"
                class="copy-btn-injected font-mono text-[10px] font-extrabold bg-indigo-500/30 hover:bg-indigo-500 hover:text-white text-indigo-200 border border-indigo-400/50 px-3 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 select-none shadow-md"
              >
                📋 COPY
              </button>
            </div>
            <pre class="p-4 font-mono text-sm font-bold text-[#00ff9d] overflow-x-auto select-all m-0 bg-[#040409]"><code>${rawCodeText}</code></pre>
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
      if (trimmed !== "Copy") codeLines.push(line);
      continue;
    }

    // Title line formatting
    if (/^[A-Z][0-9]*\.\s+[A-Za-z0-9]/.test(trimmed)) {
      htmlParts.push(`<h2 class="text-xl font-extrabold text-accent mb-4 border-b border-accent/20 pb-2">${trimmed}</h2>`);
      continue;
    }

    // Section Headers
    const cleanHeader = trimmed.replace(/^#+\s*/, "").replace(/\*+/g, "").replace(/:$/, "").trim();

    if (cleanHeader === "Example" || cleanHeader === "Examples" || cleanHeader === "Sample test cases") {
      flushSampleBox();
      inSampleTestsSection = true;
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-6 mb-2 border-b border-accent/20 pb-1 font-mono">// SAMPLE TEST CASES</div>');
      continue;
    }

    if (cleanHeader === "Input" || cleanHeader === "Input specification") {
      flushSampleBox();
      if (inSampleTestsSection) {
        currentSampleType = "input";
      } else {
        htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-6 mb-2 border-b border-accent/20 pb-1 font-mono">// INPUT SPECIFICATION</div>');
      }
      continue;
    }

    if (cleanHeader === "Output" || cleanHeader === "Output specification") {
      flushSampleBox();
      if (inSampleTestsSection) {
        currentSampleType = "output";
      } else {
        htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-6 mb-2 border-b border-accent/20 pb-1 font-mono">// OUTPUT SPECIFICATION</div>');
      }
      continue;
    }

    if (cleanHeader === "Note" || cleanHeader === "Notes") {
      flushSampleBox();
      inSampleTestsSection = false;
      htmlParts.push('<div class="section-title text-accent font-extrabold text-sm mt-6 mb-2 border-b border-accent/20 pb-1 font-mono">// NOTE</div>');
      continue;
    }

    // If inside // SAMPLE TEST CASES section, collect lines for current input or output box!
    if (inSampleTestsSection && currentSampleType) {
      if (trimmed !== "Copy") {
        currentSampleLines.push(trimmed);
      }
      continue;
    }

    // Clean Math Formatting & TeX symbols (e.g. 10^{4} -> 10⁴, \ldots -> ..., \left. \right. -> stripped)
    let formattedLine = line;

    // 1. Clean TeX Ellipsis (\ldots, \cdots, \dots -> ...)
    formattedLine = formattedLine.replace(/\\ldots|\\cdots|\\dots/g, "...");

    // 2. Clean LaTeX left/right bracket artifacts (\right., \left., \right, \left, ≤ft)
    formattedLine = formattedLine.replace(/\\left\|\s*\\right\.\s*/g, "|");
    formattedLine = formattedLine.replace(/\\left\|\s*\\right\|/g, "|");
    formattedLine = formattedLine.replace(/\\left\\\.|\s*\\right\\\.|\s*\\right\./g, "");
    formattedLine = formattedLine.replace(/\\left\./g, "");
    formattedLine = formattedLine.replace(/≤ft/g, "");
    formattedLine = formattedLine.replace(/\\left/g, "");
    formattedLine = formattedLine.replace(/\\right/g, "");

    // 3. Clean Inequalities & Operators (\leq / \le / ≤q -> ≤, \geq / \ge / ≥q -> ≥, \cdot -> ·, \times -> ×)
    formattedLine = formattedLine.replace(/\\leq|\\le|≤q/g, "≤");
    formattedLine = formattedLine.replace(/\\geq|\\ge|≥q/g, "≥");
    formattedLine = formattedLine.replace(/\\cdot/g, "·");
    formattedLine = formattedLine.replace(/\\times/g, "×");
    formattedLine = formattedLine.replace(/\\neq|\\ne/g, "≠");
    formattedLine = formattedLine.replace(/\\to|\\rightarrow/g, "→");

    // 4. Clean TeX powers 10^{4} -> 10⁴, 10^9 -> 10⁹, n^2 -> n²
    formattedLine = formattedLine.replace(/10\^\{([0-9]+)\}/g, (m, p) => `10<sup>${p}</sup>`);
    formattedLine = formattedLine.replace(/10\^([0-9]+)/g, (m, p) => `10<sup>${p}</sup>`);
    formattedLine = formattedLine.replace(/([a-zA-Z0-9])\^\{([a-zA-Z0-9\+\-]+)\}/g, `$1<sup>$2</sup>`);
    formattedLine = formattedLine.replace(/([a-zA-Z0-9])\^([0-9]+)/g, `$1<sup>$2</sup>`);

    // 5. Clean LaTeX subscripts (a_1 -> a₁, a_i -> aᵢ, a_n -> aₙ, p_i -> pᵢ)
    formattedLine = formattedLine.replace(/_([a-zA-Z0-9_]+)_/g, '<code class="font-mono text-accent bg-accent/15 px-1 py-0.5 rounded text-xs font-bold">$1</code>');
    formattedLine = formattedLine.replace(/_([a-zA-Z0-9])\s+_([a-zA-Z0-9])_/g, '<code class="font-mono text-accent bg-accent/15 px-1 py-0.5 rounded text-xs font-bold">$1_$2</code>');

    // Convert Markdown Images
    formattedLine = formattedLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      let finalSrc = src.trim();
      if (finalSrc.includes("flags/24/")) return "";
      if (!finalSrc.startsWith("http")) {
        finalSrc = finalSrc.startsWith("/") ? `https://codeforces.com${finalSrc}` : `https://codeforces.com/${finalSrc}`;
      }
      return `<div class="my-4 text-center"><img src="${finalSrc}" alt="${alt || 'Problem Image'}" class="inline-block max-w-full h-auto rounded-xl border border-accent/30 bg-white p-2.5 shadow-xl" /></div>`;
    });

    if (!formattedLine.trim()) continue;

    formattedLine = formattedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-accent underline font-mono hover:text-white">$1</a>');
    formattedLine = formattedLine.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-accent/90">$1</strong>');
    formattedLine = formattedLine.replace(/\$([^\$]+)\$/g, '<code class="font-mono text-accent bg-accent/15 border border-accent/30 px-1 py-0.5 rounded text-xs font-bold">$1</code>');

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const listContent = formattedLine.replace(/^[\*\-]\s*/, "");
      htmlParts.push(`<li class="ml-4 list-disc text-sm my-1 text-text-primary leading-relaxed">${listContent}</li>`);
    } else {
      htmlParts.push(`<p class="mb-3 text-sm leading-relaxed text-text-primary">${formattedLine}</p>`);
    }
  }

  flushSampleBox();
  htmlParts.push('</div>');
  return htmlParts.join("");
}
