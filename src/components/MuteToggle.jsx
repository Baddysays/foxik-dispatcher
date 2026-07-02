import { useGame } from "../context/GameContext.jsx";

export default function MuteToggle({ className = "" }) {
  const { audio, muted, toggleMute } = useGame();
  const soundOn = !muted;

  return (
    <button
      type="button"
      className={`mute-toggle ${soundOn ? "on" : ""} ${className}`.trim()}
      onClick={() => {
        const turningOn = muted;
        toggleMute();
        if (turningOn) audio.click();
      }}
      onMouseEnter={() => audio.hover()}
      aria-pressed={soundOn}
      title={soundOn ? "Выключить звук" : "Включить звук"}
    >
      {soundOn ? "🔊 Звук в лесу" : "🔇 Тишина"}
    </button>
  );
}
