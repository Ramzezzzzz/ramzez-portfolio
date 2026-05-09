import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, FolderGit2, PenTool, Smartphone, X } from "lucide-react";

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
  const [activeColumn, setActiveColumn] = useState(null); // 'projects' | 'blog' | null
  const [activeImage, setActiveImage] = useState("right");
  const [highResBg, setHighResBg] = useState(`${BASE_URL}images/portfolio_background.png`);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [preloaderOpacity, setPreloaderOpacity] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false);

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();

  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === "granted") {
        setGyroPermissionGranted(true);
      }
    } else {
      setGyroPermissionGranted(true);
    }
  };

  // Прелоадер
  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();
    const imagesToLoad = [
      `${BASE_URL}images/originals/portfolio_background_original.png`,
      `${BASE_URL}images/portfolio_ramzez_right.png`,
      `${BASE_URL}images/portfolio_ramzez_left.png`,
    ];
    let loadedCount = 0;

    imagesToLoad.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!cancelled) {
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / imagesToLoad.length) * 100));
          if (loadedCount === imagesToLoad.length) {
            setHighResBg(`${BASE_URL}images/originals/portfolio_background_original.png`);
            setBgOpacity(1);
            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, 1500 - elapsed);
            setTimeout(() => setPreloaderOpacity(0), delay);
          }
        }
      };
      img.onerror = () => {
        if (!cancelled) {
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / imagesToLoad.length) * 100));
          if (loadedCount === imagesToLoad.length) {
            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, 1500 - elapsed);
            setTimeout(() => setPreloaderOpacity(0), delay);
          }
        }
      };
    });

    return () => { cancelled = true; };
  }, []);

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
    if (!isMobile || !gyroPermissionGranted) return;
    let cleanup = () => {};

    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = gamma / 90;
      const normBeta = beta / 180;

      if (gamma > 25) setActiveImage("right");
      else if (gamma < -25) setActiveImage("left");

      setGyroOffsets({
        layer1: { x: normGamma * 50, y: normBeta * 50 },
        layer2: {
          x: Math.max(-20, Math.min(20, normGamma * 80 * 0.02)),
          y: Math.max(-20, Math.min(20, normBeta * 80 * 0.02)),
        },
        layer3: { x: normGamma * 120, y: normBeta * 120 },
      });
    };

    window.addEventListener("deviceorientation", handleOrientation);
    cleanup = () => window.removeEventListener("deviceorientation", handleOrientation);

    return cleanup;
  }, [isMobile, gyroPermissionGranted]);

  const nextDialogue = () => {
    playClick();
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      setShowInterface(true);
    }
  };

  const offsets = isMobile ? gyroOffsets : { layer1, layer2, layer3 };
  const personaScale = isMobile ? 1.0 : 1.2;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-dvh overflow-hidden bg-black select-none"
      style={{ touchAction: isMobile ? "none" : "auto" }}
    >
      <MuteButton />
      {isMobile && !gyroPermissionGranted && (
        <button
          onClick={requestGyroPermission}
          className="fixed top-14 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
          aria-label="Активировать движение"
        >
          <Smartphone className="w-5 h-5" />
        </button>
      )}

      {/* Слой 1: фон с зумом */}
      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 w-full h-full bg-center"
          style={{
            backgroundImage: `url(${highResBg})`,
            backgroundRepeat: "no-repeat",
            opacity: bgOpacity,
          }}
          animate={{ backgroundSize: activeColumn ? "200%" : "cover" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.95) 100%)",
          }}
          animate={{ opacity: preloaderOpacity === 0 ? 0.2 : 0.8 }}
          transition={{ duration: 1.5 }}
        />
      </ParallaxLayer>

      {/* Слой 2: персонаж */}
      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center"
      >
        <motion.img
          src={`${BASE_URL}images/portfolio_ramzez_right.png`}
          alt="Ramzez right"
          className="object-contain cursor-pointer"
          style={{
            opacity: activeImage === "right" ? 1 : 0,
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "none",
            maxHeight: `${personaScale * 100}vh`,
          }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          onClick={nextDialogue}
        />
        <motion.img
          src={`${BASE_URL}images/portfolio_ramzez_left.png`}
          alt="Ramzez left"
          className="object-contain cursor-pointer"
          style={{
            opacity: activeImage === "left" ? 1 : 0,
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "none",
            maxHeight: `${personaScale * 100}vh`,
          }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          onClick={nextDialogue}
        />
      </ParallaxLayer>

      {/* Слой 3: диалог и карточки проектов */}
      <ParallaxLayer
        offset={offsets.layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div className="h-full flex flex-col justify-end items-center px-4 pb-12 sm:pb-18">
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
                  <div className="relative w-full h-64 mt-4">
                    {/* Левая колонка проектов */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2"
                    >
                      <GlassCard className="!rounded-2xl p-3 flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-red-400" />
                        <span className="text-white text-sm">Проект 1</span>
                      </GlassCard>
                      <GlassCard className="!rounded-2xl p-3 flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-red-400" />
                        <span className="text-white text-sm">Проект 2</span>
                      </GlassCard>
                    </motion.div>

                    {/* Правая колонка проектов */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2"
                    >
                      <GlassCard className="!rounded-2xl p-3 flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-red-400" />
                        <span className="text-white text-sm">Проект 3</span>
                      </GlassCard>
                      <GlassCard className="!rounded-2xl p-3 flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-red-400" />
                        <span className="text-white text-sm">Проект 4</span>
                      </GlassCard>
                    </motion.div>

                    <button
                      onClick={() => setActiveColumn(null)}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 text-red-400 hover:text-red-300 transition-colors"
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

      <motion.div
        className="absolute inset-0 z-50 pointer-events-none bg-black"
        animate={{ opacity: preloaderOpacity }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </div>
  );
}