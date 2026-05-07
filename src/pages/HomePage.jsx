import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { MessageCircle } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL || "/";

// Массив диалогов новеллы
const dialogues = [
  "Привет! Я Ramzez.",
  "Хочешь чаю с чак-чаком?",
  "Здесь мои проекты и мысли.",
  "Устраивайся поудобнее.",
];

export default function HomePage() {
  const { layer1, layer2, layer3 } = useMouseParallax();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Прокрутка диалогов по клику или автоматически через 3 секунды
  useEffect(() => {
    if (dialogueIndex < dialogues.length - 1) {
      const timer = setTimeout(
        () => setDialogueIndex((prev) => prev + 1),
        3000
      );
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [dialogueIndex]);

  const handleNextDialogue = () => {
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setShowContent(true);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Слой 1: фон */}
      <ParallaxLayer offset={layer1} className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center opacity-70"
          style={{
            backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
          }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж */}
      <ParallaxLayer
        offset={layer2}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <img
          src={`${BASE_URL}images/portfolio_ramzez_right.png`}
          alt="Ramzez"
          className="max-h-[80%] object-contain pointer-events-none select-none"
        />
      </ParallaxLayer>

      {/* Слой 3: контент (диалоги + карточки) */}
      <ParallaxLayer
        offset={layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div className="h-full flex flex-col justify-end pb-8 px-4 sm:px-12 lg:px-24">
          {/* Диалоговый пузырь */}
          <AnimatePresence mode="wait">
            {!showContent ? (
              <motion.div
                key={dialogueIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-auto self-center mb-4 cursor-pointer"
                onClick={handleNextDialogue}
              >
                <GlassCard className="max-w-md mx-auto flex items-center gap-4">
                  <MessageCircle className="w-6 h-6 text-red-400" />
                  <p className="text-white text-lg font-medium">
                    {dialogues[dialogueIndex]}
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              // Когда диалоги закончились, показываем карточки проектов (заглушки)
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-auto flex gap-8 justify-center"
              >
                <GlassCard>
                  <h3 className="text-white text-xl font-bold">Проекты</h3>
                  <p className="text-gray-300">Скоро здесь будут мои работы.</p>
                </GlassCard>
                <GlassCard>
                  <h3 className="text-white text-xl font-bold">Блог</h3>
                  <p className="text-gray-300">Заметки о разработке.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ParallaxLayer>
    </div>
  );
}
