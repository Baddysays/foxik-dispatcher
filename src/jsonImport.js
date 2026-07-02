import {
  FOX_COLORS,
  LOCATIONS,
  UNKNOWN_FOX_COLOR,
  getFoxColor,
  normalizeFoxColor,
  normalizeObservation,
} from "./data.js";

export const MAX_UNIQUE_FOXES = 100;
export const MAX_OBSERVATIONS = 500;

const LOC_NAMES = new Set(LOCATIONS.map((l) => l.name));

/** Справка для UI — возможные причины ошибок импорта. */
export const JSON_IMPORT_REASONS = [
  {
    code: "syntax",
    title: "Некорректный JSON",
    text: "Синтаксическая ошибка: лишняя запятая, незакрытая скобка, кавычки «» вместо \". Проверьте файл в валидаторе JSON.",
  },
  {
    code: "not_array",
    title: "Не массив",
    text: "Корень документа должен быть массивом наблюдений: [ { ... }, { ... } ].",
  },
  {
    code: "too_many_foxes",
    title: "Больше 100 уникальных лис",
    text: `В смене допускается не более ${MAX_UNIQUE_FOXES} разных fox_id. Уменьшите число лис или объедините записи.`,
  },
  {
    code: "too_many_obs",
    title: "Слишком много записей",
    text: `Не более ${MAX_OBSERVATIONS} наблюдений за одну загрузку.`,
  },
  {
    code: "unknown_location",
    title: "Неизвестная локация",
    text: `Допустимы только: ${LOCATIONS.map((l) => l.name).join(", ")}. Запись с другой локацией пропускается — наблюдение там не ведётся.`,
  },
  {
    code: "unknown_color",
    title: "Неизвестный окрас",
    text: `Допустимы: ${FOX_COLORS.join(", ")} (регистр и форма слова не важны: «Рыжий», «РЫЖЫЙ» = рыжая). Иной окрас → «${UNKNOWN_FOX_COLOR}» (разноцветная метка на карте и в списках).`,
  },
  {
    code: "bad_time",
    title: "Некорректное время",
    text: "Формат ЧЧ:ММ (00:00–23:59). Пустое, «25:99» или текст — запись пропускается.",
  },
  {
    code: "empty",
    title: "Пустой массив",
    text: "После фильтрации не осталось ни одной валидной записи — данные не заменены.",
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseTimeString(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, reason: "время не указано" };
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(s);
  if (!m) return { ok: false, reason: `некорректный формат «${s}»` };
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) {
    return { ok: false, reason: `вне диапазона «${s}»` };
  }
  return { ok: true, time: pad(h) + ":" + pad(min) };
}

function parseLocation(raw) {
  const loc = String(raw ?? "").trim();
  if (!loc) return { ok: false, reason: "локация не указана" };
  if (!LOC_NAMES.has(loc)) {
    return { ok: false, reason: `локация «${loc}» — наблюдение не ведётся` };
  }
  return { ok: true, location: loc };
}

function parseColor(raw, fox_id, acceptedSoFar) {
  const rawStr = String(raw ?? "").trim();
  if (!rawStr) {
    return { color: getFoxColor(fox_id, acceptedSoFar), warning: null, color_original: null };
  }

  const parsed = normalizeFoxColor(rawStr);
  if (parsed.unknown) {
    return {
      color: UNKNOWN_FOX_COLOR,
      color_original: parsed.original,
      warning: `неизвестный окрас «${rawStr}» — отмечен как «${UNKNOWN_FOX_COLOR}»`,
    };
  }

  const warning =
    colorKey(parsed.original) !== colorKey(parsed.color)
      ? `окрас «${rawStr}» приведён к «${parsed.color}»`
      : null;

  return { color: parsed.color, color_original: null, warning };
}

function colorKey(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

function rowLabel(row, index) {
  const id = row?.id ?? `строка ${index + 1}`;
  const fox = row?.fox_id ?? row?.fox ?? "?";
  return `${id} (${fox})`;
}

/**
 * Разбор JSON с валидацией. Бросает Error при фатальной ошибке.
 * @returns {{ observations, imported, skipped, warnings }}
 */
export function importObservationsJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const err = new Error("Некорректный JSON: " + e.message);
    err.code = "syntax";
    throw err;
  }

  if (!Array.isArray(data)) {
    const err = new Error("Ожидается массив наблюдений [ { ... }, ... ]");
    err.code = "not_array";
    throw err;
  }

  if (data.length > MAX_OBSERVATIONS) {
    const err = new Error(`Слишком много записей: ${data.length}. Максимум ${MAX_OBSERVATIONS}.`);
    err.code = "too_many_obs";
    throw err;
  }

  const observations = [];
  const skipped = [];
  const warnings = [];

  for (let i = 0; i < data.length; i += 1) {
    const row = data[i];
    const label = rowLabel(row, i);

    if (!row || typeof row !== "object" || Array.isArray(row)) {
      skipped.push({ label, reason: "не объект наблюдения" });
      continue;
    }

    const fox_id = String(row.fox_id ?? row.fox ?? "").trim();
    if (!fox_id) {
      skipped.push({ label, reason: "не указан fox_id" });
      continue;
    }

    const loc = parseLocation(row.location);
    if (!loc.ok) {
      skipped.push({ label, reason: loc.reason });
      continue;
    }

    const time = parseTimeString(row.time);
    if (!time.ok) {
      skipped.push({ label, reason: time.reason });
      continue;
    }

    const colorResult = parseColor(row.color, fox_id, observations);
    if (colorResult.warning) {
      warnings.push({ label, text: colorResult.warning });
    }

    const suspicionRaw = Number(row.suspicion_level ?? row.suspicion ?? 5);
    const suspicion_level = Number.isFinite(suspicionRaw)
      ? Math.min(10, Math.max(1, Math.round(suspicionRaw)))
      : 5;
    if (!Number.isFinite(suspicionRaw) || suspicionRaw < 1 || suspicionRaw > 10) {
      warnings.push({ label, text: `заметность приведена к ${suspicion_level}` });
    }

    const obs = normalizeObservation(
      {
        ...row,
        fox_id,
        location: loc.location,
        color: colorResult.color,
        time: time.time,
        suspicion_level,
        has_prey: row.has_prey ?? row.prey,
      },
      i
    );
    if (colorResult.color_original) {
      obs.color_original = colorResult.color_original;
    }
    observations.push(obs);
  }

  const uniqueFoxes = new Set(observations.map((o) => o.fox_id));
  if (uniqueFoxes.size > MAX_UNIQUE_FOXES) {
    const err = new Error(
      `Слишком много уникальных лис: ${uniqueFoxes.size}. В смене допускается не более ${MAX_UNIQUE_FOXES} fox_id.`
    );
    err.code = "too_many_foxes";
    throw err;
  }

  if (observations.length === 0) {
    const err = new Error(
      skipped.length
        ? "Ни одна запись не прошла проверку. См. причины пропуска ниже."
        : "Пустой массив наблюдений."
    );
    err.code = "empty";
    err.skipped = skipped;
    err.warnings = warnings;
    throw err;
  }

  return {
    observations,
    imported: observations.length,
    skipped,
    warnings,
  };
}
