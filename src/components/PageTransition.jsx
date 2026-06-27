import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/** Wraps a page so route changes animate in/out via AnimatePresence in App. */
export default function PageTransition({ children }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <motion.div
      variants={reduce ? undefined : variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
