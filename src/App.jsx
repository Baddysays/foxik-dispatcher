import { useGame } from "./context/GameContext.jsx";
import StartScreen from "./components/StartScreen.jsx";
import StatsScreen from "./components/StatsScreen.jsx";
import AddScreen from "./components/AddScreen.jsx";
import WorklogScreen from "./components/WorklogScreen.jsx";
import MuteToggle from "./components/MuteToggle.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import FoxBackdrop from "./components/FoxBackdrop.jsx";

const TABS = [
  { id: "start", label: "Обзор", icon: "◉" },
  { id: "stats", label: "Статистика", icon: "▤" },
  { id: "manual", label: "Добавить", icon: "＋" },
  { id: "worklog", label: "AI Worklog", icon: "◎" },
];

const PAGE_META = {
  start: {
    title: "Сводка лесной смены",
    sub: "Карта, цифры смены, хронология и краткая сводка.",
  },
  stats: {
    title: "Подробная сводка",
    sub: "Отрезок смены, из чего складывается балл, фильтры и журнал встреч.",
  },
  manual: {
    title: "Добавить",
    sub: "Запись встреч, демо-данные, сброс к стартовым данным и ручной JSON.",
  },
  worklog: {
    title: "AI Worklog",
    sub: "Как делал проект — 6 чекпоинтов с AI.",
  },
};

export default function App() {
  const { screen, setScreen, audio } = useGame();
  const meta = PAGE_META[screen] || PAGE_META.start;

  let view = <StartScreen />;
  if (screen === "stats") view = <StatsScreen />;
  else if (screen === "manual") view = <AddScreen />;
  else if (screen === "worklog") view = <WorklogScreen />;

  return (
    <>
      <FoxBackdrop />
      <div className="app-shell">
      <aside className="sidebar glass">
        <div className="sidebar-brand">
          <span className="brand-fox" aria-hidden="true">🦊</span>
          <div>
            <div className="brand-name">Лисий <b>диспетчер</b></div>
            <div className="brand-tag">Лесная смена</div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Разделы">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"nav-item" + (screen === t.id ? " active" : "")}
              onClick={() => { audio.click(); setScreen(t.id); }}
              onMouseEnter={() => audio.hover()}
            >
              <span className="nav-icon" aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ThemeToggle />
          <MuteToggle />
        </div>
      </aside>

      <div className="main-wrap">
        <header className="page-head">
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-sub">{meta.sub}</p>
        </header>
        <main className="content">{view}</main>
      </div>
      </div>
    </>
  );
}
