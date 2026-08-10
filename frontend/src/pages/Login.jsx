import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/auth";
import PageLayout from "../components/layout/PageLayout";

export default function Login() {
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
      const data = await apiLogin(email, password);
      localStorage.setItem("token", data.token);

      const fetchedUser = await getMe().catch(() => null);

      if (fetchedUser) {
        authLogin(data.token, fetchedUser);
        if (fetchedUser.cf_verified || fetchedUser.cf_handle) {
          navigate("/dashboard");
        } else {
          navigate("/link-cf");
        }
      } else {
        authLogin(data.token, { id: data.user_id, email });
        navigate("/dashboard");
      }

    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setError("Account not found. Please click Sign up below to create a new account!");
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
            <h1 className="text-xl font-bold">Welcome back</h1>
            <p className="text-text-muted text-sm mt-1">
              Sign in to continue racing.
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
              placeholder="Enter your email"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            {loading ? "Signing in…" : "Sign in ▸"}
          </motion.button>

          <p className="text-text-muted text-sm text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </motion.form>
      </div>
    </PageLayout>
  );
}