import { formatDate, formatDuration } from "../../utils/format.js";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { Icon } from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";

// Logged time rows. showIssue adds the issue key and summary (My work, Timesheet).
// hasMore and onLoadMore come from usePaged. Loading, error and empty states live here.
export default function WorklogList({
  items = [],
  status = "success",
  onRetry,
  showIssue = true,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  emptyTitle = "No time logged yet",
  emptyText,
}) {
  if (status === "loading") return <Skeleton variant="feed" count={4} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load logged time" onRetry={onRetry} />;
  }
  if (!items.length) return <EmptyState icon="time" title={emptyTitle} text={emptyText} />;

  return (
    <div className="grid gap-[10px]">
      <ul className="feed grid gap-[2px] list-none m-0 p-0" aria-label="Logged time">
        {items.map((w) => {
          const id = w.id ?? w._id;
          const key = w.issueKey ?? w.issue?.key;
          const summary = w.issueSummary ?? w.issue?.summary;
          const who = w.user?.displayName ?? w.userName ?? "";
          const when = w.date ? formatDate(w.date) : "";
          return (
            <li key={id} className="feed__item flex items-center gap-[12px]" data-key={id}>
              <span className="kpi__ico shrink-0">
                <Icon name="time" />
              </span>
              <div className="min-w-0 flex-1 grid gap-[2px]">
                <p className="font-bold whitespace-nowrap text-ellipsis overflow-hidden">
                  {showIssue && key ? <span className="text-muted mr-[6px]">{key}</span> : null}
                  {summary || w.comment || "Work logged"}
                </p>
                <small className="text-muted text-[12px] font-semibold">
                  {[when, who, w.billable ? "Billable" : null].filter(Boolean).join(" · ")}
                </small>
              </div>
              <b className="tnum whitespace-nowrap font-bold">{formatDuration(w.seconds ?? 0)}</b>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="soft" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Show more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
