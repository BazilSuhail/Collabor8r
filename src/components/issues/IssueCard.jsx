import { cn } from "../../utils/cn.js";
import { relativeTime } from "../../utils/format.js";
import { priorityIcon, priorityTone, typeIcon } from "../../utils/issueVisuals.js";
import { userAvatarSrc } from "../../utils/media.js";
import Avatar from "../ui/Avatar.jsx";
import { Icon } from "../ui/Icon.jsx";

const TONE_TEXT = {
  ember: "text-[color:var(--ember-t)]",
  saffron: "text-[color:var(--saffron-t)]",
  plain: "text-muted",
};

// Board and backlog card. Shows type, key, priority, title, assignee, checklist progress and last activity.
export default function IssueCard({ issue, onOpen, className, ...rest }) {
  const checklist = Array.isArray(issue.checklist) ? issue.checklist : [];
  const doneCount = checklist.filter((item) => item.done).length;
  const hasRank = typeof issue.priorityRank === "number";
  const tone = hasRank ? priorityTone(issue.priorityRank) : "plain";

  return (
    <button
      type="button"
      data-key={issue.key}
      onClick={() => onOpen?.(issue)}
      className={cn(
        "card block w-full text-left p-[14px] grid gap-[10px] cursor-pointer",
        "hover:shadow-[var(--shadow-lift)] motion-reduce:transition-none transition-shadow duration-300",
        className,
      )}
      {...rest}
    >
      <span className="flex items-center gap-[8px] text-[12px] text-muted">
        <Icon name={typeIcon({ name: issue.typeName, hierarchy: issue.typeHierarchy, icon: issue.typeIcon })} cls="text-muted" />
        <span className="font-semibold tabular-nums">{issue.key}</span>
        {hasRank ? (
          <Icon
            name={priorityIcon(issue.priorityRank, issue.priorityIcon)}
            label={issue.priorityName ?? "Priority"}
            cls={cn("ml-auto", TONE_TEXT[tone])}
          />
        ) : null}
      </span>
      <span className="text-[14px] font-semibold text-text leading-snug">{issue.title}</span>
      <span className="flex items-center gap-[10px] text-[12px] text-muted">
        {issue.assignee?.name ? (
          <Avatar name={issue.assignee.name} src={userAvatarSrc({ avatarKey: issue.assignee.avatarKey, avatarUrl: issue.assignee.avatarUrl })} size="xs" />
        ) : (
          <span>Unassigned</span>
        )}
        {checklist.length ? (
          <span className="inline-flex items-center gap-[4px]">
            <Icon name="checklist" cls="text-muted" />
            {doneCount}/{checklist.length}
          </span>
        ) : null}
        {issue.lastActivityAt ? <span className="ml-auto">{relativeTime(issue.lastActivityAt)}</span> : null}
      </span>
    </button>
  );
}
