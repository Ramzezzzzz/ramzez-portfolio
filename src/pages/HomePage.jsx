import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { MessageCircle, FolderGit2, PenTool, X } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL || "/";

const dialogues = [
  "Привет! Я Ramzez.",
  "Хочешь чаю с чак-чаком?",
  "Здесь мои проекты и мысли.",
  "Устраивайся поудобнее.",
];

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { layer1, layer2, layer3 } = useMouseParallax();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showInterface, setShowInterface] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setShowInterface(true);
    }
  };

  // Параллакс‑смещения только для десктопа
  const offsets = {
    layer1: isMobile ? { x: 0, y: 0 } : layer1,
    layer2: isMobile ? { x: 0, y: 0 } : layer2,
    layer3: isMobile ? { x: 0, y: 0 } : layer3,
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Слой 1: фон + затемняющий радиальный градиент */}
      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
          }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж (на мобильных – статичен) */}
      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center pb-2 sm:pb-8"
      >
        <img
          src={`${BASE_URL}images/portfolio_ramzez_right.png`}
          alt="Ramzez"
          className={`max-h-[65vh] sm:max-h-[80vh] object-contain cursor-pointer transition-transform duration-300 ${
            isMobile ? "hover:scale-100" : "hover:scale-[1.02]"
          }`}
          style={{ marginBottom: isMobile ? "-5px" : "-25px" }}
          onClick={nextDialogue}
        />
      </ParallaxLayer>

      {/* Слой 3: диалог и интерфейс (на мобильных – без параллакса) */}
      <ParallaxLayer
        offset={offsets.layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div
          className={`h-full flex flex-col justify-end items-center px-4 ${
            isMobile ? "pb-16" : "pb-24 sm:pb-32"
          }`}
        >
          <AnimatePresence mode="wait">
            {!showInterface ? (
              <motion.div
                key={dialogueIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-auto cursor-pointer mb-2 sm:mb-4 w-full max-w-md"
                onClick={nextDialogue}
              >
                <GlassCard className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 !rounded-2xl">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
                  <p className="text-white text-base sm:text-lg font-medium">
                    {dialogues[dialogueIndex]}
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-auto w-full max-w-6xl mx-auto"
              >
                {!activeColumn ? (
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                      onClick={() => setActiveColumn("projects")}
                      className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                    >
                      <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      Проекты
                    </button>
                    <button
                      onClick={() => setActiveColumn("blog")}
                      className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                    >
                      <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
                      Блог
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <GlassCard className="max-w-lg w-full relative !rounded-2xl">
                      <button
                        onClick={() => setActiveColumn(null)}
                        className="absolute top-3 right-3 text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-white text-xl font-bold mb-3">
                        {activeColumn === "projects" ? "Проекты" : "Блог"}
                      </h3>
                      <p className="text-gray-300">
                        {activeColumn === "projects"
                          ? "Скоро здесь появятся мои работы."
                          : "Заметки о разработке."}
                      </p>
                    </GlassCard>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ParallaxLayer>
    </div>
  );
}
