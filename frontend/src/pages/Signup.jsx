import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signup, getMe } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(email, password);
      localStorage.setItem("token", data.token);

      let user = null;
      try {
        user = await getMe();
      } catch (err) {
        user = {
          id: data.user_id,
          email: email,
          cf_handle: null,
          cf_verified: false,
          elo: 1200,
          avatar: "avatar1",
        };
      }

      authLogin(data.token, user);
      navigate("/link-cf");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError("Unable to reach server endpoint. Retrying connection...");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }




  }

  return (
    <PageLayout hideFooter>
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
          className="relative z-10 bg-bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-5"
        >
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold">Create your account</h1>
            <p className="text-text-muted text-sm mt-1">
              Welcome! Fill in the details to get started.
            </p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-status-error text-sm bg-status-error/10 border border-status-error/20 rounded px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">Email address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-dim"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-dim pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors cursor-pointer"
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-bold py-2.5 rounded-lg text-sm glow-yellow-hover disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating account…" : "Continue ▸"}
          </motion.button>

          <p className="text-text-muted text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </motion.form>
      </div>
    </PageLayout>
  );
}