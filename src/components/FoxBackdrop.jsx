import { useGame } from "../context/GameContext.jsx";

export default function FoxBackdrop() {
  const { lightMode } = useGame();

  return (
    <div
      className={"fox-backdrop" + (lightMode ? " is-day" : " is-night")}
      aria-hidden="true"
    >
      <div className="fox-backdrop-photo" />
    </div>
  );
}
