import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL || "/";

export default function Preloader({ progress }) {
  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-6"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Фоновое изображение */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
        }}
      />
      {/* Усиленное затемнение с пульсацией */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 10%, rgba(0,0,0,0.97) 100%)",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Спиннер */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-12 h-12 text-red-400/80" />
      </motion.div>
      {/* Прогресс-бар (опционально) */}
      <div className="relative z-10 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
