import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global one-click clipboard helper for problem statement sample testcases
if (typeof window !== "undefined") {
  window.copyTextToClipboard = function (btn, textEncoded) {
    try {
      const text = decodeURIComponent(textEncoded);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          btn.innerText = "✓ COPIED!";
          btn.style.backgroundColor = "#ff79c6";
          btn.style.color = "#000000";
          setTimeout(() => {
            btn.innerText = "📋 COPY";
            btn.style.backgroundColor = "";
            btn.style.color = "";
          }, 2000);
        });
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        btn.innerText = "✓ COPIED!";
        setTimeout(() => { btn.innerText = "📋 COPY"; }, 2000);
      }
    } catch (_) {}
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

