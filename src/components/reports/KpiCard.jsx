import { useEffect, useRef } from "react";
import { countUp } from "../../utils/motion.js";
import { Icon } from "../ui/Icon.jsx";

// KPI tile. Numeric values count up from zero; text values render as given.
export default function KpiCard({ tone = "ember", icon, label, value, format = String, foot }) {
  const ref = useRef(null);
  const numeric = typeof value === "number";

  useEffect(() => {
    if (numeric) countUp(ref.current, value, format, { from: 0 });
  }, [value]);

  return (
    <section className={`card kpi kpi--${tone}`} data-lift="">
      <div className="kpi__body">
        <span className="kpi__top">
          <span className="kpi__ico">
            <Icon name={icon} />
          </span>
        </span>
        <p className="kpi__label">{label}</p>
        <p className="kpi__value">{numeric ? <b className="num" ref={ref} /> : <b className="num">{value}</b>}</p>
      </div>
      {foot && (
        <footer className="kpi__foot">
          <span className="text-[12.5px] font-semibold">{foot}</span>
        </footer>
      )}
    </section>
  );
}
