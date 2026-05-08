import { createContext, useContext, useState, useEffect } from "react";

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('portfolio-sound-muted');
    return saved ? JSON.parse(saved) : true;   // теперь true = выключено
  });

  useEffect(() => {
    localStorage.setItem("portfolio-sound-muted", JSON.stringify(isMuted));
  }, [isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
