// src/components/AnimatedFavicon.jsx
import { useEffect, useRef } from 'react';

const SIZE = 64;
const BG_COLOR = '#111111';          // более тёмный фон для контраста
const GLOW_COLOR = '#ff4444';        // ярко-красный
const BORDER_COLOR = '#ff8888';      // цвет рамки

export default function AnimatedFavicon() {
  const linkRef = useRef(null);

  useEffect(() => {
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
      const t = (elapsed % 4000) / 4000; // 4-секундный цикл

      ctx.clearRect(0, 0, SIZE, SIZE);

      // фон
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, SIZE, SIZE);

      const alpha = Math.sin(t * Math.PI);
      const scale = 0.8 + 0.2 * alpha;

      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.scale(scale, scale);

      // свечение буквы
      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur = 14 * alpha;

      // градиент
      const grad = ctx.createLinearGradient(0, -20, 0, 20);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#ffaaaa');
      ctx.fillStyle = grad;
      ctx.font = `bold ${SIZE * 0.52}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('R', 0, 0);

      ctx.restore();

      // светящаяся рамка
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 2;
      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur = 8 * alpha;
      ctx.strokeRect(2, 2, SIZE - 4, SIZE - 4);

      linkRef.current.href = canvas.toDataURL('image/png');
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return null;
}