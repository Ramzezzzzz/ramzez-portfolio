import { motion } from "framer-motion";

export default function ParallaxLayer({ children, offset, className, style }) {
  return (
    <motion.div
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 100, damping: 50, mass: 0.3 }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
