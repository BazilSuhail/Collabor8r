import { useRef } from "react";
import { gsap, scaled, useEntry } from "../../utils/motion.js";

const R = 52;
const C = 2 * Math.PI * R;
// Series order from the chart tokens: ember, iris, spruce, saffron, ink, faint (the shell tone name for faint is muted).
export const DONUT_TONES = ["ember", "iris", "spruce", "saffron", "ink", "muted"];

// parts: [{ label, value }]. Colours follow DONUT_TONES in order.
export default function DonutChart({ label, parts = [], centerValue, centerLabel, format = String }) {
  const ref = useRef(null);
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  let offset = 0;
  const arcs = parts.map((p, i) => {
    const len = (p.value / total) * C;
    const arc = { ...p, tone: DONUT_TONES[i % DONUT_TONES.length], len, offset };
    offset += len;
    return arc;
  });

  useEntry(
    ref,
    ({ q }) => {
      q(".donut__arc").forEach((el, i) => {
        gsap.fromTo(
          el,
          { strokeDasharray: `0 ${C}` },
          {
            strokeDasharray: `${el.dataset.len} ${C}`,
            duration: scaled(1),
            delay: scaled(0.2 + i * 0.12),
            ease: "power3.inOut",
          },
        );
      });
    },
    [parts.map((p) => p.value).join(",")],
  );

  return (
    <div ref={ref} className="flex items-center gap-[24px] w560:flex-col w560:items-stretch">
      <div className="donut w560:[margin:0_auto]" role="img" aria-label={label}>
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle className="donut__track" cx="70" cy="70" r={R} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              className={`donut__arc ${a.tone === "muted" ? "stroke-faint" : `tone-stroke--${a.tone}`}`}
              cx="70"
              cy="70"
              r={R}
              strokeDasharray={`${a.len} ${C}`}
              strokeDashoffset={-a.offset}
              data-len={a.len}
            />
          ))}
        </svg>
        <div className="donut__mid">
          <b>{centerValue}</b>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 grid gap-[10px] min-w-0">
        {arcs.map((a) => (
          <li key={a.label} className="flex items-center gap-[10px] min-w-0">
            <i className={`tone--${a.tone} w-[10px] h-[10px] rounded-[3px] shrink-0`} aria-hidden="true" />
            <span className="font-bold truncate min-w-0 flex-1">{a.label}</span>
            <b className="num">{format(a.value)}</b>
            <small className="text-muted text-[12px]">{Math.round((a.value / total) * 100)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
