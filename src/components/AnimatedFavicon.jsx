// src/components/AnimatedFavicon.jsx
import { useEffect, useRef } from 'react';

// Настройки анимации
const SIZE = 64;            // размер холста (кратно 16)
const BG_COLOR = '#3c3c3c'; // фон favicon
const GLOW_COLOR = '#ef4444'; // цвет свечения (red-500)
const CYCLE_DURATION = 4000;  // полный цикл анимации (мс)

export default function AnimatedFavicon() {
  const linkRef = useRef(null);

  useEffect(() => {
    // создаём <link rel="icon"> если его ещё нет
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    linkRef.current = link;

    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    let rafId;
    const start = performance.now();

    const draw = (now) => {
      const elapsed = now - start;
      // нормализованное время от 0 до 1 (зацикленное)
      const t = (elapsed % CYCLE_DURATION) / CYCLE_DURATION;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // фон
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // анимированная буква «R»
      const alpha = Math.sin(t * Math.PI);    // 0 → 1 → 0
      const scale = 0.8 + 0.2 * alpha;       // 80% → 100% → 80%
      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.scale(scale, scale);
      ctx.font = `bold ${SIZE * 0.5}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // свечение
      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur = 12 * alpha;

      // градиентная заливка буквы
      const grad = ctx.createLinearGradient(0, -SIZE * 0.3, 0, SIZE * 0.3);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#fca5a5');
      ctx.fillStyle = grad;
      ctx.fillText('R', 0, 0);

      ctx.restore();

      // обновляем favicon
      linkRef.current.href = canvas.toDataURL('image/png');

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      // при размонтировании можно вернуть стандартную иконку
      // linkRef.current.href = '/vite.svg';
    };
  }, []);

  return null; // ничего не рендерит в DOM
}