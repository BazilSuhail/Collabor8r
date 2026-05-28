import { getHistory } from "../../libs/api/issues.js";
import { relativeTime } from "../../utils/format.js";
import { usePaged } from "../../utils/usePaged.js";
import EmptyState from "../ui/EmptyState.jsx";
import { Icon } from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";

// Shows a field value that may arrive as a string, number, null or an object with a name.
const show = (value) => {
  if (value === null || value === undefined || value === "") return "none";
  if (typeof value === "object") return value.name ?? value.displayName ?? value.key ?? "none";
  return String(value);
};

// Issue change history, newest first. Entries: { id, field, from, to, actor, createdAt }.
export function IssueHistory({ projectId, issueId }) {
  const h = usePaged((p) => getHistory(projectId, issueId, p), { projectId, issueId });
  return <HistoryList items={h.items} status={h.status} onRetry={h.reload} />;
}

export default function HistoryList({ items = [], status = "success", onRetry }) {
  if (status === "loading") return <Skeleton variant="feed" count={4} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load history" onRetry={onRetry} />;
  }
  if (!items.length) return <EmptyState icon="history" title="No changes yet" />;

  return (
    <ul className="feed grid gap-[2px] list-none m-0 p-0" aria-label="Issue history">
      {items.map((h) => {
        const who = h.actor?.displayName ?? h.actorName ?? "Someone";
        const field = h.field ?? h.type ?? "a field";
        const from = h.from ?? h.fromValue;
        const to = h.to ?? h.toValue;
        const change =
          from !== undefined || to !== undefined
            ? `${show(from)} to ${show(to)}`
            : null;
        return (
          <li key={h.id ?? h._id} className="feed__item flex items-start gap-[12px]" data-key={h.id ?? h._id}>
            <span className="kpi__ico shrink-0">
              <Icon name="history" />
            </span>
            <div className="min-w-0 flex-1 grid gap-[2px]">
              <p className="text-[13.5px]">
                <b className="font-bold">{who}</b> changed <b className="font-bold">{field}</b>
                {change ? <span className="text-muted"> from {change}</span> : null}
              </p>
              <small className="text-muted text-[12px] font-semibold">{relativeTime(h.createdAt ?? h.at)}</small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
