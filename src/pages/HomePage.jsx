import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, FolderGit2, PenTool, Smartphone } from "lucide-react";
import Card3D from "../components/Card3D";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

  const [originalShown, setOriginalShown] = useState(false);
  const [personaOriginalsReady, setPersonaOriginalsReady] = useState(false);

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const playClick = useClickSound();
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false);
  const [shadowOpacity, setShadowOpacity] = useState(0);
  const [modelReady, setModelReady] = useState(false);

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

  useEffect(() => {
  const loader = new GLTFLoader();
  loader.load(`${BASE_URL}icon_card.glb`, () => {
    console.log('3D-модель готова');
    setModelReady(true);
  });
}, []);

  // Тени появляются сразу после прелоадера, ещё до персонажа
  useEffect(() => {
    if (preloaderVisible) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / 400, 1);
      setShadowOpacity(progress);
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [preloaderVisible]);

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

  // 4. Загрузка оригиналов (фон + персонажи)
  useEffect(() => {
    console.log('⏳ Загружаем оригиналы...');

    const bg = new Image();
    bg.src = `${BASE_URL}images/portfolio_background.png`;
    bg.onload = () => {
      console.log('✅ Оригинал фона загружен');
      setTimeout(() => setOriginalShown(true), 100);
    };
    bg.onerror = () => console.warn('⚠️ Ошибка загрузки оригинала фона');

    let personaLoadedCount = 0;
    const onPersonaLoad = () => {
      personaLoadedCount++;
      if (personaLoadedCount === 2) {
        console.log('✅ Оригиналы персонажа загружены');
        setPersonaOriginalsReady(true);
      }
    };

    const right = new Image();
    right.src = `${BASE_URL}images/portfolio_ramzez_right.png`;
    right.onload = onPersonaLoad;
    right.onerror = () => console.warn('⚠️ Ошибка загрузки оригинала персонажа (право)');

    const left = new Image();
    left.src = `${BASE_URL}images/portfolio_ramzez_left.png`;
    left.onload = onPersonaLoad;
    left.onerror = () => console.warn('⚠️ Ошибка загрузки оригинала персонажа (лево)');

    // Тени загружаются в фоне
    new Image().src = `${BASE_URL}images/portfolio_ramzez_right_shadow.png`;
    new Image().src = `${BASE_URL}images/portfolio_ramzez_left_shadow.png`;
  }, []);

    // Предзагрузка 3D-модели для карточек
    useEffect(() => {
      const loader = new GLTFLoader();
      // Загружаем модель и кэшируем её (Three.js кэширует автоматически по URL)
      loader.load(`${BASE_URL}icon_card.glb`, (gltf) => {
        console.log('3D-модель предзагружена');
      });
    }, []);

  // Разворот персонажа на десктопе по положению курсора
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      if (e.clientX > centerX + 50) setActiveImage("right");
      else if (e.clientX < centerX - 50) setActiveImage("left");
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

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
        layer1: { x: normGamma * 20, y: normBeta * 6 },  // уменьшено для мобильных
        layer2: {
          x: Math.max(-15, Math.min(15, -normGamma * 70 * 0.02)),
          y: Math.max(-15, Math.min(15, -normBeta * 70 * 0.02)),
        },
        layer3: { x: normGamma * 80, y: normBeta * 120 },
      });
    };

    window.addEventListener("deviceorientation", handleOrientation);
    cleanup = () => window.removeEventListener("deviceorientation", handleOrientation);
    return cleanup;
  }, [isMobile, gyroPermissionGranted]);

  const nextDialogue = () => {
    if (!allowDialogue) return;
    playClick();
    if (dialogueIndex < dialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      setShowInterface(true);
    }
  };

  const handleTreatsClick = () => {
    if (!allowDialogue) return;
    playClick();
    setDialogueIndex(prev => prev + 1);
  };

  // Параллакс
  const backgroundOffset = {
    x: (isMobile ? gyroOffsets.layer1.x : layer1.x) * 2.0,
    y: (isMobile ? gyroOffsets.layer1.y : layer1.y) * 0.4,
  };
  const personaOffset = {
    x: -backgroundOffset.x * 0.15,
    y: -backgroundOffset.y * 0.1,
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

      {/* Слой 0: фон с расширенными границами */}
      <ParallaxLayer offset={backgroundOffset} className="absolute z-0" style={{ width: "130vw", height: "130vh", left: "-15vw", top: "-15vh" }}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${BASE_URL}images/compress/portfolio_background.png)`,
            opacity: originalShown ? 0 : 1,
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${BASE_URL}images/portfolio_background.png)`,
            opacity: originalShown ? 1 : 0,
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

      {/* Слой теней (между фоном и персонажем) */}
      <ParallaxLayer
        offset={personaOffset}
        className="absolute inset-0 z-8 flex items-end justify-center pointer-events-none"
        style={{ opacity: shadowOpacity, transition: 'opacity 0.7s ease-in-out' }}
      >
        <motion.img
          src={`${BASE_URL}images/portfolio_ramzez_right_shadow.png`}
          alt="Shadow right"
          className="object-contain absolute bottom-0 left-1/2 -translate-x-[57%]"
          style={{
            opacity: activeImage === "right" ? 1 : 0,
            maxWidth: "none",
            maxHeight: `${personaScale * 100}vh`,
            transition: 'opacity 0.7s ease-in-out',
          }}
        />
        <motion.img
          src={`${BASE_URL}images/portfolio_ramzez_left_shadow.png`}
          alt="Shadow left"
          className="object-contain absolute bottom-0 left-1/2 -translate-x-[57%]"
          style={{
            opacity: activeImage === "left" ? 1 : 0,
            maxWidth: "none",
            maxHeight: `${personaScale * 100}vh`,
            transition: 'opacity 0.7s ease-in-out',
          }}
        />
      </ParallaxLayer>

      {/* Единственный слой персонажа (без лишнего cursor-pointer) */}
        <ParallaxLayer
          offset={personaOffset}
          className="absolute inset-0 z-10 flex items-end justify-center"
          style={{ opacity: personaOpacity, transition: 'opacity 0.5s' }}
        >
          <motion.img
            src={
              dialogueIndex >= 3 && personaOriginalsReady
                ? `${BASE_URL}images/portfolio_ramzez_right.png`
                : `${BASE_URL}images/compress/portfolio_ramzez_right.png`
            }
            alt="Ramzez right"
            className="object-contain absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              opacity: activeImage === "right" ? 1 : 0,
              maxWidth: "none",
              maxHeight: `${personaScale * 100}vh`,
              transition: 'opacity 0.7s ease-in-out',
            }}
            onClick={nextDialogue}
          />
          <motion.img
            src={
              dialogueIndex >= 3 && personaOriginalsReady
                ? `${BASE_URL}images/portfolio_ramzez_left.png`
                : `${BASE_URL}images/compress/portfolio_ramzez_left.png`
            }
            alt="Ramzez left"
            className="object-contain absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              opacity: activeImage === "left" ? 1 : 0,
              maxWidth: "none",
              maxHeight: `${personaScale * 100}vh`,
              transition: 'opacity 0.7s ease-in-out',
            }}
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
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="pointer-events-none absolute inset-0 z-20"
>
  <div
    className="pointer-events-auto absolute"
    style={{
      left: isMobile ? '-3%' : '25%',   // мобилки: ближе к центру, десктоп: выходит за край
      bottom: isMobile ? '40%' : '50%', // мобилки: выше, десктоп: ниже
    }}
  >
    <Card3D
      key="card-projects"
      glbPath={`${BASE_URL}icon_card.glb`}
      label="Проекты"
      isGyroActive={gyroPermissionGranted}
    />
  </div>
  <div
    className="pointer-events-auto absolute"
    style={{
      right: isMobile ? '-3%' : '25%',
      bottom: isMobile ? '40%' : '50%',
    }}
  >
    <Card3D
      key="card-blog"
      glbPath={`${BASE_URL}icon_card.glb`}
      label="Блог"
      isGyroActive={gyroPermissionGranted}
    />
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
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: isMobile ? '10%' : '25%',
                    bottom: '40%',
                    width: '110px',
                    height: '110px',
                  }}
                  onClick={handleTreatsClick}
                  variants={{
                    hidden: { opacity: 0, x: -30 },
                    visible: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -30, transition: { duration: 0.5 } },
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.img
                    src={`${BASE_URL}images/tea.png`}
                    alt="Чай"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 18px rgba(255,80,80,0.8)) drop-shadow(0 0 8px rgba(255,80,80,0.4))',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                </motion.div>
                <motion.div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    right: isMobile ? '10%' : '25%',
                    bottom: '40%',
                    width: '110px',
                    height: '110px',
                  }}
                  onClick={handleTreatsClick}
                  variants={{
                    hidden: { opacity: 0, x: 30 },
                    visible: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 30, transition: { duration: 0.5 } },
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.img
                    src={`${BASE_URL}images/chakchak.png`}
                    alt="Чак-чак"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 18px rgba(255,80,80,0.8)) drop-shadow(0 0 8px rgba(255,80,80,0.4))',
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