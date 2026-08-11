import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Document Event Delegation for 100% Bulletproof 1-Click Clipboard Copying
if (typeof window !== "undefined") {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn-injected, [data-copy-text]");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    let textToCopy = btn.getAttribute("data-copy-text");
    if (textToCopy) {
      try {
        textToCopy = decodeURIComponent(textToCopy);
      } catch (_) {}
    } else {
      const parentContainer = btn.closest(".sample-test-container, .input, .output, pre");
      const pre = parentContainer ? (parentContainer.tagName === "PRE" ? parentContainer : parentContainer.querySelector("pre")) : null;
      if (pre) textToCopy = pre.innerText || pre.textContent;
    }

    if (textToCopy) {
      const copySuccess = () => {
        const origText = btn.innerText || "📋 COPY";
        btn.innerText = "✓ COPIED!";
        btn.style.backgroundColor = "#22c55e";
        btn.style.color = "#000000";
        setTimeout(() => {
          btn.innerText = origText;
          btn.style.backgroundColor = "";
          btn.style.color = "";
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(copySuccess).catch(() => {
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          copySuccess();
        });
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copySuccess();
      }
    }
  }, true);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


