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
  const [bgScale, setBgScale] = useState(1); // 1 = 35mm, 0.4 = 75mm

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();

  // Смена объектива
  useEffect(() => {
    setBgScale(activeColumn ? 0.4 : 1);
  }, [activeColumn]);

  // Прогрессивная загрузка фона
  useEffect(() => {
    const img = new Image();
    img.src = `${BASE_URL}images/originals/portfolio_background_original.png`;
    img.onload = () => {
      setHighResBg(img.src);
      setBgOpacity(0);
      requestAnimationFrame(() => setBgOpacity(1));
    };
    img.onerror = () => console.log("Оригинал не загружен, остаёмся на сжатом");
  }, []);

  // Свайпы
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

  // Гироскоп
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

      {/* Слой 1: огромный фон (200vw x 200vh) – не обрезается при scale */}
      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute"
          style={{
            width: "200vw",
            height: "200vh",
            left: "-50vw",
            top: "-50vh",
            backgroundImage: `url(${highResBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgOpacity,
          }}
          animate={{ scale: bgScale }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.95) 100%)",
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж (статичен) */}
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
          onClick={nextDialogue}
        />
      </ParallaxLayer>

      {/* Слой 3: диалог + контент */}
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
                  <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl">
                      <GlassCard className="!rounded-2xl">
                        <h3 className="text-white text-xl font-bold mb-3">Проект 1</h3>
                        <p className="text-gray-300">Описание первого проекта.</p>
                      </GlassCard>
                      <GlassCard className="!rounded-2xl">
                        <h3 className="text-white text-xl font-bold mb-3">Проект 2</h3>
                        <p className="text-gray-300">Описание второго проекта.</p>
                      </GlassCard>
                    </div>
                    <button
                      onClick={() => setActiveColumn(null)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Скрыть проекты
                    </button>
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