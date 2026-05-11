import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, FolderGit2, PenTool, Smartphone } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL || "/";

// Новые, чистые тайминги
const FADE_DURATION = 4000;      // 4 секунды – осветление фона
const PERSONA_DELAY = 2000;      // 2 секунды – задержка перед появлением персонажа
const PERSONA_DURATION = 3000;   // 3 секунды – длительность появления персонажа
const ORIGINAL_LOAD_DELAY = 15000; // 15 секунд – начало загрузки оригиналов

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
  const [activeImage, setActiveImage] = useState("right");

  // Фон и затемнение
  const [bgImage, setBgImage] = useState(`${BASE_URL}images/compress/portfolio_background.png`);
  const [darkOverlayOpacity, setDarkOverlayOpacity] = useState(0.95);
  const [pulsateActive, setPulsateActive] = useState(false);

  // Персонаж и его оригиналы
  const [personaOpacity, setPersonaOpacity] = useState(0);
  const [rightOriginalReady, setRightOriginalReady] = useState(false);
  const [leftOriginalReady, setLeftOriginalReady] = useState(false);
  const [bgOriginalReady, setBgOriginalReady] = useState(false);

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false);

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

  // ========== ЧИСТЫЕ ТАЙМЕРЫ ЗАГРУЗКИ ==========

  // 1. Осветление фона (4 секунды)
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / FADE_DURATION, 1);
      setDarkOverlayOpacity(0.95 + progress * (0.18 - 0.95));
      if (progress >= 1) {
        clearInterval(timer);
        setPulsateActive(true);
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  // 2. Появление персонажа (задержка 2 с, затем 3 с)
  useEffect(() => {
    const delay = setTimeout(() => {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / PERSONA_DURATION, 1);
        setPersonaOpacity(progress);
        if (progress >= 1) clearInterval(timer);
      }, 16);
    }, PERSONA_DELAY);
    return () => clearTimeout(delay);
  }, []);

  // 3. Загрузка оригиналов через 15 секунд
  useEffect(() => {
    const delay = setTimeout(() => {
      console.log('⏳ Начинаем загрузку оригиналов...');
      const bgImg = new Image();
      bgImg.src = `${BASE_URL}images/portfolio_background.png`;
      bgImg.onload = () => {
        console.log('✅ Оригинал фона загружен');
        setBgOriginalReady(true);
      };
      bgImg.onerror = () => {
        console.warn('⚠️ Ошибка загрузки оригинала фона');
        setBgOriginalReady(true);
      };

      const rightImg = new Image();
      rightImg.src = `${BASE_URL}images/portfolio_ramzez_right.png`;
      rightImg.onload = () => {
        console.log('✅ Оригинал персонажа (право) загружен');
        setRightOriginalReady(true);
      };
      rightImg.onerror = () => {
        console.warn('⚠️ Ошибка загрузки оригинала персонажа (право)');
        setRightOriginalReady(true);
      };

      const leftImg = new Image();
      leftImg.src = `${BASE_URL}images/portfolio_ramzez_left.png`;
      leftImg.onload = () => {
        console.log('✅ Оригинал персонажа (лево) загружен');
        setLeftOriginalReady(true);
      };
      leftImg.onerror = () => {
        console.warn('⚠️ Ошибка загрузки оригинала персонажа (лево)');
        setLeftOriginalReady(true);
      };
    }, ORIGINAL_LOAD_DELAY);

    return () => clearTimeout(delay);
  }, []);

  // 4. Когда оригинал фона готов – подменяем
  useEffect(() => {
    if (bgOriginalReady) {
      console.log('🖼️ Подмена фона на оригинал');
      setBgImage(`${BASE_URL}images/portfolio_background.png`);
    }
  }, [bgOriginalReady]);

  // ========== ОСТАЛЬНАЯ ЛОГИКА (без изменений) ==========

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

      if (gamma > 25) {
        setActiveImage("right");
      } else if (gamma < -25) {
        setActiveImage("left");
      }

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

      <ParallaxLayer offset={offsets.layer1} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${bgImage})`, opacity: 1 }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.95) 100%)",
          }}
          animate={{
            opacity: pulsateActive ? [0.18, 0.22, 0.18] : darkOverlayOpacity,
          }}
          transition={{
            duration: pulsateActive ? 6 : 1.5,
            repeat: pulsateActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </ParallaxLayer>

      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center"
        style={{ opacity: personaOpacity, transition: 'opacity 0.5s' }}
      >
        <motion.img
          src={rightOriginalReady ? `${BASE_URL}images/portfolio_ramzez_right.png` : `${BASE_URL}images/compress/portfolio_ramzez_right.png`}
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
          src={leftOriginalReady ? `${BASE_URL}images/portfolio_ramzez_left.png` : `${BASE_URL}images/compress/portfolio_ramzez_left.png`}
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

      <ParallaxLayer
        offset={offsets.layer3}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div className={`h-full flex flex-col justify-end items-center px-4 ${isMobile ? "pb-12" : "pb-12 sm:pb-18"}`}>
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
                  <p className="text-white text-base sm:text-lg font-medium">{dialogues[dialogueIndex]}</p>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-auto w-full max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button onClick={() => {}} className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold">
                    <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6" /> Проекты
                  </button>
                  <button onClick={() => {}} className="flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/20 transition-all text-white font-semibold">
                    <PenTool className="w-5 h-5 sm:w-6 sm:h-6" /> Блог
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