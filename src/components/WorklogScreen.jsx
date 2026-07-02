import { useGame } from "../context/GameContext.jsx";

export default function WorklogScreen() {
  const { worklog } = useGame();

  return (
    <div className="screen">
      <section className="panel glass worklog-panel">
        <h3>AI Worklog — как я делал проект</h3>
        <p className="muted">{worklog.length} чекпоинтов — без переписки целиком.</p>
        <ol className="worklog-timeline">
          {worklog.map((s, i) => (
            <li className="worklog-step" key={s.title}>
              <span className="worklog-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="worklog-marker" aria-hidden="true" />
              <div className="worklog-body">
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
