export default function RandomDataPanel({ params, updateParams, onGenerate }) {
  return (
    <section className="panel glass">
      <h3>Случайные данные</h3>
      <p className="muted">
        Для демо и проверки формулы. Не из ТЗ — можно до 100 встреч и 50 лис с именами из пула.
      </p>
      <div className="random-data-box flat">
        <label>Наблюдений: <span className="val">{params.randomObsCount}</span></label>
        <input
          type="range"
          min={3}
          max={100}
          step={1}
          value={params.randomObsCount}
          onInput={(e) => updateParams({ randomObsCount: Number(e.target.value) })}
        />
        <label>Уникальных лис: <span className="val">{params.randomFoxCount}</span></label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={params.randomFoxCount}
          onInput={(e) => updateParams({ randomFoxCount: Number(e.target.value) })}
        />
        <button className="btn primary btn-sm" type="button" onClick={onGenerate}>
          Сгенерировать смену
        </button>
      </div>
    </section>
  );
}
