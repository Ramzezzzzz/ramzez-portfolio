import { useState, useEffect } from "react";

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

      // Коэффициенты для каждого слоя
      const layer1Speed = 0.01; // фон
      const layer2Speed = 0.03; // персонаж
      const layer3Speed = 0.06; // контент (стеклянные карточки)

      setOffsets({
        layer1: { x: deltaX * layer1Speed, y: deltaY * layer1Speed },
        layer2: { x: deltaX * layer2Speed, y: deltaY * layer2Speed },
        layer3: { x: deltaX * layer3Speed, y: deltaY * layer3Speed },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return offsets;
}
