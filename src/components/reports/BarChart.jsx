import { useRef } from "react";
import { scaled, useEntry, gsap } from "../../utils/motion.js";

// Vertical bars. values align with labels; tone picks the series colour token.
export default function BarChart({ label, labels = [], values = [], tone = "ember", height = 220, format = String }) {
  const ref = useRef(null);
  const max = Math.max(1, ...values);
  const trackH = Math.max(40, height - 26);

  useEntry(
    ref,
    ({ q }) => {
      gsap.fromTo(
        q(".bars__bar"),
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "50% 100%",
          duration: scaled(0.9),
          ease: "power3.out",
          stagger: scaled(0.05),
          delay: scaled(0.2),
          clearProps: "transform",
        },
      );
    },
    [values.join(",")],
  );

  return (
    <div ref={ref} className="flex items-stretch gap-[8px] w-full" role="img" aria-label={label} style={{ height }}>
      {values.map((v, i) => (
        <div key={`${labels[i]}-${i}`} className="bars__col" aria-hidden="true">
          <div className="bars__track" style={{ height: trackH }}>
            <span className={`bars__bar bars__bar--${tone}`} style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
          </div>
          <span className="bars__lab text-muted text-[11px] font-semibold truncate text-center">{labels[i]}</span>
          <span className="sr">{`${labels[i]}: ${format(v)}`}</span>
        </div>
      ))}
    </div>
  );
}
