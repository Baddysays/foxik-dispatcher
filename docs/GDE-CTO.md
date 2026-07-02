# Карта проекта

Демо: https://foxik.baddysays.ru

## Код

| Файл | Назначение |
|------|------------|
| src/data.js | Стартовый JSON ТЗ, локации |
| src/analytics.js | Формула скоринга и фильтры |
| src/context/GameContext.jsx | Состояние, WORKLOG |
| src/components/StartScreen.jsx | Обзор (ядро ТЗ) |
| src/components/StatsScreen.jsx | Таблица, фильтры |
| src/components/AddScreen.jsx | Добавление и JSON |
| src/components/ForestMap.jsx | SVG-карта (оригинальность) |
| src/components/ObservationTimeline.jsx | Хронология смены |
| src/components/ScoreBreakdown.jsx | Разбор балла лидера |

## 5 вопросов ТЗ → где ответ

| Вопрос | Где |
|--------|-----|
| Сколько лис | KPI на Обзоре |
| Где активность | Карта + тепло |
| Что влияет | Слайдеры + формула |
| Лидер и почему | ScoreBreakdown + reasons |
| Как менять отчёт | Слайдеры, карта, Добавить, Статистика |
