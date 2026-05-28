import { useRef } from "react";
import { gsap, scaled, useEntry } from "../../utils/motion.js";

// Horizontal bars. rows: [{ key, label, value, valueText?, tone? }]. Bars scale to the largest value.
export default function HBars({ label, rows = [] }) {
  const ref = useRef(null);
  const max = Math.max(1, ...rows.map((r) => r.value));

  useEntry(
    ref,
    ({ q }) => {
      gsap.fromTo(
        q(".hbars__whole"),
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "0 50%",
          duration: scaled(1.1),
          ease: "power3.out",
          stagger: scaled(0.08),
          delay: scaled(0.2),
          clearProps: "transform",
        },
      );
    },
    [rows.map((r) => `${r.key}:${r.value}`).join("|")],
  );

  return (
    <div ref={ref} className="hbars" role="list" aria-label={label}>
      {rows.map((r) => (
        <div key={r.key} className="hbars__row" role="listitem" aria-label={`${r.label}: ${r.valueText ?? r.value}`}>
          <div className="hbars__top">
            <span className="hbars__label">{r.label}</span>
            <span className="hbars__val">
              <b>{r.valueText ?? r.value}</b>
            </span>
          </div>
          <div className="hbars__track">
            <span className={`hbars__whole hbars__whole--${r.tone ?? "iris"}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
