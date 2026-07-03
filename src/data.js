/** Пул имён лис (до 50 уникальных). fox_NNN — только технический id. */
export const FOX_NAME_POOL = [
  "Рыжик", "Гошик", "Ласка", "Туманка", "Полянка", "Хитрый", "Зорька", "Метель",
  "Снежок", "Бурый", "Чёрный", "Серебро", "Ловкач", "Пушистик", "Стрелка", "Ночка",
  "Воришка", "Быстрый", "Тихоня", "Смешной", "Грация", "Марта", "Феня", "Кроха",
  "Огонёк", "Искра", "Ветерок", "Росинка", "Мох", "Тропка", "Ягодка", "Клен",
  "Дымка", "Шёпот", "Умник", "Шустрый", "Глазастый", "Хвостик", "Крупка", "Мелкий",
  "Славный", "Дружок", "Нюрка", "Лапка", "Косой", "Зоркий", "Рыжуля", "Белка",
  "Тень", "Светлячок",
];

export function foxIdFromIndex(i) {
  return "fox_" + String(i + 1).padStart(3, "0");
}

export function defaultDisplayName(fox_id) {
  const m = /^fox_(\d+)$/.exec(String(fox_id || ""));
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  return idx >= 0 && idx < FOX_NAME_POOL.length ? FOX_NAME_POOL[idx] : null;
}

export function getFoxDisplayName(fox_id, observations = []) {
  const found = observations.find((o) => o.fox_id === fox_id);
  if (found?.display_name) return found.display_name;
  return defaultDisplayName(fox_id) || fox_id;
}

/** Найти fox_id по имени (без учёта регистра). */
export function findFoxByDisplayName(name, observations = []) {
  const label = String(name || "").trim().toLowerCase();
  if (!label) return null;
  const found = observations.find((o) => (o.display_name || "").trim().toLowerCase() === label);
  return found?.fox_id ?? null;
}

export function formatFoxLabel(fox_id, observations = []) {
  const name = getFoxDisplayName(fox_id, observations);
  return name === fox_id ? fox_id : `${name} (${fox_id})`;
}

export function buildFoxRoster(count) {
  const n = Math.max(1, Math.min(50, count));
  return Array.from({ length: n }, (_, i) => ({
    fox_id: foxIdFromIndex(i),
    display_name: FOX_NAME_POOL[i % FOX_NAME_POOL.length],
    color: FOX_COLORS[i % FOX_COLORS.length],
  }));
}

/** Окрас лисы — один на fox_id (по первой отметке или индексу id). */
export function getFoxColor(fox_id, observations = []) {
  const same = observations.filter((o) => o.fox_id === fox_id);
  if (same.length) {
    const c = same[0].color;
    if (c) return c;
  }
  const m = /^fox_(\d+)$/.exec(String(fox_id || ""));
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    return FOX_COLORS[((idx % FOX_COLORS.length) + FOX_COLORS.length) % FOX_COLORS.length];
  }
  return "рыжая";
}

export const LOCATIONS = [
  { id: "north", name: "Северная поляна", x: 0.22, y: 0.38 },
  { id: "moss", name: "Моховой овраг", x: 0.78, y: 0.38 },
  { id: "mist", name: "Туманная тропа", x: 0.5, y: 0.72 },
];

/** Окрасы, которые можно выбрать в форме (не из JSON). */
export const FOX_COLORS = ["рыжая", "черная", "серебристая"];

/** Маркер неизвестного окраса — только при импорте JSON. */
export const UNKNOWN_FOX_COLOR = "неизвестен";

export const FOX_SWATCH = {
  "рыжая": { body: "#e86c2a", dark: "#b84a18", belly: "#ffc48a" },
  "черная": { body: "#2a2a35", dark: "#111118", belly: "#4a4a58" },
  "серебристая": { body: "#c8d0dc", dark: "#8a95a8", belly: "#f0f4fa" },
  [UNKNOWN_FOX_COLOR]: { body: "unknown", dark: "unknown", unknown: true },
};

export function isUnknownFoxColor(color) {
  return color === UNKNOWN_FOX_COLOR;
}

/** Варианты окраса для фильтра: известные + «неизвестен», если есть в данных. */
export function foxColorsForFilter(observations = []) {
  const set = new Set(FOX_COLORS);
  if (observations.some((o) => isUnknownFoxColor(o.color))) {
    set.add(UNKNOWN_FOX_COLOR);
  }
  return [...set];
}

function colorKey(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

/**
 * Приводит окрас к каноническому виду. Регистр и формы слова не важны: «Рыжий», «РЫЖЫЙ» → «рыжая».
 * Неизвестные значения → «неизвестен».
 */
export function normalizeFoxColor(raw) {
  const original = String(raw ?? "").trim();
  if (!original) return { color: null, unknown: false, original: "" };

  const key = colorKey(original);

  for (const c of FOX_COLORS) {
    if (colorKey(c) === key) {
      return { color: c, unknown: false, original };
    }
  }

  const aliases = {
    рыжий: "рыжая",
    рыжые: "рыжая",
    рыжым: "рыжая",
    рыжая: "рыжая",
    черный: "черная",
    черная: "черная",
    серебристый: "серебристая",
    серебро: "серебристая",
    серый: "серебристая",
    серебристая: "серебристая",
  };

  if (aliases[key]) {
    return { color: aliases[key], unknown: false, original };
  }

  if (key.startsWith("рыж")) return { color: "рыжая", unknown: false, original };
  if (key.startsWith("черн")) return { color: "черная", unknown: false, original };
  if (key.startsWith("серебр") || key === "сер") {
    return { color: "серебристая", unknown: false, original };
  }

  return { color: UNKNOWN_FOX_COLOR, unknown: true, original };
}

export function formatFoxColorLabel(color, observation) {
  if (isUnknownFoxColor(color)) {
    const src = observation?.color_original;
    return src ? `неизвестен («${src}»)` : "неизвестен";
  }
  return color || "—";
}

/** Стартовые данные (5 наблюдений). */
export const INITIAL_OBSERVATIONS = [
  { id: "obs_001", fox_id: "fox_001", display_name: "Рыжик", location: "Северная поляна", color: "рыжая", has_prey: true, suspicion_level: 8, time: "08:20" },
  { id: "obs_002", fox_id: "fox_002", display_name: "Гошик", location: "Туманная тропа", color: "черная", has_prey: false, suspicion_level: 5, time: "09:05" },
  { id: "obs_003", fox_id: "fox_001", display_name: "Рыжик", location: "Северная поляна", color: "рыжая", has_prey: false, suspicion_level: 9, time: "10:40" },
  { id: "obs_004", fox_id: "fox_003", display_name: "Ласка", location: "Моховой овраг", color: "серебристая", has_prey: true, suspicion_level: 7, time: "11:15" },
  { id: "obs_005", fox_id: "fox_004", display_name: "Туманка", location: "Северная поляна", color: "рыжая", has_prey: false, suspicion_level: 3, time: "12:10" },
];

export function getSuspicion(o) {
  return Number(o.suspicion_level ?? o.suspicion ?? 0);
}

const LOC_NAMES = LOCATIONS.map((l) => l.name);

function pad(n) {
  return String(n).padStart(2, "0");
}

function randomTime() {
  const h = Math.floor(Math.random() * 24);
  const m = Math.floor(Math.random() * 60);
  return pad(h) + ":" + pad(m);
}

export function generateRandomObservations(obsCount = 12, foxCount = 6) {
  const count = Math.max(1, Math.min(100, obsCount));
  const foxes = buildFoxRoster(foxCount);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const fox = foxes[Math.floor(Math.random() * foxes.length)];
    const hour = Math.floor(Math.random() * 24);
    out.push({
      id: "obs_r" + String(i + 1).padStart(3, "0"),
      fox_id: fox.fox_id,
      display_name: fox.display_name,
      location: LOC_NAMES[Math.floor(Math.random() * LOC_NAMES.length)],
      color: fox.color,
      time: pad(hour) + ":" + pad(Math.floor(Math.random() * 60)),
      has_prey: Math.random() < 0.45,
      suspicion_level: 1 + Math.floor(Math.random() * 9),
    });
  }
  return out;
}

export function normalizeObservation(row, i = 0) {
  const obs = {
    id: row.id ?? "obs_m" + String(i + 1).padStart(3, "0"),
    fox_id: String(row.fox_id ?? row.fox ?? "fox_???"),
    location: String(row.location ?? LOC_NAMES[0]),
    color: String(row.color ?? "рыжая"),
    time: String(row.time ?? "22:00"),
    has_prey: Boolean(row.has_prey ?? row.prey),
    suspicion_level: Number(row.suspicion_level ?? row.suspicion ?? 5) || 0,
  };
  if (row.display_name) {
    obs.display_name = String(row.display_name);
  }
  return obs;
}

export function createFoxObservation({ fox_id, display_name, location, color, suspicion_level, has_prey, time }) {
  return normalizeObservation({
    id: "obs_" + Date.now(),
    fox_id,
    display_name,
    location: location || LOC_NAMES[0],
    color: color || "рыжая",
    has_prey: has_prey ?? false,
    suspicion_level: suspicion_level ?? 5,
    time: time ?? nowTime(),
  });
}

export function locationIdByName(name) {
  const found = LOCATIONS.find((l) => l.name === name);
  return found ? found.id : "north";
}

export function nowTime() {
  const d = new Date();
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

export function makeFoxId(displayName, taken) {
  const slug = String(displayName || "лиса")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\u0430-\u044f\u0451]/gi, "")
    .slice(0, 14) || "new";
  let id = "fox_" + slug;
  let n = 2;
  const set = new Set(taken);
  while (set.has(id)) {
    id = "fox_" + slug + "_" + n;
    n += 1;
  }
  return id;
}
