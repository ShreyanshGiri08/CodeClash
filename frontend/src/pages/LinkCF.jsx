import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { startCfVerification, confirmCfVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";

export default function LinkCF() {
  const [handle, setHandle] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("enter-handle");
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (user && user.cf_verified) {
      navigate("/dashboard");
    }
  }, [user]);

  async function handleStart(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await startCfVerification(handle);
      setVerifyCode(data.verify_code);
      setStep("confirm");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError("");
    setLoading(true);
    try {
      await confirmCfVerification();
      updateUser({ cf_handle: handle, cf_verified: true });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors mb-8 cursor-pointer"
        >
          ← BACK TO DASHBOARD
        </button>


        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 bg-bg-elevated border border-border rounded-lg flex items-center justify-center text-xl">
              🔗
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">CODEFORCES ACCOUNT</h1>
          </div>
          <p className="text-text-muted text-sm mb-8 max-w-lg">
            Link your Codeforces handle so we can pull your race verdicts automatically.
            No password needed — you verify by placing a code in your CF profile.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-card border border-border rounded-lg p-6 sm:p-8"
        >
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded px-3 py-2 mb-4"
            >
              {error}
            </motion.p>
          )}

          {step === "enter-handle" ? (
            <form onSubmit={handleStart} className="space-y-5">
              <div>
                <label className="text-sm font-medium block mb-1.5">Codeforces Handle</label>
                <input
                  placeholder="Your CF handle (e.g., tourist)"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-dim font-mono"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full font-mono text-sm font-bold border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent hover:text-black transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Checking Codeforces…" : "LINK WITH CODEFORCES ▸"}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-bg-input/60 border border-border rounded-lg p-4 space-y-3">
                <p className="text-text-muted text-sm leading-relaxed">
                  To prove you own <strong className="text-text-primary font-mono">{handle}</strong>, open your Codeforces Social Settings and paste your code into the <strong className="text-accent">First Name</strong> field.
                </p>

                <a
                  href="https://codeforces.com/settings/social"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-accent/10 border border-accent/40 text-accent font-mono text-xs font-bold px-4 py-2 rounded-lg hover:bg-accent hover:text-black transition-all"
                >
                  ↗ OPEN CODEFORCES SOCIAL SETTINGS
                </a>
              </div>

              <div>
                <label className="text-xs font-mono text-text-dim tracking-widest block mb-2">
                  // YOUR UNIQUE VERIFICATION CODE
                </label>
                <div className="flex items-center gap-2 bg-bg-input border border-accent/40 rounded-lg p-3">
                  <code className="font-mono text-xl text-accent font-bold tracking-wide flex-1 text-center">
                    {verifyCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(verifyCode);
                    }}
                    className="font-mono text-xs bg-bg-elevated border border-border px-3 py-1.5 rounded hover:border-accent text-text-muted transition-colors cursor-pointer"
                  >
                    📋 COPY
                  </button>
                </div>
              </div>

              <p className="text-text-dim text-xs">
                After saving changes on Codeforces, click the button below to complete verification. (You can remove the code from your CF profile afterwards).
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("enter-handle")}
                  className="font-mono text-xs border border-border px-4 py-3 rounded-lg text-text-muted hover:border-border-bright transition-colors cursor-pointer"
                >
                  ← CHANGE HANDLE
                </button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 font-mono text-sm font-bold bg-accent text-black py-3 rounded-lg glow-yellow-hover disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Checking Codeforces Profile…" : "I've Saved It — Confirm Verification ▸"}
                </motion.button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </PageLayout>
  );
}