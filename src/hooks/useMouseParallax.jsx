import { useState, useEffect } from 'react';

export function useMouseParallax() {
  const [offsets, setOffsets] = useState({
    layer1: { x: 0, y: 0 },
    layer2: { x: 0, y: 0 },
    layer3: { x: 0, y: 0 },
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const layer1Speed = 0.02;
      const layer2Speed = 0.01;
      const maxLayer2Shift = 5;
      const layer3Speed = 0.08;
      const maxLayer1ShiftY = 15;

      setOffsets({
        layer1: {
          x: deltaX * layer1Speed,
          y: Math.max(-maxLayer1ShiftY, Math.min(maxLayer1ShiftY, deltaY * layer1Speed)),
        },
        layer2: {
          x: Math.max(-maxLayer2Shift, Math.min(maxLayer2Shift, deltaX * layer2Speed)),
          y: Math.max(-maxLayer2Shift, Math.min(maxLayer2Shift, deltaY * layer2Speed * 0.2)),
        },
        layer3: { x: deltaX * layer3Speed, y: deltaY * layer3Speed },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return offsets;
}