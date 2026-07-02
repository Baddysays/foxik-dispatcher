const SEGMENTS = [
  { key: "suspicion", label: "Средняя заметность", color: "var(--accent)" },
  { key: "prey", label: "Добыча", color: "var(--warn)" },
  { key: "night", label: "Ночь", color: "#3b82f6" },
  { key: "repeat", label: "Повторы локации", color: "#a855f7" },
];

export default function ScoreBreakdown({ fox }) {
  if (!fox?.parts) return null;
  const total = fox.score || 1;
  const rows = SEGMENTS.filter((s) => fox.parts[s.key] > 0.001);

  return (
    <div className="score-breakdown">
      <div className="score-breakdown-bar" role="img" aria-label={"Разбор балла " + fox.fox_id}>
        {rows.map((s) => (
          <span
            key={s.key}
            className="score-seg"
            style={{ width: ((fox.parts[s.key] / total) * 100).toFixed(1) + "%", background: s.color }}
            title={s.label + ": " + fox.parts[s.key].toFixed(2)}
          />
        ))}
      </div>
      <ul className="score-breakdown-legend">
        {rows.map((s) => (
          <li key={s.key}>
            <span className="score-swatch" style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{fox.parts[s.key].toFixed(2)}</strong>
          </li>
        ))}
        <li className="score-total">
          <span>Итого</span>
          <strong>{fox.score.toFixed(2)}</strong>
        </li>
      </ul>
    </div>
  );
}
