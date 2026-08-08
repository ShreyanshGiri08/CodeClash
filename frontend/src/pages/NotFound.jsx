import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayout from "../components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-6xl mb-4">💀</p>
          <h1 className="text-3xl font-extrabold mb-3">Page not found</h1>
          <p className="text-text-muted text-sm mb-8 max-w-md">
            This page doesn't exist. Maybe it got bodied in a race and never came back.
          </p>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-mono text-sm font-bold bg-accent text-black px-6 py-2.5 rounded glow-yellow cursor-pointer"
            >
              Go home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </PageLayout>
  );
}
