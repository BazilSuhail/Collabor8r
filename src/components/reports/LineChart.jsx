import { useId, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReduced, scaled } from "../../utils/motion.js";

export const PAD = { l: 44, r: 12, t: 12, b: 26 };

// Rounds a maximum up to a readable axis top.
export function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) ?? 10) * p;
}

// Smooth path through points, with control points clamped to each segment.
function curve(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const prev = pts[i - 1] ?? pts[i];
    const a = pts[i];
    const b = pts[i + 1];
    const next = pts[i + 2] ?? b;
    const k = 0.18;
    const c1 = [a[0] + (b[0] - prev[0]) * k, a[1] + (b[1] - prev[1]) * k];
    const c2 = [b[0] - (next[0] - a[0]) * k, b[1] - (next[1] - a[1]) * k];
    const lo = Math.min(a[1], b[1]);
    const hi = Math.max(a[1], b[1]);
    c1[1] = Math.max(lo, Math.min(hi, c1[1]));
    c2[1] = Math.max(lo, Math.min(hi, c2[1]));
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b[0]},${b[1]}`;
  }
  return d;
}

// Multi-series line chart. series: [{ name, tone, values, dashed? }], values align with labels.
export default function LineChart({ label, labels = [], series = [], height = 220, format = String }) {
  const box = useRef(null);
  const clip = useRef(null);
  const tip = useRef(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(-1);
  const slug = useId().replace(/\W/g, "");
  const n = labels.length;
  const values = series.map((s) => s.values);
  const max = niceMax(Math.max(1, ...values.flat()) * 1.08);
  const iw = Math.max(1, w - PAD.l - PAD.r);
  const x = (i) => PAD.l + (n < 2 ? 0 : (i / (n - 1)) * iw);
  const y = (v) => PAD.t + (1 - v / max) * (height - PAD.t - PAD.b);
  const stride = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
  const shown = (i) => i % stride === 0 || i === n - 1;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw-in: the clip grows left to right. Reduced motion paints the full width at once.
  useLayoutEffect(() => {
    const rect = clip.current;
    if (!rect || !w) return undefined;
    if (prefersReduced()) {
      rect.setAttribute("width", String(w));
      return undefined;
    }
    const p = { v: 0 };
    rect.setAttribute("width", String(PAD.l));
    const tween = gsap.to(p, {
      v: 1,
      duration: scaled(1.2),
      delay: scaled(0.3),
      ease: "power2.inOut",
      onUpdate: () => rect.setAttribute("width", String(PAD.l + (w - PAD.l) * p.v + 2)),
      onComplete: () => rect.setAttribute("width", String(w)),
    });
    return () => {
      tween.kill();
      rect.setAttribute("width", String(w));
    };
  }, [w, n]);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const from = hover < 0 ? n - 1 : hover;
    setHover(Math.max(0, Math.min(n - 1, from + (e.key === "ArrowRight" ? 1 : -1))));
  };

  const line = (vals) => curve(vals.map((v, i) => [x(i), y(v ?? 0)]));
  const first = series[0]?.tone ?? "ember";
  const tipTop = hover >= 0 ? Math.max(0, y(Math.max(...values.map((v) => v[hover] ?? 0))) - 64) : 0;
  const tipLeft = hover >= 0 ? Math.min(Math.max(0, w - 170), Math.max(4, x(hover) - 60)) : 0;

  return (
    <div
      ref={box}
      className="chart relative w-full"
      style={{ height, "--area": `var(--${first})` }}
      tabIndex={0}
      role="group"
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(-1)}
      onBlur={() => setHover(-1)}
      onKeyDown={onKeyDown}
    >
      <svg className="chart__svg" role="img" aria-label={label} viewBox={`0 0 ${w} ${height}`} width={w} height={height}>
        <defs>
          <linearGradient id={`g-${slug}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" className="chart__stop0" />
            <stop offset="1" className="chart__stop1" />
          </linearGradient>
          <clipPath id={`c-${slug}`}>
            <rect ref={clip} className="chart__clip" x="0" y="0" height="100%" />
          </clipPath>
        </defs>
        <g className="chart__grid">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={PAD.l} x2={w - PAD.r} y1={y(max * f)} y2={y(max * f)} />
              <text x={PAD.l - 8} y={y(max * f) + 4} textAnchor="end">
                {format(max * f)}
              </text>
            </g>
          ))}
        </g>
        <g clipPath={`url(#c-${slug})`}>
          {values[0] && (
            <path
              className={`chart__area chart__area--${first}`}
              fill={`url(#g-${slug})`}
              d={`${line(values[0])} L${x(n - 1)},${height - PAD.b} L${x(0)},${height - PAD.b} Z`}
            />
          )}
          {series.map((s, i) => (
            <path
              key={s.name}
              className={`chart__line chart__line--${s.tone}${s.dashed ? " is-dashed" : ""}`}
              d={line(values[i])}
            />
          ))}
        </g>
        <g className="chart__x">
          {labels.map((l, i) =>
            shown(i) ? (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle">
                {l}
              </text>
            ) : null,
          )}
        </g>
        {hover >= 0 && (
          <>
            <line className="chart__cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={height - PAD.b} />
            {values.map((v, i) => (
              <circle
                key={series[i].name}
                className={`chart__dot chart__dot--${series[i].tone}`}
                cx={x(hover)}
                cy={y(v[hover] ?? 0)}
                r="4.5"
              />
            ))}
          </>
        )}
      </svg>
      <div
        ref={tip}
        className="chart__tip"
        role="status"
        aria-live="polite"
        style={{ opacity: hover >= 0 ? 1 : 0, transform: `translate(${tipLeft}px, ${tipTop}px)` }}
      >
        {hover >= 0 && (
          <>
            <b>{labels[hover]}</b>
            {series.map((s, i) => (
              <span key={s.name}>
                <i className={`tone--${s.tone}`} />
                {s.name} <strong>{format(values[i][hover] ?? 0)}</strong>
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
