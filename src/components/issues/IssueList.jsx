import { useRef } from "react";
import { cn } from "../../utils/cn.js";
import { userAvatarSrc } from "../../utils/media.js";
import { fadeUp, useEntry } from "../../utils/motion.js";
import { priorityIcon, priorityTone, statusIcon, statusTone, typeIcon } from "../../utils/issueVisuals.js";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Highlight from "../ui/Highlight.jsx";
import { Icon } from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";

const TONE_TEXT = {
  ember: "text-[color:var(--ember-t)]",
  saffron: "text-[color:var(--saffron-t)]",
  plain: "text-muted",
};

// Plain issue rows for panels, dashboards and detail children. Loading, error and empty states live here.
// rowMenu(issue) returns Dropdown items. drag adds a handle for the Backlog panels.
export default function IssueList({
  issues = [],
  status = "success",
  error,
  onRetry,
  onOpen,
  query = "",
  compact = false,
  drag = false,
  rowMenu,
  empty,
  className,
}) {
  const listRef = useRef(null);

  // F.8: rows fade in after data arrives, never on the skeleton.
  useEntry(
    listRef,
    ({ q }) => {
      const rows = Array.from(q("[data-key]"));
      fadeUp(rows.slice(0, 14), { y: 10, stagger: 0.035, delay: 0.14 });
      fadeUp(rows.slice(14), { y: 10, stagger: 0, delay: 0.6 });
    },
    [status === "success"],
  );

  if (status === "loading") return <Skeleton variant="feed" count={6} />;
  if (status === "error") {
    return (
      <EmptyState tone="error" title="Could not load issues" text={error?.message} onRetry={onRetry} />
    );
  }
  if (!issues.length) {
    return (
      <EmptyState
        icon={empty?.icon ?? "inbox"}
        title={empty?.title ?? "No issues"}
        text={empty?.text}
        action={empty?.action}
      />
    );
  }

  return (
    <ul ref={listRef} role="list" className={cn("grid", className)}>
      {issues.map((issue) => (
        <IssueRow
          key={issue.id ?? issue._id ?? issue.key}
          issue={issue}
          onOpen={onOpen}
          query={query}
          compact={compact}
          drag={drag}
          rowMenu={rowMenu}
        />
      ))}
    </ul>
  );
}

function IssueRow({ issue, onOpen, query, compact, drag, rowMenu }) {
  const tone = typeof issue.priorityRank === "number" ? priorityTone(issue.priorityRank) : "plain";
  return (
    <li
      data-key={issue.key}
      className="flex items-center gap-[12px] py-[10px] px-[12px] border-b border-line last:border-b-0 hover:bg-surface-2"
    >
      {drag ? (
        <button
          type="button"
          data-drag-handle
          aria-label={`Drag ${issue.key}`}
          className="ibtn ibtn--ghost ibtn--sm cursor-grab shrink-0"
        >
          <Icon name="drag" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onOpen?.(issue)}
        className="flex flex-1 min-w-0 items-center gap-[10px] text-left cursor-pointer"
      >
        <Icon name={typeIcon({ name: issue.typeName, icon: issue.typeIcon })} cls="text-muted shrink-0" />
        <span className="text-[12px] font-semibold text-muted tabular-nums shrink-0">{issue.key}</span>
        <span className="min-w-0 truncate text-[14px] font-semibold text-text">
          <Highlight text={issue.title ?? ""} query={query} />
        </span>
      </button>
      {!compact && issue.statusName ? (
        <Badge variant="status" tone={statusTone(issue.statusCategory)} icon={statusIcon(issue.statusCategory)}>
          {issue.statusName}
        </Badge>
      ) : null}
      {typeof issue.priorityRank === "number" ? (
        <Icon
          name={priorityIcon(issue.priorityRank, issue.priorityIcon)}
          label={issue.priorityName ?? "Priority"}
          cls={cn("shrink-0", TONE_TEXT[tone])}
        />
      ) : null}
      {!compact && issue.assignee?.name ? (
        <Avatar name={issue.assignee.name} src={userAvatarSrc({ avatarKey: issue.assignee.avatarKey, avatarUrl: issue.assignee.avatarUrl })} size="xs" />
      ) : null}
      {rowMenu ? (
        <Dropdown
          label={`Actions for ${issue.key}`}
          items={rowMenu(issue)}
          trigger={(triggerProps) => (
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="more"
              aria-label={`Actions for ${issue.key}`}
              {...triggerProps}
            />
          )}
        />
      ) : null}
    </li>
  );
}
