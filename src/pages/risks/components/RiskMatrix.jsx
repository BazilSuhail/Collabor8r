// feat(pages/risks/components/RiskMatrix): five by five probability and impact grid that counts risks per cell and filters the register.
import { Fragment, useMemo } from "react";

// Tones come from the status tokens only: low spruce, medium saffron, high ember.
export const riskTone = (score) => (score <= 6 ? "ok" : score <= 12 ? "warn" : "bad");

const CELL_TONE = {
  ok: "text-good bg-[color:var(--spruce-soft)]",
  warn: "text-[color:var(--saffron-t)] bg-[color:var(--saffron-soft)]",
  bad: "text-bad bg-[color:var(--ember-soft)]",
};

const SCALE = [1, 2, 3, 4, 5];

export default function RiskMatrix({ risks, selected, onSelect }) {
  const counts = useMemo(() => {
    const map = new Map();
    risks.forEach((r) => {
      const key = `${r.probability}-${r.impact}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [risks]);

  return (
    <div className="grid gap-[8px]" role="group" aria-label="Risk matrix: probability by impact">
      <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-[6px] items-center">
        {[...SCALE].reverse().map((impact) => (
          <Fragment key={impact}>
            <span className="text-muted text-[12px] font-semibold text-right pr-[6px]">Impact {impact}</span>
            {SCALE.map((probability) => {
              const n = counts.get(`${probability}-${impact}`) ?? 0;
              const on = selected?.p === probability && selected?.i === impact;
              return (
                <button
                  key={probability}
                  type="button"
                  disabled={n === 0}
                  aria-pressed={on}
                  aria-label={`Probability ${probability}, impact ${impact}: ${n} ${n === 1 ? "risk" : "risks"}`}
                  onClick={() => onSelect(on ? null : { p: probability, i: impact })}
                  className={`h-[52px] rounded-[12px] grid place-items-center font-semibold tnum text-[14px] transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default disabled:opacity-[0.45] hover:shadow-[0_0_0_2px_var(--line-2)] aria-[pressed=true]:shadow-[0_0_0_2px_var(--text)] ${CELL_TONE[riskTone(probability * impact)]}`}
                >
                  {n > 0 ? n : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-[6px]">
        <span aria-hidden="true" />
        {SCALE.map((probability) => (
          <span key={probability} className="text-muted text-[12px] font-semibold text-center">
            Probability {probability}
          </span>
        ))}
      </div>
    </div>
  );
}
