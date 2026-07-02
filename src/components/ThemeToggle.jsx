import { useGame } from "../context/GameContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { lightMode, toggleLightMode, audio } = useGame();

  return (
    <button
      type="button"
      className={`theme-toggle ${lightMode ? "on" : ""} ${className}`.trim()}
      onClick={() => {
        audio.click();
        toggleLightMode();
      }}
      onMouseEnter={() => audio.hover()}
      aria-pressed={lightMode}
      title={lightMode ? "Выключить свет" : "Включить свет"}
    >
      {lightMode ? "☀️ Свет горит" : "🌙 Ночь"}
    </button>
  );
}