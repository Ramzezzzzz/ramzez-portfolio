import { useState } from "react";
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
  const { layer1, layer2, layer3 } = useMouseParallax();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showInterface, setShowInterface] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null); // 'projects' | 'blog'

  // Переход к следующей фразе (вызывается по клику на персонажа или пузырь)
  const nextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setShowInterface(true); // показать кнопки вместо диалога
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Слой 1: фон + затемняющий градиент */}
      <ParallaxLayer offset={layer1} className="absolute inset-0 z-0">
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
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж (прижат к низу) */}
      <ParallaxLayer
        offset={layer2}
        className="absolute inset-0 z-10 flex items-end justify-center pb-4 sm:pb-8"
      >
        <img
          src={`${BASE_URL}images/portfolio_ramzez_right.png`}
          alt="Ramzez"
          className="max-h-[70vh] sm:max-h-[80vh] object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          style={{ marginBottom: "-5px" }}
          onClick={nextDialogue}
        />
      </ParallaxLayer>

      {/* Слой 3: диалог и интерфейс */}
      <ParallaxLayer
        offset={layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div className="h-full flex flex-col justify-end items-center pb-24 sm:pb-32 px-4">
          <AnimatePresence mode="wait">
            {!showInterface ? (
              <motion.div
                key={dialogueIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-auto cursor-pointer mb-4"
                onClick={nextDialogue}
              >
                <GlassCard className="max-w-md mx-auto flex items-center gap-4 px-6 py-4">
                  <MessageCircle className="w-6 h-6 text-red-400 shrink-0" />
                  <p className="text-white text-lg font-medium">
                    {dialogues[dialogueIndex]}
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              // Интерфейс с кнопками / колонками
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-auto w-full max-w-6xl mx-auto"
              >
                {!activeColumn ? (
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => setActiveColumn("projects")}
                      className="flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                    >
                      <FolderGit2 className="w-6 h-6" />
                      Проекты
                    </button>
                    <button
                      onClick={() => setActiveColumn("blog")}
                      className="flex items-center gap-3 px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                    >
                      <PenTool className="w-6 h-6" />
                      Блог
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <GlassCard className="max-w-lg w-full relative">
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
