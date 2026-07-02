import { useGame } from "../context/GameContext.jsx";
import { computeStats, filterByMeasurementWindow } from "../analytics.js";
import { getFoxDisplayName } from "../data.js";
import ForestMap from "./ForestMap.jsx";
import ObservationTimeline from "./ObservationTimeline.jsx";

export default function StartScreen() {
  const {
    setScreen,
    audio,
    observations,
    params,
    updateFilters,
  } = useGame();

  const inWindow = filterByMeasurementWindow(observations, params);
  const stats = computeStats(inWindow, params);
  const excluded = observations.length - inWindow.length;
  const top = stats.topSuspiciousFox;
  const heat = Object.entries(stats.locationHeat).sort((a, b) => b[1] - a[1]);
  const maxScore = stats.foxRankings[0] ? stats.foxRankings[0].score : 1;
  const hotLoc = heat[0];
  const topThree = stats.foxRankings.slice(0, 3);

  const kpis = [
    {
      icon: "🦊",
      label: "Лисы в смене",
      value: stats.uniqueFoxes.length,
      sub: stats.uniqueFoxes.map((id) => getFoxDisplayName(id, observations)).join(", ") || "пока никого",
    },
    {
      icon: "📋",
      label: "Встреч в журнале",
      value: inWindow.length,
      sub: excluded ? `${observations.length} всего · ${excluded} вне отрезка` : `${observations.length} за смену · все учтены`,
    },
    {
      icon: "🌟",
      label: "Самая заметная",
      value: top ? getFoxDisplayName(top.fox_id, observations) : "—",
      sub: top ? `${top.fox_id} · балл ${top.score.toFixed(2)}` : "пока тихо",
      accent: true,
    },
    {
      icon: "🍃",
      label: "Любимое место",
      value: hotLoc ? hotLoc[0] : "—",
      sub: hotLoc ? hotLoc[1] + " встреч" : "пока без тропинок",
    },
  ];

  return (
    <div className="screen">
      <section className="hero glass compact-hero">
        <div>
          <p className="eyebrow">Из лесной будки</p>
          <p className="hero-sub compact">
            Карта леса и быстрые переходы — посмотреть подробнее или записать новую встречу.
          </p>
          <div className="hero-actions">
            <button className="btn primary" type="button" onClick={() => { audio.click(); setScreen("stats"); }}>
              Подробнее о лисах
            </button>
            <button className="btn ghost" type="button" onClick={() => { audio.click(); setScreen("manual"); }}>
              Записать встречу
            </button>
          </div>
        </div>
        <ForestMap
          locationHeat={stats.locationHeat}
          observations={observations}
          params={params}
          activeLocation={null}
          onSelectLocation={(name) => {
            audio.click();
            updateFilters({ location: name });
            setScreen("stats");
          }}
        />
      </section>

      <section className="kpi-row">
        {kpis.map((k) => (
          <div className="kpi glass" key={k.label}>
            <div className="kpi-icon" aria-hidden="true">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className={"kpi-value" + (k.accent ? " accent" : "")}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </section>

      <section className="panel glass timeline-panel">
        <h3>Как проходила смена</h3>
        <p className="muted">Когда кого замечали — по порядку. Наведите на точку, чтобы увидеть имя и детали.</p>
        <ObservationTimeline observations={observations} params={params} />
      </section>

      <div className="two-col">
        <section className="panel glass">
          <div className="panel-head-row">
            <h3>Кто чаще мелькал</h3>
            {stats.foxRankings.length > 3 && (
              <button className="btn ghost btn-sm" type="button" onClick={() => { audio.click(); setScreen("stats"); }}>
                Весь список →
              </button>
            )}
          </div>
          <ul className="rank-list">
            {topThree.map((f, i) => (
              <li className={"rank-item" + (i === 0 ? " rank-top" : "")} key={f.fox_id}>
                <div className="rank-head">
                  <span className="rank-pos">{String(i + 1).padStart(2, "0")}</span>
                  <span className="rank-fox">{f.display_name || getFoxDisplayName(f.fox_id, observations)}</span>
                  <span className="rank-score">{f.score.toFixed(2)}</span>
                </div>
                <div className="rank-id muted">{f.fox_id}</div>
                <div className="bar">
                  <span
                    className="bar-heat"
                    style={{
                      "--heat": (f.score / maxScore).toFixed(2),
                      width: ((f.score / maxScore) * 100).toFixed(0) + "%",
                    }}
                  />
                </div>
              </li>
            ))}
            {topThree.length === 0 && <li className="empty">Пока мало записей</li>}
          </ul>
        </section>

        <section className="panel glass highlight-box">
          {top ? (
            <>
              <h3>Главная лиса смены</h3>
              <p className="leader-name">{getFoxDisplayName(top.fox_id, observations)}</p>
              <p className="leader-meta muted">{top.fox_id} · балл <strong>{top.score.toFixed(2)}</strong></p>
              <p className="leader-reason">{top.reasons[0]}</p>
              <button className="btn ghost btn-sm" type="button" onClick={() => { audio.click(); setScreen("stats"); }}>
                Почему так получилось →
              </button>
            </>
          ) : (
            <>
              <h3>Пока без главной лисы</h3>
              <p className="empty">Запишите первую встречу в разделе «Добавить»</p>
            </>
          )}
        </section>
      </div>

      <section className="panel glass tz-checklist">
        <h3>Ответы на 5 вопросов из задания</h3>
        <ul className="tz-list">
          <li><strong>Сколько лис:</strong> {stats.uniqueFoxes.length} — {stats.uniqueFoxes.map((id) => getFoxDisplayName(id, observations)).join(", ") || "нет"}</li>
          <li><strong>Где чаще бывают:</strong> {heat.length ? heat.map(([n, c]) => `«${n}» (${c})`).join(", ") : "нет"}</li>
          <li><strong>Что влияет на балл:</strong> заметность, добыча ×{params.preyWeight}, ночь ×{params.nightBonus}, повтор ×{params.repeatBonus}</li>
          <li><strong>Кто главнее и почему:</strong> {top ? `${getFoxDisplayName(top.fox_id, observations)} (${top.fox_id}) — ${top.reasons[0]}` : "нет данных"}</li>
          <li><strong>Как менять сводку:</strong> «Статистика» — отрезок и веса · «Добавить» — записи · карта → фильтр</li>
        </ul>
      </section>
    </div>
  );
}
