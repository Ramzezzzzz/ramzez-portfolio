import { useRef, useCallback } from "react";
import { useSound } from "../context/SoundContext";

export function useClickSound() {
  const { isMuted } = useSound();
  const audioContextRef = useRef(null);

  const playClick = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.01);
    } catch (e) {}
  }, [isMuted]);

  return playClick;
}
