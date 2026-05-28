import { cn } from "../../utils/cn.js";
import EmptyState from "../ui/EmptyState.jsx";

// Card shell for one chart or widget. Renders its own loading, error and empty states.
// status: loading | error | success. empty: true when the success data has nothing to draw.
export default function ReportCard({
  id,
  title,
  sub,
  tools,
  status = "success",
  error,
  empty = false,
  emptyTitle = "Not enough data yet",
  emptyText,
  onRetry,
  height = 220,
  area,
  className,
  children,
}) {
  const headId = `${id}-t`;
  let body = children;
  if (status === "loading") {
    body = (
      <div
        className="bg-well rounded-[12px] animate-pulse motion-reduce:animate-none w-full"
        style={{ height }}
        aria-busy="true"
      >
        <span className="sr">Loading</span>
      </div>
    );
  } else if (status === "error") {
    body = (
      <EmptyState
        tone="error"
        title="Could not load this report"
        text={error?.message ?? "Try again in a moment."}
        onRetry={onRetry}
      />
    );
  } else if (empty) {
    body = <EmptyState title={emptyTitle} text={emptyText} />;
  }

  return (
    <section
      id={id}
      aria-labelledby={headId}
      className={cn("card flex flex-col min-w-0 p-[18px] gap-[14px]", className)}
      style={area ? { gridArea: area } : undefined}
    >
      <header className="flex items-start gap-[12px] min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="card__title" id={headId}>
            {title}
          </h2>
          {sub && <p className="card__sub">{sub}</p>}
        </div>
        {tools && <div className="card__tools shrink-0">{tools}</div>}
      </header>
      {body}
    </section>
  );
}
