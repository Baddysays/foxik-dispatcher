import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { FOX_COLORS, FOX_SWATCH, LOCATIONS, nowTime, getFoxColor, findFoxByDisplayName, formatFoxColorLabel } from "../data.js";
import FoxColorDot from "./FoxColorDot.jsx";
import { JSON_IMPORT_REASONS } from "../jsonImport.js";
import RandomDataPanel from "./RandomDataPanel.jsx";

export default function AddScreen() {
  const {
    observations,
    params,
    updateParams,
    addObservation,
    removeFox,
    resetObservations,
    applyManualJson,
    loadRandomObservations,
    audio,
  } = useGame();

  const [name, setName] = useState("");
  const [foxColor, setFoxColor] = useState(FOX_COLORS[0]);
  const [location, setLocation] = useState(LOCATIONS[0].name);
  const [suspicion, setSuspicion] = useState(5);
  const [hasPrey, setHasPrey] = useState(false);
  const [time, setTime] = useState(nowTime());
  const [msg, setMsg] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonErr, setJsonErr] = useState(false);
  const [formErr, setFormErr] = useState(false);
  const [jsonReport, setJsonReport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setJsonText(JSON.stringify(observations, null, 2));
  }, [observations]);

  const foxes = [...new Map(observations.map((o) => [o.fox_id, o])).values()];
  const trimmedName = name.trim();
  const existingFoxId = trimmedName ? findFoxByDisplayName(trimmedName, observations) : null;
  const existingColor = existingFoxId ? getFoxColor(existingFoxId, observations) : null;

  const submit = () => {
    if (!trimmedName) {
      setFormErr(true);
      setMsg("Укажите имя лисы");
      return;
    }
    audio.click();
    addObservation({ name: trimmedName, location, color: foxColor, suspicion, has_prey: hasPrey, time });
    setName("");
    setSuspicion(5);
    setHasPrey(false);
    setFormErr(false);
    setMsg("Встреча записана — сводка обновилась");
  };

  const applyJson = () => {
    audio.click();
    try {
      const result = applyManualJson(jsonText);
      setJsonErr(false);
      setJsonReport(result);
      let text = `JSON применён: ${result.imported} записей`;
      if (result.skipped.length) text += ` · пропущено ${result.skipped.length}`;
      if (result.warnings.length) text += ` · предупреждений ${result.warnings.length}`;
      setMsg(text);
    } catch (e) {
      setJsonErr(true);
      setJsonReport(e.skipped ? { skipped: e.skipped, warnings: e.warnings || [] } : null);
      setMsg(e.message);
    }
  };

  const onJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.json$/i.test(file.name) && file.type && file.type !== "application/json") {
      setJsonErr(true);
      setMsg("Выберите файл .json");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(String(reader.result || ""));
      setJsonOpen(true);
      setJsonErr(false);
      setMsg(`Файл «${file.name}» загружен в редактор — нажмите «Применить JSON»`);
    };
    reader.onerror = () => {
      setJsonErr(true);
      setMsg("Не удалось прочитать файл");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  return (
    <div className="screen">
      <div className="add-layout">
        <section className="panel glass add-form">
          <h3>Новая встреча</h3>
          <p className="muted">Каждая запись — момент смены. Несколько встреч одной лисы повышают её балл.</p>
          <label>Имя лисы</label>
          <input type="text" placeholder="Рыжик, Гошик, Ласка…" value={name} onChange={(e) => { setName(e.target.value); setFormErr(false); }} maxLength={24} />
          <p className="muted tiny">Технический id — fox_001, fox_002… назначается автоматически.</p>
          {existingFoxId && (
            <p className="muted tiny">Лиса уже в смене — окрас «{formatFoxColorLabel(existingColor)}» будет сохранён.</p>
          )}
          <label>Окрас{existingFoxId ? " (для новой лисы)" : ""}</label>
          <div className={"swatch-row" + (existingFoxId ? " is-disabled" : "")}>
            {FOX_COLORS.map((c) => (
              <button key={c} type="button" disabled={Boolean(existingFoxId)} className={"swatch" + (foxColor === c ? " active" : "")} onClick={() => { audio.click(); setFoxColor(c); }}>
                <span className="swatch-dot" style={{ background: FOX_SWATCH[c].body }} />
                <span>{c}</span>
              </button>
            ))}
          </div>
          <label>Локация</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <label>Время</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <label>Насколько заметна: <span className="val">{suspicion}</span></label>
          <input type="range" min={1} max={10} step={1} value={suspicion} onInput={(e) => setSuspicion(Number(e.target.value))} />
          <label className="checks">
            <input type="checkbox" checked={hasPrey} onChange={(e) => setHasPrey(e.target.checked)} /> Замечена с добычей
          </label>
          <div className="btn-row">
            <button className="btn primary" type="button" onClick={submit}>Добавить</button>
          </div>
          {msg && !jsonOpen && <p className={"tagline " + (formErr ? "err" : "ok")}>{msg}</p>}
        </section>

        <section className="panel glass">
          <h3>Знакомые лисы ({foxes.length})</h3>
          <p className="muted">Список лис в смене — если удалить, пропадут все их встречи.</p>
          {foxes.length === 0 ? (
            <p className="empty">Нет лис — запишите встречу или сгенерируйте данные</p>
          ) : (
            <ul className="creature-list">
              {foxes.map((o) => (
                <li className="creature-row" key={o.fox_id}>
                  <FoxColorDot color={getFoxColor(o.fox_id, observations)} />
                  <div className="creature-meta">
                    <strong>{o.display_name || o.fox_id}</strong>
                    <span className="muted">{o.fox_id} · {formatFoxColorLabel(getFoxColor(o.fox_id, observations), o)}</span>
                  </div>
                  <button type="button" className="btn ghost icon" onClick={() => {
                    const label = o.display_name || o.fox_id;
                    if (!window.confirm(`Удалить лису «${label}» и все её встречи?`)) return;
                    removeFox(o.fox_id);
                  }} title="Удалить все наблюдения лисы">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <RandomDataPanel
        params={params}
        updateParams={updateParams}
        onGenerate={() => {
          audio.click();
          loadRandomObservations();
          setMsg(`Сгенерировано: ${params.randomObsCount} наблюдений, ${params.randomFoxCount} лис`);
        }}
      />

      <section className="panel glass">
        <h3>Данные ТЗ</h3>
        <p className="muted">Вернуть стартовые 5 наблюдений из MOX (Notion).</p>
        <button className="btn ghost" type="button" onClick={() => { audio.click(); resetObservations(); setMsg("Сброшено к 5 встречам из ТЗ"); }}>
          Сброс к данным ТЗ
        </button>
      </section>

      <details className="panel glass json-panel" open={jsonOpen} onToggle={(e) => setJsonOpen(e.target.open)}>
        <summary>Ручной JSON (массив наблюдений)</summary>
        <p className="muted">Формат как в test-task.html MOX. После «Применить» — полная замена данных. Можно вставить текст или загрузить файл.</p>
        <details className="json-help">
          <summary className="muted tiny">Возможные ошибки и как их обрабатывает система</summary>
          <ul className="json-reasons">
            {JSON_IMPORT_REASONS.map((r) => (
              <li key={r.code}>
                <strong>{r.title}</strong> — {r.text}
              </li>
            ))}
          </ul>
        </details>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false} rows={12} />
        <div className="btn-row">
          <button className="btn primary" type="button" onClick={applyJson}>Применить JSON</button>
          <button className="btn ghost" type="button" onClick={() => { audio.click(); setJsonText(JSON.stringify(observations, null, 2)); }}>Загрузить текущие</button>
          <button className="btn ghost" type="button" onClick={() => { audio.click(); fileInputRef.current?.click(); }}>Загрузить файл…</button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={onJsonFile} />
        </div>
        {msg && jsonOpen && <p className={"tagline " + (jsonErr ? "err" : "ok")}>{msg}</p>}
        {jsonReport?.skipped?.length > 0 && (
          <div className="json-report">
            <p className="muted tiny">Пропущенные записи:</p>
            <ul className="json-report-list">
              {jsonReport.skipped.map((s, i) => (
                <li key={i}><span className="muted">{s.label}</span> — {s.reason}</li>
              ))}
            </ul>
          </div>
        )}
        {jsonReport?.warnings?.length > 0 && (
          <div className="json-report warn">
            <p className="muted tiny">Предупреждения (запись принята с исправлениями):</p>
            <ul className="json-report-list">
              {jsonReport.warnings.map((w, i) => (
                <li key={i}><span className="muted">{w.label}</span> — {w.text}</li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </div>
  );
}
