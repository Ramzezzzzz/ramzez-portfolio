import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, FolderGit2, PenTool } from "lucide-react";

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
  const [activeImage, setActiveImage] = useState("right"); // "left" или "right"
  const [highResBg, setHighResBg] = useState(
    `${BASE_URL}images/portfolio_background.png`
  );
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

  // Гироскоп (включая выбор изображения) и определение мобильного
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
      const gamma = event.gamma || 0; // -90..90 (влево-вправо)
      const beta = event.beta || 0;
      const normGamma = gamma / 90;
      const normBeta = beta / 180;

      // Выбор изображения в зависимости от наклона
      if (gamma > 5) {
        setActiveImage("right");
      } else if (gamma < -5) {
        setActiveImage("left");
      }
      // (при |gamma| <= 5 остаётся предыдущее)

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
            cleanup = () =>
              window.removeEventListener(
                "deviceorientation",
                handleOrientation
              );
          }
        } catch (error) {
          console.log("Ошибка запроса разрешения гироскопа:", error);
        }
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
        cleanup = () =>
          window.removeEventListener("deviceorientation", handleOrientation);
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
  const personaScale = isMobile ? 1.0 : 1.2; // настройка размера

  return (
    <div
      ref={containerRef}
      className="relative w-full h-dvh overflow-hidden bg-black select-none"
      style={{ touchAction: isMobile ? "none" : "auto" }}
    >
      <MuteButton />

      {/* Слой 1: фон */}
      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 w-full h-full bg-center bg-cover"
          style={{
            backgroundImage: `url(${highResBg})`,
            opacity: bgOpacity,
          }}
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

      {/* Слой 2: персонаж (два изображения с переходами) */}
      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center pb-2 sm:pb-8"
      >
        <div className="relative" style={{ height: "100vh", width: "100%" }}>
          <motion.img
            src={`${BASE_URL}images/portfolio_ramzez_right.png`}
            alt="Ramzez right"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain"
            style={{
              height: "100%",
              marginBottom: isMobile ? "-5px" : "-40px",
              scale: personaScale,
            }}
            animate={{ opacity: activeImage === "right" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.img
            src={`${BASE_URL}images/portfolio_ramzez_left.png`}
            alt="Ramzez left"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 object-contain"
            style={{
              height: "100%",
              marginBottom: isMobile ? "-5px" : "-40px",
              scale: personaScale,
            }}
            animate={{ opacity: activeImage === "left" ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </ParallaxLayer>

      {/* Слой 3: диалог и кнопки */}
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
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => {}} // заглушка
                    className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                  >
                    <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    Проекты
                  </button>
                  <button
                    onClick={() => {}} // заглушка
                    className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold"
                  >
                    <PenTool className="w-5 h-5 sm:w-6 sm:h-6" />
                    Блог
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ParallaxLayer>
    </div>
  );
}
