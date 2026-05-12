import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '' }) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.25)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,80,80,0.3)] p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}