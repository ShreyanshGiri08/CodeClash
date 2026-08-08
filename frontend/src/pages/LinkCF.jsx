import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { startCfVerification, confirmCfVerification } from "../api/auth";

export default function LinkCF() {
  const [handle, setHandle] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("enter-handle"); // enter-handle | confirm
  const navigate = useNavigate();

  async function handleStart(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await startCfVerification(handle);
      setVerifyCode(data.verify_code);
      setStep("confirm");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirm() {
    setError("");
    try {
      await confirmCfVerification();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 p-8 rounded-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-yellow-400">Link your Codeforces handle</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {step === "enter-handle" ? (
          <form onSubmit={handleStart} className="space-y-4">
            <input
              placeholder="Your Codeforces handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            />
            <button className="w-full bg-yellow-400 text-black font-bold p-2 rounded">
              Continue
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="text-zinc-400">
              Go to your{" "}
              <a href="https://codeforces.com/settings/social" target="_blank" rel="noreferrer" className="text-yellow-400 underline">
                Codeforces profile settings
              </a>{" "}
              and paste this into your <strong>First Name</strong> field, then save:
            </p>
            <code className="block bg-zinc-800 p-3 rounded text-yellow-400 text-center text-lg">
              {verifyCode}
            </code>
            <button onClick={handleConfirm} className="w-full bg-yellow-400 text-black font-bold p-2 rounded">
              I've added it — Verify
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}