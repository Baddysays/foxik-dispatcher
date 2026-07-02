import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FOX_SWATCH, getSuspicion, getFoxDisplayName, getFoxColor, formatFoxColorLabel, isUnknownFoxColor } from "../data.js";
import { isWithinMeasurementWindow } from "../analytics.js";

const DAY_MIN = 24 * 60;
const AXIS_LABELS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

function timeToMin(t) {
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function TooltipCard({ o, observations, inWindow, x, y, above, onEnter, onLeave }) {
  return (
    <div
      className={"obs-timeline-float" + (above ? " above" : "")}
      style={{ left: x + "px", top: y + "px" }}
      role="tooltip"
      id={"tip-" + o.id}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <strong>{getFoxDisplayName(o.fox_id, [o])}</strong>
      <span className="muted">{o.fox_id}</span>
      <span>{o.time} · {o.location}</span>
      <span>{formatFoxColorLabel(getFoxColor(o.fox_id, observations), o)}{o.has_prey ? " · с добычей" : ""}</span>
      <span>заметность {getSuspicion(o)}</span>
      {!inWindow && <span className="tooltip-warn">вне отрезка смены</span>}
    </div>
  );
}

export default function ObservationTimeline({ observations, params }) {
  const [tip, setTip] = useState(null);
  const closeTimer = useRef(null);
  const sorted = [...observations].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setTip(null), 180);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const openTip = useCallback((target, o, inWindow) => {
    cancelClose();
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const gap = 12;
    const estH = 120;
    const belowY = r.bottom + gap;
    const above = belowY + estH > window.innerHeight - 12;
    setTip({
      o,
      inWindow,
      x: cx,
      y: above ? r.top - gap : belowY,
      above,
    });
  }, [cancelClose]);

  if (!sorted.length) {
    return <p className="empty">Пока нет встреч за смену</p>;
  }

  return (
    <>
      <div className="obs-timeline" aria-label="Хронология встреч за сутки">
        <div className="obs-timeline-axis">
          {AXIS_LABELS.map((label) => (
            <span key={label} style={{ left: (timeToMin(label) / DAY_MIN) * 100 + "%" }}>
              {label}
            </span>
          ))}
        </div>
        <div className="obs-timeline-track" />
        <div className="obs-timeline-day" aria-hidden="true" />
        {sorted.map((o) => {
          const left = (timeToMin(o.time) / DAY_MIN) * 100;
          const inWindow = params ? isWithinMeasurementWindow(o.time, params) : true;
          const color = getFoxColor(o.fox_id, observations);
          const unknown = isUnknownFoxColor(color);
          const swatch = FOX_SWATCH[color] || FOX_SWATCH["рыжая"];
          const active = tip?.o?.id === o.id;
          const label = `${getFoxDisplayName(o.fox_id, observations)}, ${o.time}, ${o.location}`;
          return (
            <div
              className={"obs-timeline-node" + (inWindow ? "" : " out-window") + (active ? " active" : "")}
              key={o.id}
              style={{
                left: left + "%",
                ...(unknown ? {} : { "--fox-color": swatch.body, "--fox-dark": swatch.dark }),
              }}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-expanded={active}
              aria-describedby={active ? "tip-" + o.id : undefined}
              onMouseEnter={(e) => openTip(e.currentTarget, o, inWindow)}
              onMouseLeave={scheduleClose}
              onFocus={(e) => openTip(e.currentTarget, o, inWindow)}
              onBlur={scheduleClose}
            >
              <span className={"obs-timeline-dot" + (unknown ? " fox-color-unknown" : "")} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      {tip &&
        createPortal(
          <TooltipCard {...tip} observations={observations} onEnter={cancelClose} onLeave={scheduleClose} />,
          document.body
        )}
    </>
  );
}
