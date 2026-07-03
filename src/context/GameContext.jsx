import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  INITIAL_OBSERVATIONS,
  createFoxObservation,
  defaultDisplayName,
  findFoxByDisplayName,
  foxIdFromIndex,
  generateRandomObservations,
  getFoxColor,
  makeFoxId,
} from "../data.js";
import { importObservationsJson } from "../jsonImport.js";
import { computeStats, filterObservations, filterByMeasurementWindow } from "../analytics.js";
import { AudioEngine } from "../audio.js";

export const WORKLOG = [
  {
    title: "Первая задача для AI",
    text:
      "Скинул в Cursor описание задачи и спросил: «Сделай интерфейс лесного смотрителя — чтобы смотреть данные, добавлять, " +
      "менять, статистика пересчитывалась. Что посоветуешь по структуре?»",
  },
  {
    title: "Архитектура и интерфейс",
    text:
      "Попросил AI помочь с раскладкой блоков и общим видом. Накидал идеи, я сгенерил картинки через Nano Banana — " +
      "фон, карту, расположение карточек. Потом показал Cursor'у, как хочу, и он сверстал основу.",
  },
  {
    title: "Мои самостоятельные решения",
    text:
      "Взял React + Vite — сам решил, быстро и просто. Вынес все расчёты (фильтры, рейтинг, статистику) в отдельный " +
      "файл analytics.js — чтобы логику можно было проверить отдельно от вёрстки и код не захламлять. Стартовые данные в data.js.",
  },
  {
    title: "Доработки логики и UX",
    text:
      "Добавил свои фишки: звук леса, переключатель день/ночь, проверку загружаемого JSON (чтобы не падал от битых " +
      "данных, показывал понятную ошибку). Сделал тестовые json-файлы для себя — проверить импорт. Всё правил в Cursor, " +
      "иногда показывал код другим моделям для свежих идей.",
  },
  {
    title: "Ошибки и исправления",
    text:
      "Багов наловил кучу: при добавлении записи рейтинг не обновлялся, фильтры слетали, локации в выпадающем списке " +
      "дублировались, при удалении наблюдения статистика не пересчитывалась, на мобилке ломалась вёрстка, неправильно " +
      "считался средний балл при пустом массиве, импорт JSON валился от лишних пробелов. Всё поправил, прогонял ручные " +
      "тесты после каждой правки.",
  },
  {
    title: "Финальная проверка и чистка",
    text:
      "Сбросил к стартовым данным — у Рыжика (fox_001) итоговый балл ~12.40, сошлось. Потыкал все сценарии: добавил, " +
      "удалил, отфильтровал, поменял слайдеры — статистика меняется адекватно. Перед деплоем вычистил весь отладочный " +
      "мусор (console.log, лишние комментарии, временные файлы). Проверил на телефоне, подправил отступы. Всё готово.",
  },
];

const TAB_HASH = { start: "", stats: "stats", manual: "add", worklog: "worklog" };
const HASH_TAB = { "": "start", stats: "stats", add: "manual", manual: "manual", worklog: "worklog" };

export const DEFAULT_FILTERS = {
  foxId: "all",
  location: "all",
  color: "all",
  nightOnly: false,
  preyOnly: false,
  search: "",
};

const audio = new AudioEngine();

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [screen, setScreen] = useState("start");
  const [lightMode, setLightMode] = useState(false);
  const [observations, setObservations] = useState(() => [...INITIAL_OBSERVATIONS]);
  const [params, setParams] = useState({
    preyWeight: 1.5,
    nightBonus: 0.8,
    repeatBonus: 1.2,
    measurementMode: "24h",
    measurementFrom: "08:00",
    measurementTo: "18:00",
    randomObsCount: 12,
    randomFoxCount: 6,
  });
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [muted, setMuted] = useState(() => audio.isMuted());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", lightMode ? "day" : "night");
    audio.setTheme(lightMode ? "day" : "night");
  }, [lightMode]);

  useEffect(() => {
    const boot = () => audio.boot();
    window.addEventListener("pointerdown", boot, { once: true });
    window.addEventListener("keydown", boot, { once: true });
    return () => {
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", boot);
    };
  }, []);

  const toggleLightMode = useCallback(() => {
    setLightMode((v) => !v);
  }, []);

  const setScreenSafe = useCallback((next) => {
    setScreen(next);
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const id = HASH_TAB[window.location.hash.replace(/^#/, "").toLowerCase()] || "start";
      setScreenSafe(id);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [setScreenSafe]);

  useEffect(() => {
    const hash = TAB_HASH[screen] || "";
    const target = hash ? `#${hash}` : "";
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search + target);
    }
  }, [screen]);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    audio.click();
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch }));
  }, []);

  const deleteObservation = useCallback((id) => {
    setObservations((prev) => prev.filter((o) => String(o.id) !== String(id)));
    audio.alert();
  }, []);

  const updateObservation = useCallback((id, patch) => {
    setObservations((prev) =>
      prev.map((o) => {
        if (String(o.id) !== String(id)) return o;
        const next = { ...o, ...patch };
        if (patch.suspicion !== undefined) {
          next.suspicion_level = Math.min(10, Math.max(1, Number(patch.suspicion) || 5));
        }
        if (patch.suspicion_level !== undefined) {
          next.suspicion_level = Math.min(10, Math.max(1, Number(patch.suspicion_level) || 5));
        }
        return next;
      })
    );
    audio.click();
  }, []);

  const loadRandomObservations = useCallback((obsCount, foxCount) => {
    const c = obsCount ?? params.randomObsCount ?? 12;
    const f = foxCount ?? params.randomFoxCount ?? 6;
    setObservations(generateRandomObservations(c, f));
    audio.shuffle();
  }, [params.randomObsCount, params.randomFoxCount]);

  const applyManualJson = useCallback((text) => {
    const result = importObservationsJson(text);
    setObservations(result.observations);
    audio.alert();
    return result;
  }, []);

  const resetObservations = useCallback(() => {
    const next = JSON.parse(JSON.stringify(INITIAL_OBSERVATIONS));
    setObservations(next);
    setFilters({ ...DEFAULT_FILTERS });
    audio.shuffle();
    return next;
  }, []);

  const addObservation = useCallback(
    ({ name, fox_id, location, color, suspicion, has_prey, time }) => {
      const label = String(name || "").trim();
      let id = fox_id;
      if (!id && label) {
        id = findFoxByDisplayName(label, observations) ?? undefined;
      }
      if (!id) {
        const taken = new Set(observations.map((o) => o.fox_id));
        for (let i = 0; i < 50; i += 1) {
          const candidate = foxIdFromIndex(i);
          if (!taken.has(candidate)) {
            id = candidate;
            break;
          }
        }
        id = id || makeFoxId(label || "лиса", [...taken]);
      }
      const resolvedColor = observations.some((o) => o.fox_id === id)
        ? getFoxColor(id, observations)
        : color;
      const obs = createFoxObservation({
        fox_id: id,
        display_name: label || defaultDisplayName(id) || undefined,
        location,
        color: resolvedColor,
        suspicion_level: Number(suspicion) || 5,
        has_prey: Boolean(has_prey),
        time,
      });
      setObservations((prev) => [...prev, obs]);
      audio.alert();
    },
    [observations]
  );

  const removeFox = useCallback((foxId) => {
    setObservations((prev) => prev.filter((o) => o.fox_id !== foxId));
    audio.click();
  }, []);

  const toggleMute = useCallback(() => {
    audio.toggleMute();
    setMuted(audio.isMuted());
  }, []);

  const getFilteredStats = useCallback(() => {
    const inWindow = filterByMeasurementWindow(observations, params);
    const filtered = filterObservations(inWindow, filters);
    return {
      filtered,
      inWindow,
      stats: computeStats(filtered, params),
      measurement: {
        total: observations.length,
        inWindow: inWindow.length,
        excluded: observations.length - inWindow.length,
      },
    };
  }, [observations, filters, params]);

  const value = useMemo(
    () => ({
      screen,
      setScreen: setScreenSafe,
      lightMode,
      toggleLightMode,
      observations,
      params,
      updateParams,
      filters,
      updateFilters,
      resetFilters,
      deleteObservation,
      updateObservation,
      loadRandomObservations,
      applyManualJson,
      resetObservations,
      addObservation,
      removeFox,
      getFilteredStats,
      audio,
      muted,
      toggleMute,
      worklog: WORKLOG,
    }),
    [
      screen,
      setScreenSafe,
      lightMode,
      toggleLightMode,
      observations,
      params,
      filters,
      deleteObservation,
      updateObservation,
      loadRandomObservations,
      applyManualJson,
      resetObservations,
      addObservation,
      removeFox,
      getFilteredStats,
      muted,
      toggleMute,
      resetFilters,
      updateFilters,
      updateParams,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
