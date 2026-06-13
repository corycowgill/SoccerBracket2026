import { useEffect, useRef, useState } from "react";

// Background track served from public/music/ (copied to the site root at build).
const TRACK = `${import.meta.env.BASE_URL}music/SoccerTheme1.mp3`;
const STORAGE_KEY = "music-on";

/** A small play/pause button for looping background music. */
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);

  // Set a gentle volume once the element exists.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.4;
  }, []);

  // If music was on last visit, resume on the first interaction (autoplay rules
  // block sound until the user touches the page).
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "1") return;
    const start = () => {
      void play();
      window.removeEventListener("pointerdown", start);
    };
    window.addEventListener("pointerdown", start);
    return () => window.removeEventListener("pointerdown", start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function play() {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
      setPlaying(true);
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Autoplay blocked or no file — leave it paused.
      setPlaying(false);
    }
  }

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      localStorage.setItem(STORAGE_KEY, "0");
    } else {
      void play();
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACK}
        loop
        preload="auto"
        onError={() => setAvailable(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        disabled={!available}
        title={
          available
            ? playing
              ? "Pause music"
              : "Play music"
            : "Add an MP3 at public/music/theme.mp3 to enable music"
        }
        aria-label={playing ? "Pause music" : "Play music"}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold transition-colors ${
          available ? "bg-white/15 hover:bg-white/25 text-white" : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
      >
        <span className={playing ? "animate-trophy" : ""}>{playing ? "🎵" : "🔇"}</span>
        <span className="hidden sm:inline">{playing ? "Music on" : "Music"}</span>
      </button>
    </>
  );
}
