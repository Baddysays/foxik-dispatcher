import {
  filterByMeasurementWindow,
  formatMeasurementWindow,
  isWithinMeasurementWindow,
} from "../analytics.js";

const MODES = [
  { id: "24h", label: "Круглосуточно", sub: "00:00 – 24:00", icon: "◉" },
  { id: "day", label: "Дневное время", sub: "06:00 – 18:00", icon: "☀️" },
  { id: "night", label: "Ночное время", sub: "18:00 – 06:00", icon: "🌙" },
  { id: "range", label: "Интервал", sub: "свой диапазон", icon: "◎" },
];

export default function MeasurementWindowPanel({ params, updateParams, totalCount, inWindowCount }) {
  const mode = params.measurementMode ?? "24h";
  const excluded = totalCount - inWindowCount;

  return (
    <section className="panel glass">
      <h3>Какой отрезок смены смотрим</h3>
      <p className="muted">
        В сводку попадают только встречи из выбранного отрезка времени.
        Отрезок — это фильтр записей; ночной бонус в формуле считается отдельно (18:00–06:00).
      </p>
      <div className="measurement-mode-grid">
        {MODES.map((m) => (
          <label
            key={m.id}
            className={"mode-card" + (mode === m.id ? " active" : "")}
          >
            <input
              type="radio"
              name="measurementMode"
              checked={mode === m.id}
              onChange={() => updateParams({ measurementMode: m.id })}
            />
            <span className="mode-card-icon" aria-hidden="true">{m.icon}</span>
            <span className="mode-card-label">{m.label}</span>
            <span className="mode-card-sub">{m.sub}</span>
          </label>
        ))}
      </div>
      {mode === "range" && (
        <div className="measurement-range">
          <div>
            <label>С</label>
            <input
              type="time"
              value={params.measurementFrom}
              onChange={(e) => updateParams({ measurementFrom: e.target.value })}
            />
          </div>
          <div>
            <label>по</label>
            <input
              type="time"
              value={params.measurementTo}
              onChange={(e) => updateParams({ measurementTo: e.target.value })}
            />
          </div>
        </div>
      )}
      <p className="tagline ok">
        Окно: <strong>{formatMeasurementWindow(params)}</strong>
        {" · "}в сводке {inWindowCount} из {totalCount}
        {excluded > 0 && <span className="warn-inline"> · {excluded} вне отрезка</span>}
      </p>
    </section>
  );
}

export function useMeasurementCounts(observations, params) {
  const inWindow = filterByMeasurementWindow(observations, params);
  return { inWindow, inWindowCount: inWindow.length, totalCount: observations.length };
}

export function observationInWindow(obs, params) {
  return isWithinMeasurementWindow(obs.time, params);
}
