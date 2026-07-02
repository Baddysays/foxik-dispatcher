# 🦊 Лисий диспетчер

> Интерактивная панель лесного смотрителя — тестовое задание **MOX · AI-first Developer**  
> Сценарий **01 — Лисий диспетчер**

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

## Что внутри

| Раздел | Что делает |
|--------|------------|
| **Обзор** | KPI смены, карта леса, хронология встреч, топ-3 лис, ответы на 5 вопросов ТЗ |
| **Статистика** | Окно замеров, веса формулы, фильтры, рейтинг, журнал с редактированием заметности |
| **Добавить** | Форма записи, генератор демо-данных, сброс к данным ТЗ, импорт JSON |
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

**Стартовые данные (ТЗ MOX):** 5 наблюдений, 4 лисы → лидер **Рыжик (fox_001)** ≈ **12.40**  
Сброс: **Добавить → Сброс к данным ТЗ**

---

## Соответствие ТЗ

| Требование MOX | Статус |
|----------------|--------|
| Стартовые данные + редактирование / JSON | ✅ |
| Интерактив (слайдеры, фильтры, форма) | ✅ |
| Понятный результат (рейтинг, карта, объяснение) | ✅ |
| **AI Worklog** в интерфейсе | ✅ |
| 5 вопросов задания — блок на Обзоре | ✅ |

Подробный чеклист для проверяющего: [`docs/DLYA-PROVERKI.md`](docs/DLYA-PROVERKI.md)

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
├── data.js               # стартовые данные MOX
├── audio.js              # звук
├── context/GameContext.jsx
└── components/           # экраны и UI

docs/
├── DLYA-PROVERKI.md      # чеклист для ревьюера
├── official-test-task.html
└── samples/              # 3 тестовых JSON для импорта
```

---

## Тестовые JSON

| Файл | Назначение |
|------|------------|
| [`01-baseline-mox.json`](docs/samples/01-baseline-mox.json) | Эталон ТЗ |
| [`02-night-shift-extended.json`](docs/samples/02-night-shift-extended.json) | Ночная смена, повторы |
| [`03-mixed-validation.json`](docs/samples/03-mixed-validation.json) | Пропуски, «неизвестен» окрас |

---

## AI-инструменты

- **Cursor Agent** — код, рефакторинг, деплой, ассеты
- Worklog в приложении описывает ключевые шаги работы с AI

---

## Ссылки

- [ТЗ MOX (Notion)](https://mox-studio.notion.site/AI-first-Developer-MOX-38894a5391e18140a0edf7192f03723c)
- [Демо](https://foxik.baddysays.ru)
- [Карта файлов](docs/GDE-CTO.md)

---

## Лицензия

Учебный проект для тестового задания MOX. Свободное использование в рамках ревью.
