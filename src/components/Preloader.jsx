import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL || "/";

export default function Preloader({ progress, onComplete }) {
  const [darken, setDarken] = useState(false);

  useEffect(() => {
    // Через 100 мс начинаем затемнение (чтобы сначала показать светлый фон)
    const timer = setTimeout(() => setDarken(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(onComplete, 1500); // даём минимум 1,5 секунды на завершение
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-6"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Фоновое изображение с затемнением */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "black" }}
        animate={{ opacity: darken ? 0.8 : 0.2 }}
        transition={{ duration: 1.5 }}
      />

      {/* Иконка загрузки */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative z-10"
      >
        <Loader2 className="w-12 h-12 text-red-500" />
      </motion.div>

      {/* Прогресс‑бар */}
      <div className="relative z-10 w-48 h-2 bg-zinc-700 rounded-full overflow-hidden">
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
