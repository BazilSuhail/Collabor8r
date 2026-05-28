import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn.js";
import { countUp } from "../../utils/motion.js";
import EmptyState from "../ui/EmptyState.jsx";
import { Icon } from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";

const GRID =
  "grid grid-cols-[repeat(4,minmax(0,1fr))] gap-[var(--gap)] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)]";

// Numeric values are written by countUp (F.12). The node has no React children,
// so React never touches the text that countUp writes.
function CountValue({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) countUp(ref.current, value);
  }, [value]);
  return <p className="kpi__value tnum" ref={ref} />;
}

function KpiTile({ item }) {
  const tone = item.tone && item.tone !== "plain" ? ` kpi--${item.tone}` : "";
  return (
    <div
      className={cn("card kpi grid gap-[10px] hover:shadow-[var(--shadow-lift)]", tone)}
      data-lift=""
      data-kpi={item.id}
    >
      <div className="kpi__body">
        <span className="kpi__top">
          <span className="kpi__ico">
            <Icon name={item.icon} />
          </span>
        </span>
        <p className="kpi__label">{item.label}</p>
        {typeof item.value === "number" ? (
          <CountValue value={item.value} />
        ) : (
          <p className="kpi__value tnum">{item.value}</p>
        )}
      </div>
      {item.sub ? (
        <footer className="kpi__foot">
          <span className="text-muted text-[12.5px] font-semibold">{item.sub}</span>
        </footer>
      ) : null}
    </div>
  );
}

// Counter tiles for a page head or card row. items: [{ id, label, value, icon, tone?, sub? }].
// value is a number (animated with countUp) or a string (shown as is).
export default function IssueKpis({ items = [], status = "success", onRetry }) {
  if (status === "loading") return <Skeleton variant="kpi" count={items.length || 4} />;
  if (status === "error") {
    return (
      <div className="card">
        <EmptyState tone="error" title="Could not load these numbers" onRetry={onRetry} />
      </div>
    );
  }
  return (
    <div className={GRID}>
      {items.map((item) => (
        <KpiTile key={item.id} item={item} />
      ))}
    </div>
  );
}
