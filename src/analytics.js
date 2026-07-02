import { getSuspicion } from "./data.js";

function parseTime(t) {
  const [h, m] = String(t).split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function timeToMinutes(timeStr) {
  const { h, m } = parseTime(timeStr);
  return h * 60 + (m || 0);
}

export function isNightTime(timeStr) {
  const { h } = parseTime(timeStr);
  return h >= 18 || h < 6;
}

export function isWithinMeasurementWindow(timeStr, params = {}) {
  const mode = params.measurementMode ?? "24h";
  if (mode === "24h") return true;
  if (mode === "day") {
    const { h } = parseTime(timeStr);
    return h >= 6 && h < 18;
  }
  if (mode === "night") return isNightTime(timeStr);
  if (mode !== "range") return true;
  const t = timeToMinutes(timeStr);
  const from = timeToMinutes(params.measurementFrom ?? "00:00");
  const to = timeToMinutes(params.measurementTo ?? "23:59");
  if (from === to) return true;
  if (from < to) return t >= from && t <= to;
  return t >= from || t <= to;
}

export function filterByMeasurementWindow(observations, params = {}) {
  return observations.filter((o) => isWithinMeasurementWindow(o.time, params));
}

export function formatMeasurementWindow(params = {}) {
  const mode = params.measurementMode ?? "24h";
  if (mode === "24h") return "круглосуточно";
  if (mode === "day") return "день (06:00–18:00)";
  if (mode === "night") return "ночь (18:00–06:00)";
  const from = params.measurementFrom ?? "00:00";
  const to = params.measurementTo ?? "23:59";
  const overnight = timeToMinutes(from) > timeToMinutes(to);
  return `с ${from} по ${to}${overnight ? " (через полночь)" : ""}`;
}

function formulaDescription(params) {
  const window = formatMeasurementWindow(params);
  return (
    "Суммарный балл = средняя заметность + (добыча × вес добычи) + (ночные визиты × ночной бонус) + (повторы локации × бонус повтора). " +
    "Ночь для бонуса: 18:00–06:00. Отрезок смены: " +
    window +
    "."
  );
}

function repeatLocationBonus(observations) {
  const counts = {};
  for (const o of observations) {
    const key = o.fox_id + "|" + o.location;
    counts[key] = (counts[key] || 0) + 1;
  }
  const bonus = {};
  for (const o of observations) {
    const key = o.fox_id + "|" + o.location;
    if ((counts[key] || 0) >= 2) {
      bonus[o.fox_id] = (bonus[o.fox_id] || 0) + 1;
    }
  }
  return bonus;
}

export function computeStats(observations, params = {}) {
  const preyWeight = Number(params.preyWeight ?? 1.5);
  const nightBonus = Number(params.nightBonus ?? 0.8);
  const repeatBonus = Number(params.repeatBonus ?? 1.2);

  const uniqueFoxes = [...new Set(observations.map((o) => o.fox_id))].sort();

  const locationHeat = {};
  for (const o of observations) {
    locationHeat[o.location] = (locationHeat[o.location] || 0) + 1;
  }

  const repeatMap = repeatLocationBonus(observations);
  const byFox = {};

  for (const o of observations) {
    if (!byFox[o.fox_id]) {
      byFox[o.fox_id] = {
        fox_id: o.fox_id,
        display_name: o.display_name || null,
        count: 0,
        preyCount: 0,
        nightCount: 0,
        suspicionSum: 0,
        locations: {},
      };
    }
    const f = byFox[o.fox_id];
    if (!f.display_name && o.display_name) f.display_name = o.display_name;
    f.count += 1;
    if (o.has_prey) f.preyCount += 1;
    if (isNightTime(o.time)) f.nightCount += 1;
    f.suspicionSum += getSuspicion(o);
    f.locations[o.location] = (f.locations[o.location] || 0) + 1;
  }

  const foxRankings = Object.values(byFox)
    .map((f) => {
      const avgSuspicion = f.count ? f.suspicionSum / f.count : 0;
      const repeatLoc = repeatMap[f.fox_id] || 0;
      const score =
        avgSuspicion +
        f.preyCount * preyWeight +
        f.nightCount * nightBonus +
        repeatLoc * repeatBonus;
      const ctx = { preyWeight, nightBonus, repeatLoc, repeatBonus, avgSuspicion, score };
      const reasons = buildReasons(f, ctx);
      const parts = {
        suspicion: avgSuspicion,
        prey: f.preyCount * preyWeight,
        night: f.nightCount * nightBonus,
        repeat: repeatLoc * repeatBonus,
      };
      return { ...f, avgSuspicion, score, reasons, parts };
    })
    .sort((a, b) => b.score - a.score);

  const top = foxRankings[0] || null;
  const suspicionFactors = {
    preyWeight,
    nightBonus,
    repeatBonus,
    measurementMode: params.measurementMode ?? "24h",
    measurementFrom: params.measurementFrom,
    measurementTo: params.measurementTo,
    description: formulaDescription(params),
  };

  return {
    uniqueFoxes,
    locationHeat,
    foxRankings,
    topSuspiciousFox: top,
    suspicionFactors,
  };
}

function buildReasons(f, ctx) {
  const reasons = [];
  reasons.push("В среднем заметность " + ctx.avgSuspicion.toFixed(1) + " по " + f.count + " встречам");
  if (f.preyCount > 0) {
    reasons.push("Была с добычей " + f.preyCount + " раз (×" + ctx.preyWeight + ")");
  }
  if (f.nightCount > 0) {
    reasons.push("Ночью замечали " + f.nightCount + " раз (×" + ctx.nightBonus + ")");
  }
  if (ctx.repeatLoc > 0) {
    reasons.push("Снова в тех же местах: " + ctx.repeatLoc + " раз (×" + ctx.repeatBonus + " = +" + (ctx.repeatLoc * ctx.repeatBonus).toFixed(1) + ")");
  }
  const hotLoc = Object.entries(f.locations).sort((a, b) => b[1] - a[1])[0];
  if (hotLoc) {
    reasons.push("Чаще всего: «" + hotLoc[0] + "» (" + hotLoc[1] + ")");
  }
  reasons.push("Суммарный балл: " + ctx.score.toFixed(2));
  return reasons;
}

export function filterObservations(observations, filters = {}) {
  let list = [...observations];
  if (filters.foxId && filters.foxId !== "all") {
    list = list.filter((o) => o.fox_id === filters.foxId);
  }
  if (filters.location && filters.location !== "all") {
    list = list.filter((o) => o.location === filters.location);
  }
  if (filters.nightOnly) {
    list = list.filter((o) => isNightTime(o.time));
  }
  if (filters.preyOnly) {
    list = list.filter((o) => o.has_prey);
  }
  if (filters.color && filters.color !== "all") {
    list = list.filter((o) => o.color === filters.color);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.fox_id.toLowerCase().includes(q) ||
        (o.display_name || "").toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        (o.color || "").toLowerCase().includes(q) ||
        o.time.includes(q)
    );
  }
  return list;
}
