import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
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
  const [highResBg, setHighResBg] = useState(`${BASE_URL}images/portfolio_background.png`);
  const [bgOpacity, setBgOpacity] = useState(1);

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();

  // Прогрессивная загрузка качественного фона
  useEffect(() => {
    const img = new Image();
    img.src = `${BASE_URL}images/originals/portfolio_background_original.png`;
    img.onload = () => {
      setHighResBg(img.src);
      setBgOpacity(0);
      requestAnimationFrame(() => {
        setBgOpacity(1);
      });
    };
    img.onerror = () => console.log("Оригинал не загружен, остаёмся на сжатом");
  }, []);

  // Свайпы и остальные хендлеры без изменений
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 50) return;
      if (deltaY > 0) {
        if (!showInterface) {
          if (dialogueIndex < dialogues.length - 1) {
            setDialogueIndex((prev) => prev + 1);
          } else {
            setShowInterface(true);
          }
          playClick();
        }
      } else {
        if (showInterface) {
          setShowInterface(false);
          setDialogueIndex(dialogues.length - 1);
        } else if (dialogueIndex > 0) {
          setDialogueIndex((prev) => prev - 1);
        }
        playClick();
      }
    },
    [dialogueIndex, showInterface, playClick]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // Гироскоп и определение мобильного
  const [gyroOffsets, setGyroOffsets] = useState({
    layer1: { x: 0, y: 0 },
    layer2: { x: 0, y: 0 },
    layer3: { x: 0, y: 0 },
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    let cleanup = () => {};

    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = gamma / 90;
      const normBeta = beta / 180;

      setGyroOffsets({
        layer1: { x: normGamma * 30, y: normBeta * 30 },
        layer2: {
          x: Math.max(-15, Math.min(15, normGamma * 50 * 0.02)),
          y: Math.max(-15, Math.min(15, normBeta * 50 * 0.02)),
        },
        layer3: { x: normGamma * 80, y: normBeta * 80 },
      });
    };

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            cleanup = () => window.removeEventListener("deviceorientation", handleOrientation);
          }
        } catch (error) {
          console.log("Ошибка запроса разрешения гироскопа:", error);
        }
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
        cleanup = () => window.removeEventListener("deviceorientation", handleOrientation);
      }
    };

    requestPermission();
    return cleanup;
  }, [isMobile]);

  const nextDialogue = () => {
    playClick();
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setShowInterface(true);
    }
  };

  const offsets = isMobile ? gyroOffsets : { layer1, layer2, layer3 };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-dvh overflow-hidden bg-black select-none"
      style={{ touchAction: isMobile ? "none" : "auto" }}
    >
      <MuteButton />

      {/* Слой 1: фон с прогрессивной загрузкой и масштабированием (mobile only) */}
      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          src={highResBg}
          alt="Фон"
          className="absolute inset-0 w-full h-full object-cover"
          animate={isMobile ? { scale: activeColumn ? 0.7 : 1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ opacity: bgOpacity, transition: 'opacity 1s' }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.95) 100%)",
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж */}
      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center pb-2 sm:pb-8"
      >
        <motion.img
          src={`${BASE_URL}images/portfolio_ramzez_right.png`}
          alt="Ramzez"
          className={`object-contain cursor-pointer ${
            isMobile ? "max-h-[85vh] max-w-none" : "max-h-[80vh]"
          }`}
          style={{ marginBottom: isMobile ? "-5px" : "-40px" }}
          animate={{ scale: activeColumn ? 0.7 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={nextDialogue}
        />
      </ParallaxLayer>

      {/* Слой 3: диалог и интерфейс */}
      <ParallaxLayer
        offset={offsets.layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div
          className={`h-full flex flex-col justify-end items-center px-4 ${
            isMobile ? "pb-12" : "pb-12 sm:pb-18"
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
                  <>
                    {isMobile ? (
                      <motion.div
                        initial={{ opacity: 0, x: "-100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute left-0 top-0 bottom-0 w-3/4 bg-black/80 backdrop-blur-md border-r border-white/20 p-4 overflow-y-auto z-30"
                      >
                        <button
                          onClick={() => setActiveColumn(null)}
                          className="absolute top-4 right-4 text-white/60 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-white text-xl font-bold mb-4">Проекты</h3>
                        <p className="text-gray-300">Скоро здесь будут мои работы.</p>
                      </motion.div>
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
                              ? "Скоро здесь будут мои работы."
                              : "Заметки о разработке."}
                          </p>
                        </GlassCard>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ParallaxLayer>
    </div>
  );
}
