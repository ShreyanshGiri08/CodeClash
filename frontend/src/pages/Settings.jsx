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
      toast.success("Profile updated!");
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs border border-border rounded px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors mb-8"
        >
          ← BACK
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-8">SETTINGS</h1>
        </motion.div>

        {/* Avatar Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-card border border-border rounded-lg p-6 mb-6"
        >
          <p className="font-mono text-xs text-text-dim tracking-wider mb-4">AVATAR</p>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {AVATARS.map((av) => (
              <motion.button
                key={av.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAvatar(av.id)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl cursor-pointer transition-all ${
                  selectedAvatar === av.id
                    ? "bg-accent/20 border-2 border-accent"
                    : "bg-bg-elevated border border-border hover:border-border-bright"
                }`}
                title={av.label}
              >
                {av.emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Display Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-card border border-border rounded-lg p-6 mb-6"
        >
          <p className="font-mono text-xs text-text-dim tracking-wider mb-3">DISPLAY NAME</p>
          <input
            placeholder="Optional display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-sm text-text-primary placeholder:text-text-dim mb-3"
          />
          <p className="text-text-dim text-xs">
            If set, this will be shown instead of your email on the dashboard and leaderboard.
          </p>
        </motion.div>

        {/* CF Handle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-card border border-border rounded-lg p-6 mb-6"
        >
          <p className="font-mono text-xs text-text-dim tracking-wider mb-3">CODEFORCES HANDLE</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{user.cf_handle || "Not linked"}</span>
            {user.cf_verified && (
              <span className="font-mono text-xs bg-status-live/10 text-status-live border border-status-live/20 rounded px-2 py-0.5">
                ✓ Verified
              </span>
            )}
          </div>
          <Link to="/link-cf" className="text-accent text-xs hover:underline mt-2 inline-block">
            {user.cf_handle ? "Re-link handle →" : "Link your handle →"}
          </Link>
        </motion.div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-sm font-bold bg-accent text-black px-6 py-2.5 rounded glow-yellow-hover disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : "Save changes"}
          </motion.button>

          <button
            onClick={handleLogout}
            className="font-mono text-xs text-text-muted hover:text-status-error transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
