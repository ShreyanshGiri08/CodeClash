import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { updateProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PageLayout from "../components/layout/PageLayout";
import toast from "react-hot-toast";

const AVATARS = [
  { id: "avatar1", emoji: "⚡", label: "Lightning" },
  { id: "avatar2", emoji: "🔥", label: "Fire" },
  { id: "avatar3", emoji: "💀", label: "Skull" },
  { id: "avatar4", emoji: "🎯", label: "Target" },
  { id: "avatar5", emoji: "🚀", label: "Rocket" },
  { id: "avatar6", emoji: "⚔️", label: "Swords" },
  { id: "avatar7", emoji: "🏆", label: "Trophy" },
  { id: "avatar8", emoji: "💎", label: "Diamond" },
  { id: "avatar9", emoji: "🐉", label: "Dragon" },
  { id: "avatar10", emoji: "👾", label: "Alien" },
  { id: "avatar11", emoji: "🦊", label: "Fox" },
  { id: "avatar12", emoji: "🎮", label: "Controller" },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "avatar1");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || null,
        avatar: selectedAvatar,
      });
      updateUser({ display_name: displayName, avatar: selectedAvatar });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (!user) return null;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs border border-border/80 rounded-xl px-4 py-2 text-text-muted hover:border-accent hover:text-accent transition-all shadow-sm"
        >
          ← BACK TO DASHBOARD
        </Link>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white font-mono">ACCOUNT SETTINGS</h1>
          <p className="text-text-muted text-xs font-mono">// MANAGE YOUR COMPETITOR PROFILE & PREFERENCES</p>
        </motion.div>

        {/* Avatar Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0b0b10]/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          <p className="font-mono text-xs font-extrabold text-accent tracking-widest">// SELECT YOUR ESPORTS AVATAR</p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2.5">
            {AVATARS.map((av) => (
              <motion.button
                key={av.id}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAvatar(av.id)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all ${
                  selectedAvatar === av.id
                    ? "bg-accent/25 border-2 border-accent text-accent shadow-[0_0_20px_rgba(255,230,12,0.4)]"
                    : "bg-black/60 border border-border/80 hover:border-accent/50 text-white"
                }`}
                title={av.label}
              >
                {av.emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Display Name Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0b0b10]/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          <p className="font-mono text-xs font-extrabold text-accent tracking-widest">// CUSTOM DISPLAY NAME</p>
          <input
            placeholder="Enter custom display name..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/70 border border-border/80 focus:border-accent text-sm font-mono text-white placeholder:text-text-dim outline-none transition-all"
          />
          <p className="text-text-muted text-xs font-mono leading-relaxed">
            If specified, this name will be displayed publicly on the global leaderboard and 1v1 match arenas.
          </p>
        </motion.div>

        {/* CF Handle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0b0b10]/90 backdrop-blur-2xl border border-accent/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          <p className="font-mono text-xs font-extrabold text-accent tracking-widest">// CODEFORCES VERIFIED HANDLE</p>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-border/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-black text-white">{user.cf_handle || "Not Linked"}</span>
              {user.cf_verified && (
                <span className="font-mono text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-lg px-3 py-1 shadow-sm flex items-center gap-1">
                  <span>✓</span> VERIFIED
                </span>
              )}
            </div>
            <Link
              to="/link-cf"
              className="font-mono text-xs font-extrabold bg-accent/15 border border-accent/50 text-accent px-4 py-2 rounded-xl hover:bg-accent hover:text-black transition-all shadow-sm"
            >
              {user.cf_handle ? "Re-link Handle →" : "Link Codeforces Handle →"}
            </Link>
          </div>
        </motion.div>

        {/* Save & Signout Actions */}
        <div className="flex items-center gap-4 pt-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-sm font-black bg-accent text-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,230,12,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {saving ? "SAVING CHANGES..." : "✓ SAVE SETTINGS"}
          </motion.button>

          <button
            onClick={handleLogout}
            className="font-mono text-xs text-status-error hover:underline transition-colors cursor-pointer px-4 py-2"
          >
            🚪 Sign Out of Account
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
