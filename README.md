# 🦊 Лисий диспетчер

> Интерактивная панель лесного смотрителя: наблюдения, скоринг и сводка смены

[![Демо](https://img.shields.io/badge/demo-foxik.baddysays.ru-f59e0b?style=for-the-badge)](https://foxik.baddysays.ru)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)

По наблюдениям о лисах отвечает: **кто заметнее**, **где активность**, **из чего складывается балл** — и всё пересчитывается сразу при смене данных или параметров.

**Живое демо →** [foxik.baddysays.ru](https://foxik.baddysays.ru)

---

## Быстрый старт

```bash
git clone git@github.com:Baddysays/foxik-dispatcher.git
cd foxik-dispatcher
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в dist/
```

---

## Разделы

| Раздел | Что делает |
|--------|------------|
| **Обзор** | KPI смены, карта леса, хронология встреч, топ-3 лис, краткая сводка |
| **Статистика** | Окно замеров, веса формулы, фильтры, рейтинг, журнал с редактированием заметности |
| **Добавить** | Форма записи, генератор демо-данных, сброс к стартовым данным, импорт JSON |
| **AI Worklog** | 6 чекпоинтов — как проект делался с AI (Cursor) |

Дополнительно: **день / ночь**, **звук леса** (можно выключить), **мобильная вёрстка**.

---

## Формула балла

```
балл = средняя заметность
     + (добыча × вес добычи)
     + (ночные визиты × ночной бонус)
     + (повторы локации × бонус повтора)
```

Реализация: [`src/analytics.js`](src/analytics.js)

**Стартовые данные:** 5 наблюдений, 4 лисы → лидер **Рыжик (fox_001)** ≈ **12.40**  
Сброс: **Добавить → Сброс к стартовым данным**

---

## Стек

- **React 19** + **Vite 6**
- SVG-карта, PNG-фоны (день / ночь)
- **Web Audio API** — эмбиент и звуки UI
- Шрифт **TikTokSans** (локально, `public/fonts/`)

---

## Структура проекта

```
src/
├── analytics.js          # формула, фильтры, окно замеров
├── jsonImport.js         # импорт JSON с валидацией
├── data.js               # стартовые данные
├── audio.js              # звук
├── context/GameContext.jsx
└── components/           # экраны и UI

docs/samples/             # примеры JSON для импорта
```

Карта файлов: [`docs/GDE-CTO.md`](docs/GDE-CTO.md)

---

## Примеры JSON

| Файл | Назначение |
|------|------------|
| [`01-baseline-mox.json`](docs/samples/01-baseline-mox.json) | Базовый набор (5 obs) |
| [`02-night-shift-extended.json`](docs/samples/02-night-shift-extended.json) | Ночная смена, повторы |
| [`03-mixed-validation.json`](docs/samples/03-mixed-validation.json) | Пропуски, «неизвестен» окрас |

---

## AI-инструменты

- **Cursor Agent** — код, рефакторинг, деплой, ассеты
- Worklog в приложении описывает ключевые шаги работы с AI

---

## Ссылки

- [Демо](https://foxik.baddysays.ru)
- [Репозиторий](https://github.com/Baddysays/foxik-dispatcher)
