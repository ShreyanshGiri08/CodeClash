import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link to="/" className="font-mono font-bold text-sm tracking-wider text-text-primary hover:text-accent transition-colors">
              CODECLASH
            </Link>
            <span className="w-8 h-0.5 bg-accent rounded-full block mt-1" />
          </div>

          <div className="text-right space-y-1">
            <p className="text-text-muted text-xs">
              Built for people who'd rather battle than grind alone.
            </p>
            <p className="text-text-dim text-xs font-mono flex items-center justify-end gap-2">
              <span>© 2026 CodeClash.</span>
              <span className="text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded text-[10px]">
                💡 Tip: Press <kbd className="font-bold">Ctrl+K</kbd> for quick commands
              </span>
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
