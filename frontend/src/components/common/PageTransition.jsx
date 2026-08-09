import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, scale: 1.01, filter: "blur(4px)" }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1], // Custom snappy cubic bezier
      }}
      className="w-full flex-1 flex flex-col relative"
    >
      {children}
    </motion.div>
  );
}
