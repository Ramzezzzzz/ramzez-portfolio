import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "../context/SoundContext";

export default function MuteButton() {
  const { isMuted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
      aria-label={isMuted ? "Включить звук" : "Выключить звук"}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </button>
  );
}
