import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import ParallaxLayer from "../components/ParallaxLayer";
import GlassCard from "../components/GlassCard";
import MuteButton from "../components/MuteButton";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { useClickSound } from "../hooks/useClickSound";
import { MessageCircle, Smartphone } from "lucide-react";
import Card3D from "../components/Card3D";
import GlowingPanel from "../components/GlowingPanel";
import ProjectsPanel from "../components/ProjectsPanel";
import BlogPanel from "../components/BlogPanel";

const BASE_URL = import.meta.env.BASE_URL || "/";

export default function HomePage({ initialPanel = null }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { layer1, layer2, layer3 } = useMouseParallax();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [dialoguesList, setDialoguesList] = useState([]);
  const [dialoguesLoaded, setDialoguesLoaded] = useState(false);
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

  const [selectedCard, setSelectedCard] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [originRect, setOriginRect] = useState(null);
  const [hideLeftCard, setHideLeftCard] = useState(false);
  const [hideRightCard, setHideRightCard] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const requestGyroPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === "granted") setGyroPermissionGranted(true);
    } else {
      setGyroPermissionGranted(true);
    }
  };

  // Загрузка диалогов из БД
  useEffect(() => {
    fetch('/api/dialogues.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDialoguesList(data);
        } else {
          console.error('Ошибка загрузки диалогов:', data);
          setDialoguesList([]);
        }
        setDialoguesLoaded(true);
      })
      .catch(err => {
        console.error(err);
        setDialoguesList([]);
        setDialoguesLoaded(true);
      });
  }, []);

  // Прелоадер
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

  useEffect(() => {
    const delay = setTimeout(() => setAllowDialogue(true), 3500);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    const bg = new Image();
    bg.src = `${BASE_URL}images/portfolio_background.png`;
    bg.onload = () => setTimeout(() => setOriginalShown(true), 100);
    let personaLoadedCount = 0;
    const onPersonaLoad = () => {
      personaLoadedCount++;
      if (personaLoadedCount === 2) setPersonaOriginalsReady(true);
    };
    const right = new Image();
    right.src = `${BASE_URL}images/portfolio_ramzez_right.png`;
    right.onload = onPersonaLoad;
    const left = new Image();
    left.src = `${BASE_URL}images/portfolio_ramzez_left.png`;
    left.onload = onPersonaLoad;
    new Image().src = `${BASE_URL}images/portfolio_ramzez_right_shadow.png`;
    new Image().src = `${BASE_URL}images/portfolio_ramzez_left_shadow.png`;
  }, []);

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
          if (dialogueIndex < dialoguesList.length - 1) setDialogueIndex(prev => prev + 1);
          else setShowInterface(true);
          playClick();
        }
      } else {
        if (showInterface) {
          setShowInterface(false);
          setDialogueIndex(dialoguesList.length - 1);
        } else if (dialogueIndex > 0) {
          setDialogueIndex(prev => prev - 1);
        }
        playClick();
      }
    },
    [dialogueIndex, showInterface, playClick, allowDialogue, dialoguesList.length]
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
    const handleOrientation = (event) => {
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      const normGamma = gamma / 90;
      const normBeta = beta / 180;
      if (gamma > 25) setActiveImage("right");
      else if (gamma < -25) setActiveImage("left");
      setGyroOffsets({
        layer1: { x: normGamma * 20, y: normBeta * 6 },
        layer2: {
          x: Math.max(-15, Math.min(15, -normGamma * 70 * 0.02)),
          y: Math.max(-15, Math.min(15, -normBeta * 70 * 0.02)),
        },
        layer3: { x: normGamma * 80, y: normBeta * 120 },
      });
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [isMobile, gyroPermissionGranted]);

  const nextDialogue = () => {
    if (!allowDialogue) return;
    playClick();
    if (dialogueIndex < dialoguesList.length - 1) setDialogueIndex(prev => prev + 1);
    else setShowInterface(true);
  };
  const handleTreatsClick = (e, index) => {
    e.stopPropagation();
    if (!allowDialogue) return;
    playClick();
    if (index < dialoguesList.length - 1) setDialogueIndex(prev => prev + 1);
    else setShowInterface(true);
  };

  useEffect(() => {
    if (dialoguesLoaded && dialoguesList.length > 0 && dialogueIndex === dialoguesList.length - 1 && allowDialogue) {
      const timer = setTimeout(() => nextDialogue(), 1000);
      return () => clearTimeout(timer);
    }
  }, [dialogueIndex, dialoguesList, allowDialogue, dialoguesLoaded]);

  // --- Роутинг и аналитика ---
  useEffect(() => {
    if (!dialoguesLoaded || !allowDialogue) return;
    if (initialPanel === 'projects') {
      setSelectedCard('projects');
      setPanelOpen(true);
      setHideLeftCard(true);
      if (window.ym) window.ym(109412309, 'hit', '/project');
    } else if (initialPanel === 'blog') {
      setSelectedCard('blog');
      setPanelOpen(true);
      setHideRightCard(true);
      if (window.ym) window.ym(109412309, 'hit', '/blog');
    }
  }, [initialPanel, dialoguesLoaded, allowDialogue]);

  useEffect(() => {
  // Отправляем виртуальный просмотр в Метрику при изменении пути
  if (window.ym) {
    window.ym(109412309, 'hit', location.pathname);
  }
}, [location.pathname]);

  useEffect(() => {
    const path = location.pathname.replace(BASE_URL, '') || '/';
    if (path === '/project' && selectedCard !== 'projects') {
      setSelectedCard('projects');
      setPanelOpen(true);
      setHideLeftCard(true);
      if (window.ym) window.ym(109412309, 'hit', '/project');
    } else if (path === '/blog' && selectedCard !== 'blog') {
      setSelectedCard('blog');
      setPanelOpen(true);
      setHideRightCard(true);
      if (window.ym) window.ym(109412309, 'hit', '/blog');
    } else if (path === '/' && selectedCard !== null) {
      setPanelOpen(false);
      setSelectedCard(null);
      setOriginRect(null);
      setHideLeftCard(false);
      setHideRightCard(false);
      if (window.ym) window.ym(109412309, 'hit', '/');
    }
  }, [location.pathname, selectedCard]);

  const backgroundOffset = {
    x: (isMobile ? gyroOffsets.layer1.x : layer1.x) * 2.0,
    y: (isMobile ? gyroOffsets.layer1.y : layer1.y) * 0.4,
  };
  const personaOffset = {
    x: -backgroundOffset.x * 0.15,
    y: -backgroundOffset.y * 0.1,
  };
  const personaScale = isMobile ? 1.0 : 1.2;

  const handleCardClick = (type, rect) => {
    setOriginRect(rect);
    setSelectedCard(type);
    setPanelOpen(true);
    if (type === 'projects') {
      setHideLeftCard(true);
      navigate('/project');
      if (window.ym) {
        window.ym(109412309, 'reachGoal', 'open_projects');
        window.ym(109412309, 'hit', '/project');
      }
    } else if (type === 'blog') {
      setHideRightCard(true);
      navigate('/blog');
      if (window.ym) {
        window.ym(109412309, 'reachGoal', 'open_blog');
        window.ym(109412309, 'hit', '/blog');
      }
        if (window.ym) {
    window.ym(109412309, 'reachGoal', `open_${type}`);
  }
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedCard(null);
    setOriginRect(null);
    setHideLeftCard(false);
    setHideRightCard(false);
    navigate('/');
    if (window.ym) window.ym(109412309, 'hit', '/');
  };

  const sceneOffsetX = selectedCard === 'projects'
    ? (isMobile ? '40%' : '20%')
    : selectedCard === 'blog'
    ? (isMobile ? '-40%' : '-20%')
    : '0%';

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
        >
          <Smartphone className="w-5 h-5" />
        </button>
      )}

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

      {/* Виньетка */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)",
          zIndex: 15,
        }}
      />

      {/* Сцена (смещается) */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ x: sceneOffsetX }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <ParallaxLayer offset={backgroundOffset} className="absolute z-0" style={{ width: "180vw", height: "180vh", left: "-40vw", top: "-15vh" }}>
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

        {/* Тени персонажа */}
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

        {/* Персонаж */}
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

        {/* Карточки */}
        {showInterface && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div
              className="pointer-events-auto absolute"
              style={{
                left: isMobile ? '-3%' : '25%',
                bottom: isMobile ? '50%' : '50%',
                transform: 'translateY(50%)',
              }}
            >
              <Card3D
                glbPath={`${BASE_URL}icon_card.glb`}
                label="Проекты"
                baseRotationY={0.3}
                isGyroActive={gyroPermissionGranted}
                onClick={(rect) => handleCardClick('projects', rect)}
                hidden={hideLeftCard}
              />
            </div>
            <div
              className="pointer-events-auto absolute"
              style={{
                right: isMobile ? '-3%' : '25%',
                bottom: isMobile ? '50%' : '50%',
                transform: 'translateY(50%)',
              }}
            >
              <Card3D
                glbPath={`${BASE_URL}icon_card.glb`}
                label="Блог"
                baseRotationY={-0.3}
                isGyroActive={gyroPermissionGranted}
                onClick={(rect) => handleCardClick('blog', rect)}
                hidden={hideRightCard}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* UI слой (диалоги) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className={`h-full flex flex-col justify-end items-center px-4 ${isMobile ? "pb-12" : "pb-12 sm:pb-18"}`}>
          <AnimatePresence mode="wait">
            {!showInterface && allowDialogue && dialoguesLoaded && dialoguesList.map((dialog, idx) => (
              dialogueIndex === idx && (
                <motion.div
                  key={dialog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="pointer-events-auto cursor-pointer mb-2 sm:mb-4 w-full max-w-md"
                  onClick={() => dialog.type !== 'treats' && nextDialogue()}
                >
                  <GlassCard className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 !rounded-2xl">
                    {dialog.type === 'treats' ? (
                      <div className="flex justify-center gap-6 w-full">
                        <motion.img
                          src={`${BASE_URL}images/tea.png`}
                          alt="Чай"
                          className="w-16 h-16 object-contain cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => handleTreatsClick(e, idx)}
                        />
                        <motion.img
                          src={`${BASE_URL}images/chakchak.png`}
                          alt="Чак-чак"
                          className="w-16 h-16 object-contain cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => handleTreatsClick(e, idx)}
                        />
                      </div>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
                        <p className="text-white text-base sm:text-lg font-medium">{dialog.text}</p>
                      </>
                    )}
                  </GlassCard>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Панель проектов */}
      <GlowingPanel
        isOpen={panelOpen && selectedCard === 'projects'}
        onClose={closePanel}
        customPosition={{ left: '5%', top: '3.5%', transform: 'translateY(-50%)' }}
      >
        <ProjectsPanel />
      </GlowingPanel>

      {/* Панель блога */}
      <GlowingPanel
        isOpen={panelOpen && selectedCard === 'blog'}
        onClose={closePanel}
        customPosition={{ right: '5%', top: '3.5%', transform: 'translateY(-50%)' }}
      >
        <BlogPanel isOpen={panelOpen && selectedCard === 'blog'} />
      </GlowingPanel>
    </div>
  );
}