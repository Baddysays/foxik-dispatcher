import { useGame } from "../context/GameContext.jsx";
import { LOCATIONS, FOX_SWATCH, getFoxColor, isUnknownFoxColor } from "../data.js";
import { isWithinMeasurementWindow } from "../analytics.js";

const VB = { w: 400, h: 220 };
const MAP_SRC = {
  night: "/images/forest-map-night.png",
  day: "/images/forest-map-day.png",
};

export default function ForestMap({ locationHeat, observations, params, activeLocation, onSelectLocation }) {
  const { lightMode } = useGame();
  const maxHeat = Math.max(1, ...Object.values(locationHeat));
  const mapSrc = lightMode ? MAP_SRC.day : MAP_SRC.night;

  const dots = observations.map((o) => {
    const loc = LOCATIONS.find((l) => l.name === o.location) || LOCATIONS[0];
    const inWindow = params ? isWithinMeasurementWindow(o.time, params) : true;
    return { ...o, x: loc.x * VB.w, y: loc.y * VB.h, inWindow };
  });

  return (
    <div className={"forest-map-frame" + (lightMode ? " is-day" : " is-night")}>
      <div className={"forest-map-wrap" + (lightMode ? " is-day" : " is-night")}>
        <img className="forest-map-bg" src={mapSrc} alt="" aria-hidden="true" />
        <svg
          className="forest-map"
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          role="img"
          aria-label="Карта леса с отметками наблюдений"
        >
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e8943a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e8943a" stopOpacity="0" />
            </radialGradient>
            <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="foxUnknownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e86c2a" />
              <stop offset="33%" stopColor="#2a2a35" />
              <stop offset="66%" stopColor="#c8d0dc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {LOCATIONS.map((loc) => {
            const count = locationHeat[loc.name] || 0;
            const r = 16 + (count / maxHeat) * 28;
            const cx = loc.x * VB.w;
            const cy = loc.y * VB.h;
            const active = activeLocation === loc.name;
            const label = loc.name.split(" ").join("\n");
            return (
              <g key={loc.id}>
                {count > 0 && <circle cx={cx} cy={cy} r={r} fill="url(#mapGlow)" className="map-heat" />}
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 11 : 8}
                  className={"map-pin" + (active ? " active" : "") + (count ? " hot" : "")}
                  filter={count ? "url(#pinGlow)" : undefined}
                  onClick={() => onSelectLocation?.(loc.name)}
                  role={onSelectLocation ? "button" : undefined}
                  tabIndex={onSelectLocation ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onSelectLocation && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelectLocation(loc.name);
                    }
                  }}
                />
                {count > 0 && (
                  <text x={cx} y={cy + 4} className="map-count" textAnchor="middle" dominantBaseline="middle">
                    {count}
                  </text>
                )}
                <text x={cx} y={cy + 24} className="map-label" textAnchor="middle">
                  {label}
                </text>
              </g>
            );
          })}

          {dots.map((o, i) => {
            const color = getFoxColor(o.fox_id, observations);
            const unknown = isUnknownFoxColor(color);
            return (
            <circle
              key={o.id}
              cx={o.x + ((i % 3) - 1) * 7}
              cy={o.y - 10}
              r={4.5}
              fill={unknown ? "url(#foxUnknownGradient)" : (FOX_SWATCH[color]?.body || "#e86c2a")}
              className={"map-fox-dot" + (o.inWindow ? "" : " out-window") + (unknown ? " unknown-color" : "")}
              opacity={o.inWindow ? 1 : 0.35}
            />
          );})}
        </svg>
      </div>
    </div>
  );
}
