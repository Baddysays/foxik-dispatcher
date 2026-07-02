import { useGame, DEFAULT_FILTERS } from "../context/GameContext.jsx";
import { LOCATIONS, getSuspicion, getFoxDisplayName, foxColorsForFilter, formatFoxColorLabel } from "../data.js";
import ScoreBreakdown from "./ScoreBreakdown.jsx";
import MeasurementWindowPanel from "./MeasurementWindowPanel.jsx";
import FactorWeightsPanel from "./FactorWeightsPanel.jsx";

export default function StatsScreen() {
  const {
    observations,
    params,
    updateParams,
    filters,
    updateFilters,
    resetFilters,
    deleteObservation,
    updateObservation,
    getFilteredStats,
    audio,
  } = useGame();

  const { filtered, stats, measurement } = getFilteredStats();
  const top = stats.topSuspiciousFox;
  const maxScore = stats.foxRankings[0] ? stats.foxRankings[0].score : 1;
  const heat = Object.entries(stats.locationHeat).sort((a, b) => b[1] - a[1]);
  const maxHeat = heat[0] ? heat[0][1] : 1;
  const foxes = [...new Set(observations.map((o) => o.fox_id))];
  const colorOptions = foxColorsForFilter(observations);
  const hotLoc = heat[0];

  const filtersActive =
    filters.foxId !== DEFAULT_FILTERS.foxId ||
    filters.location !== DEFAULT_FILTERS.location ||
    filters.color !== DEFAULT_FILTERS.color ||
    filters.nightOnly !== DEFAULT_FILTERS.nightOnly ||
    filters.preyOnly !== DEFAULT_FILTERS.preyOnly ||
    filters.search !== DEFAULT_FILTERS.search;

  const kpis = [
    { icon: "🦊", label: "Лисы в смене", value: stats.uniqueFoxes.length, sub: "в выбранном отрезке" },
    { icon: "📊", label: "В сводке", value: filtered.length, sub: measurement.excluded ? `+${measurement.excluded} вне отрезка` : "после фильтров" },
    { icon: "🌟", label: "Лиса №1", value: top ? getFoxDisplayName(top.fox_id, observations) : "—", sub: top ? `${top.fox_id} · ${top.score.toFixed(2)}` : "", accent: true },
    { icon: "🍃", label: "Любимое место", value: hotLoc ? hotLoc[0] : "—", sub: hotLoc ? hotLoc[1] + " встреч" : "" },
  ];

  return (
    <div className="screen">
      <MeasurementWindowPanel
        params={params}
        updateParams={updateParams}
        totalCount={measurement.total}
        inWindowCount={measurement.inWindow}
      />

      <FactorWeightsPanel
        params={params}
        updateParams={updateParams}
        description={stats.suspicionFactors.description}
      />

      <section className="kpi-row">
        {kpis.map((k) => (
          <div className="kpi glass" key={k.label}>
            <div className="kpi-icon" aria-hidden="true">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className={"kpi-value" + (k.accent ? " accent" : "")}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </section>

      <section className="panel glass">
        <div className="panel-head-row">
          <h3>Уточнить список</h3>
          {filtersActive && (
            <button className="btn ghost btn-sm" type="button" onClick={() => resetFilters()}>
              Сбросить фильтры
            </button>
          )}
        </div>
        <p className="muted">Сужают журнал встреч и пересчитывают список лис ниже. Отрезок смены задаётся выше.</p>
        <div className="filter-row">
          <div>
            <label>Поиск</label>
            <input
              type="search"
              placeholder="имя, fox_id, локация…"
              value={filters.search}
              onInput={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
          <div>
            <label>Лиса</label>
            <select value={filters.foxId} onChange={(e) => updateFilters({ foxId: e.target.value })}>
              <option value="all">Все</option>
              {foxes.map((f) => (
                <option key={f} value={f}>{getFoxDisplayName(f, observations)} ({f})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Локация</label>
            <select value={filters.location} onChange={(e) => updateFilters({ location: e.target.value })}>
              <option value="all">Все</option>
              {LOCATIONS.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label>Окрас</label>
            <select value={filters.color} onChange={(e) => updateFilters({ color: e.target.value })}>
              <option value="all">Все</option>
              {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="checks">
            <label>
              <input type="checkbox" checked={filters.nightOnly}
                onChange={(e) => updateFilters({ nightOnly: e.target.checked })} /> Ночь (18–06)
            </label>
            <label>
              <input type="checkbox" checked={filters.preyOnly}
                onChange={(e) => updateFilters({ preyOnly: e.target.checked })} /> С добычей
            </label>
          </div>
        </div>
      </section>

      <div className="two-col">
        <section className="panel glass">
          <h3>Кто как замечен</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Имя</th><th>Балл</th><th>Отм.</th><th>Добыча</th><th>Ночь</th>
                </tr>
              </thead>
              <tbody>
                {stats.foxRankings.map((f, i) => (
                  <tr key={f.fox_id}>
                    <td>{i + 1}</td>
                    <td>
                      <span>{getFoxDisplayName(f.fox_id, observations)}</span>
                      <span className="muted table-sub">{f.fox_id}</span>
                    </td>
                    <td>
                      <div className="bar-cell">
                        <span className="bar">
                          <span style={{ width: ((f.score / maxScore) * 100).toFixed(0) + "%" }} />
                        </span>
                        <span className="bar-val">{f.score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td>{f.count}</td>
                    <td>{f.preyCount}</td>
                    <td>{f.nightCount}</td>
                  </tr>
                ))}
                {stats.foxRankings.length === 0 && (
                  <tr><td className="empty" colSpan={6}>Нет данных</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel glass">
          <h3>Где чаще бывают</h3>
          <ul className="heat-list">
            {heat.map(([name, count]) => (
              <li className="heat-item" key={name}>
                <div className="heat-head">
                  <span>{name}</span>
                  <span>{count}</span>
                </div>
                <div className="bar">
                  <span style={{ width: ((count / maxHeat) * 100).toFixed(0) + "%" }} />
                </div>
              </li>
            ))}
            {heat.length === 0 && <li className="empty">Нет данных</li>}
          </ul>
        </section>
      </div>

      {top && (
        <section className="panel glass highlight-box">
          <h3>Почему {getFoxDisplayName(top.fox_id, observations)} впереди</h3>
          <p className="muted">{top.fox_id} · суммарный балл {top.score.toFixed(2)}</p>
          <ScoreBreakdown fox={top} />
          <ul className="reason-list">
            {top.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      )}

      <section className="panel glass">
        <h3>Журнал встреч ({filtered.length})</h3>
        <p className="muted tiny">Заметность можно изменить прямо в таблице — сводка обновится сразу.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Имя</th><th>fox_id</th><th>Локация</th><th>Окрас</th>
                <th>Время</th><th>Добыча</th><th>Заметн.</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{r.id}</td>
                  <td>{getFoxDisplayName(r.fox_id, observations)}</td>
                  <td className="muted">{r.fox_id}</td>
                  <td>{r.location}</td>
                  <td>{formatFoxColorLabel(r.color, r)}</td>
                  <td>{r.time}</td>
                  <td>{r.has_prey ? "да" : "нет"}</td>
                  <td>
                    <select
                      className="suspicion-select"
                      value={getSuspicion(r)}
                      onChange={(e) => updateObservation(r.id, { suspicion_level: Number(e.target.value) })}
                      aria-label={`Заметность ${r.id}`}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn ghost icon" type="button"
                      onClick={() => {
                        if (!window.confirm(`Удалить запись ${r.id}?`)) return;
                        deleteObservation(r.id);
                      }}
                      onMouseEnter={() => audio.hover()} title="Удалить">×</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="empty" colSpan={9}>Нет записей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
