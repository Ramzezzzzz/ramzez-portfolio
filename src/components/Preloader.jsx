import { motion } from "framer-motion";
import { Film } from "lucide-react";

export default function Preloader({ progress }) {
  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Film className="w-16 h-16 text-red-500" />
      </motion.div>
      <div className="text-white text-sm">Загрузка...</div>
      <div className="w-48 h-2 bg-zinc-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-red-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
