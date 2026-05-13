import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, FolderGit2, PenTool, Smartphone } from "lucide-react";

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
  const [activeImage, setActiveImage] = useState("right");

  const [blackOverlayOpacity, setBlackOverlayOpacity] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const [personaOpacity, setPersonaOpacity] = useState(0);
  const [allowDialogue, setAllowDialogue] = useState(false);

  const [originalReady, setOriginalReady] = useState(false);
  const [originalShown, setOriginalShown] = useState(false);

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false);

  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === "granted") setGyroPermissionGranted(true);
    } else {
      setGyroPermissionGranted(true);
    }
  };

  // 1. Прелоадер (2.8 секунды)
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 2800, 1);
      setLoadingProgress(Math.floor(progress * 100));
      setBlackOverlayOpacity(1 - progress);
      if (progress >= 1) {
        clearInterval(timer);
        setPreloaderVisible(false);
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  // 2. Появление персонажа (0.6 с после прелоадера)
  useEffect(() => {
    if (preloaderVisible) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPersonaOpacity(eased);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [preloaderVisible]);

  // 3. Разрешить диалог (3.5 с)
  useEffect(() => {
    const delay = setTimeout(() => setAllowDialogue(true), 3500);
    return () => clearTimeout(delay);
  }, []);

  // 4. Загрузка оригинала фона (минимум 5 с)
  useEffect(() => {
    let minTimerPassed = false;
    let imageLoaded = false;
    const minTimer = setTimeout(() => {
      minTimerPassed = true;
      if (imageLoaded) setOriginalShown(true);
    }, 5000);

    console.log('⏳ Загружаем оригинал фона...');
    const img = new Image();
    img.src = `${BASE_URL}images/portfolio_background.png`;
    img.onload = () => {
      console.log('✅ Оригинал фона загружен');
      setOriginalReady(true);
      imageLoaded = true;
      if (minTimerPassed) setOriginalShown(true);
    };
    img.onerror = () => {
      console.warn('⚠️ Ошибка загрузки оригинала');
      setOriginalReady(true);
      imageLoaded = true;
      if (minTimerPassed) setOriginalShown(true);
    };
    return () => clearTimeout(minTimer);
  }, []);

  // Свайпы
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 50) return;
      if (!allowDialogue) return;
      if (deltaY > 0) {
        if (!showInterface) {
          if (dialogueIndex < dialogues.length - 1) setDialogueIndex(prev => prev + 1);
          else setShowInterface(true);
          playClick();
        }
      } else {
        if (showInterface) {
          setShowInterface(false);
          setDialogueIndex(dialogues.length - 1);
        } else if (dialogueIndex > 0) {
          setDialogueIndex(prev => prev - 1);
        }
        playClick();
      }
    },
    [dialogueIndex, showInterface, playClick, allowDialogue]
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
        layer1: { x: normGamma * 50, y: normBeta * 30 },
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

  // Продвижение диалога
  const nextDialogue = () => {
    if (!allowDialogue) return;
    playClick();
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      setShowInterface(true);
    }
  };

  // Клик по угощениям – продолжает диалог и убирает их
  const handleTreatsClick = () => {
    if (!allowDialogue) return;
    playClick();
    setDialogueIndex(prev => prev + 1);
  };

  // УСИЛЕННЫЙ ГОРИЗОНТАЛЬНЫЙ ПАРАЛЛАКС ДЛЯ ФОНА
  const backgroundOffset = {
    x: (isMobile ? gyroOffsets.layer1.x : layer1.x) * 2.5, // усиливаем в 2.5 раза
    y: 0, // вертикаль оставляем без параллакса
  };

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

      {/* Слой 0: фон (ТОЛЬКО ГОРИЗОНТАЛЬНЫЙ ПАРАЛЛАКС) */}
      <ParallaxLayer offset={backgroundOffset} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
            opacity: originalShown ? 1 : 0,
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${BASE_URL}images/compress/portfolio_background.png)`,
            opacity: originalShown ? 0 : 1,
          }}
        />
      </ParallaxLayer>

      {/* Постоянное затемнение (виньетка) */}
      <div
        className="absolute inset-0 z-5 pointer-events-none dark-gradient-fix"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 20%, rgba(0,0,0,1) 100%)",
          opacity: 0.6,
        }}
      />

      {/* Прелоадер */}
      {preloaderVisible && (
        <motion.div
          className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center pointer-events-none"
          animate={{ opacity: blackOverlayOpacity }}
          transition={{ duration: 1.5 }}
        >
          <div className="text-white text-sm mb-4">Загрузка...</div>
          <div className="w-48 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Слой 2: персонаж */}
      <ParallaxLayer
        offset={offsets.layer2}
        className="absolute inset-0 z-10 flex items-end justify-center"
        style={{ opacity: personaOpacity, transition: 'opacity 0.5s' }}
      >
        <motion.img
          src={`${BASE_URL}images/compress/portfolio_ramzez_right.png`}
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
          src={`${BASE_URL}images/compress/portfolio_ramzez_left.png`}
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

      {/* Статичный слой для облаков и картинок */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className={`h-full flex flex-col justify-end items-center px-4 ${isMobile ? "pb-12" : "pb-12 sm:pb-18"}`}>
          <AnimatePresence mode="wait">
            {!showInterface && allowDialogue && dialogueIndex === 0 && (
              <motion.div
                key="dialogue-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-auto cursor-pointer mb-2 sm:mb-4 w-full max-w-md"
                onClick={nextDialogue}
              >
                <GlassCard className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 !rounded-2xl">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
                  <p className="text-white text-base sm:text-lg font-medium">{dialogues[0]}</p>
                </GlassCard>
              </motion.div>
            )}
            {!showInterface && allowDialogue && dialogueIndex === 1 && (
              <motion.div
                key="dialogue-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-auto cursor-pointer mb-2 sm:mb-4 w-full max-w-md"
                onClick={nextDialogue}
              >
                <GlassCard className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 !rounded-2xl">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
                  <p className="text-white text-base sm:text-lg font-medium">{dialogues[1]}</p>
                </GlassCard>
              </motion.div>
            )}
            {!showInterface && allowDialogue && dialogueIndex >= 3 && (
              <motion.div
                key={`dialogue-${dialogueIndex}`}
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
            )}
            {showInterface && (
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

          {/* Картинки чая и чак-чака (только при dialogueIndex === 2) */}
          <AnimatePresence>
            {dialogueIndex === 2 && allowDialogue && !showInterface && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Чай */}
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: isMobile ? '10%' : '25%',
                    bottom: '40%',
                    width: '96px',
                    height: '96px',
                  }}
                  onClick={handleTreatsClick}
                  variants={{
                    hidden: { opacity: 0, x: -30 },
                    visible: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -30, transition: { duration: 0.5 } },
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                >
                  <motion.img
                    src={`${BASE_URL}images/tea.png`}
                    alt="Чай"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(255,80,80,0.6))',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                </motion.div>

                {/* Чак-чак */}
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    right: isMobile ? '10%' : '25%',
                    bottom: '40%',
                    width: '96px',
                    height: '96px',
                  }}
                  onClick={handleTreatsClick}
                  variants={{
                    hidden: { opacity: 0, x: 30 },
                    visible: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 30, transition: { duration: 0.5 } },
                  }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                >
                  <motion.img
                    src={`${BASE_URL}images/chakchak.png`}
                    alt="Чак-чак"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(255,80,80,0.6))',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}