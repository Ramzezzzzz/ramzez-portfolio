import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GlowingPanel({ isOpen, onClose, children, customPosition = null }) {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const isMobile = windowSize.width < 768;
  const panelWidth = isMobile ? '92.5vw' : 'min(80vw, 1400px)';
  const panelHeight = isMobile ? '92.5dvh' : 'min(92.5dvh)';

  // Функция парсинга значений с px, % и числами
  const parseValue = (value, relativeTo) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (value.endsWith('px')) return parseFloat(value);
      if (value.endsWith('%')) return (parseFloat(value) / 100) * relativeTo;
    }
    return 0;
  };

  let finalStyle = {
    position: 'fixed',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(20, 20, 30, 0.9)',
    backdropFilter: 'blur(16px)',
    borderRadius: '2rem',
    border: '2px solid rgba(255, 80, 120, 0.6)',
    boxShadow: '0 0 40px rgba(255, 80, 120, 0.4), inset 0 0 20px rgba(255, 80, 120, 0.1)',
    width: panelWidth,
    height: panelHeight,
    maxWidth: `calc(100vw - 40px)`,
    maxHeight: `calc(100dvh - 40px)`,
  };

  // Обработка кастомного позиционирования
  if (customPosition) {
    const rawTop = customPosition.top !== undefined ? customPosition.top : '50%';
    const rawLeft = customPosition.left !== undefined ? customPosition.left : null;
    const rawRight = customPosition.right !== undefined ? customPosition.right : null;
    const rawBottom = customPosition.bottom !== undefined ? customPosition.bottom : null;
    const rawTransform = customPosition.transform || null;

    const topValue = parseValue(rawTop, windowSize.height);
    let leftValue = rawLeft !== null ? parseValue(rawLeft, windowSize.width) : null;
    let rightValue = rawRight !== null ? parseValue(rawRight, windowSize.width) : null;
    let bottomValue = rawBottom !== null ? parseValue(rawBottom, windowSize.height) : null;

    // Вычисляем фактическую ширину панели в пикселях (приблизительно)
    let actualWidth = windowSize.width;
    if (panelWidth.includes('vw')) actualWidth = (parseFloat(panelWidth) / 100) * windowSize.width;
    else if (panelWidth.includes('min')) actualWidth = Math.min((80 / 100) * windowSize.width, 1400);

    // Корректируем left/right, чтобы панель не выходила за экран
    if (leftValue !== null) {
      if (leftValue + actualWidth > windowSize.width - 20) leftValue = windowSize.width - actualWidth - 20;
      if (leftValue < 20) leftValue = 20;
      finalStyle.left = `${leftValue}px`;
      finalStyle.right = 'auto';
    } else if (rightValue !== null) {
      if (rightValue + actualWidth > windowSize.width - 20) rightValue = windowSize.width - actualWidth - 20;
      if (rightValue < 20) rightValue = 20;
      finalStyle.right = `${rightValue}px`;
      finalStyle.left = 'auto';
    }

    // Вертикаль: если задан bottom, используем его, иначе top
    if (bottomValue !== null) {
      finalStyle.bottom = `${bottomValue}px`;
      finalStyle.top = 'auto';
    } else {
      finalStyle.top = `${topValue}px`;
      finalStyle.bottom = 'auto';
    }

    // Преобразование (например, для центрирования)
    finalStyle.transform = rawTransform || 'none';
  } else {
    // По умолчанию – строгий центр
    finalStyle.top = '50%';
    finalStyle.left = '50%';
    finalStyle.transform = 'translate(-50%, -50%)';
  }

  const initialStyle = { opacity: 0, scale: 0.9 };
  const animateStyle = { opacity: 1, scale: 1 };
  const exitStyle = { opacity: 0, scale: 0.9 };

  return (
    <AnimatePresence>
      <motion.div
        initial={initialStyle}
        animate={animateStyle}
        exit={exitStyle}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={finalStyle}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <X size={20} />
        </button>
        <div className="flex-1 overflow-auto p-6 text-white glowing-panel-content" style={{ maxHeight: '100%' }}>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}