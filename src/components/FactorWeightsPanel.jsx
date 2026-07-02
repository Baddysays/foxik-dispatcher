export default function FactorWeightsPanel({ params, updateParams, description }) {
  return (
    <section className="panel glass">
      <h3>Из чего складывается балл</h3>
      <p className="muted">{description}</p>
      <ul className="reason-list compact formula-glossary">
        <li><code>suspicion_level</code> — средняя заметность по всем встречам лисы в отрезке</li>
        <li><code>has_prey</code> — каждая отметка с добычей × вес добычи</li>
        <li>
          <strong>Ночной бонус</strong> — +1 за каждую отметку в 18:00–06:00 (независимо от окна «Дневное/Ночное время»)
        </li>
        <li>
          <strong>Повтор локации</strong> — +1 за каждую отметку в локации, где у лисы уже ≥2 визита (итого × бонус повтора)
        </li>
        <li className="muted">Окрас (<code>color</code>) на балл не влияет — только фильтр. Неизвестный окрас из JSON — разноцветная метка «неизвестен».</li>
      </ul>
      <div className="param-row">
        <div>
          <label>Добыча: <span className="val">{params.preyWeight}</span></label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={params.preyWeight}
            onInput={(e) => updateParams({ preyWeight: Number(e.target.value) })}
          />
        </div>
        <div>
          <label>Ночной бонус: <span className="val">{params.nightBonus}</span></label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={params.nightBonus}
            onInput={(e) => updateParams({ nightBonus: Number(e.target.value) })}
          />
        </div>
        <div>
          <label>Бонус повтора: <span className="val">{params.repeatBonus}</span></label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={params.repeatBonus}
            onInput={(e) => updateParams({ repeatBonus: Number(e.target.value) })}
          />
        </div>
      </div>
    </section>
  );
}
