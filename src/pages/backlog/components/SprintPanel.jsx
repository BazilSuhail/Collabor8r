// feat(pages/backlog/components/SprintPanel): one panel of the backlog page, a sprint or the backlog, with its ranked issue rows.
import { Link } from "react-router-dom";
import Avatar from "../../../components/ui/Avatar.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Dropdown from "../../../components/ui/Dropdown.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import { paths } from "../../../routes/paths.js";
import { cn } from "../../../utils/cn.js";
import { priorityIcon, priorityTone, statusTone, typeIcon } from "../../../utils/issueVisuals.js";

const assigneeOf = (issue) => issue.assigneeUser ?? issue.assignee ?? null;

// A ranked row. The handle starts a drag and takes Alt+ArrowUp/ArrowDown for keyboard reordering.
function IssueRow({ issue, panelId, rowProps }) {
  const { pid, canRank, onHandleDown, onKeyMove, menuFor } = rowProps;
  const assignee = assigneeOf(issue);
  const menu = menuFor(issue, panelId);
  return (
    <li
      data-key={issue.id}
      className="flex items-center gap-[10px] min-w-0 py-[9px] px-[12px] border-b border-line last:border-b-0 hover:bg-surface-2"
    >
      {canRank ? (
        <button
          type="button"
          className="touch-none cursor-grab inline-grid place-items-center w-[28px] h-[28px] rounded-ctl text-faint hover:text-text hover:bg-well focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ember pointer-coarse:w-[44px] pointer-coarse:h-[44px]"
          aria-label={`Move ${issue.key}. Use Alt and the arrow keys to reorder.`}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          onPointerDown={(e) => onHandleDown(e, issue, panelId)}
          onKeyDown={(e) => onKeyMove(e, issue, panelId)}
        >
          <Icon name="drag" />
        </button>
      ) : null}
      <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} cls="text-muted" />
      <span className="tnum text-muted text-[12px] font-bold whitespace-nowrap">{issue.key}</span>
      <Link to={paths.issue(pid, issue.key)} className="flex-1 min-w-0 truncate text-[13.5px] font-semibold text-text hover:underline">
        {issue.title}
      </Link>
      <Badge variant="status" tone={statusTone(issue.statusCategory)}>
        {issue.statusName}
      </Badge>
      <Badge variant="badge" tone={priorityTone(issue.priorityRank)} icon={priorityIcon(issue.priorityRank, issue.priorityIcon)}>
        {issue.priorityName ?? "None"}
      </Badge>
      {assignee ? <Avatar name={assignee.displayName ?? "User"} src={assignee.avatar} size="xs" /> : null}
      {menu.length ? (
        <Dropdown
          label={`Actions for ${issue.key}`}
          items={menu}
          trigger={(p) => (
            <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`Actions for ${issue.key}`} {...p} />
          )}
        />
      ) : null}
    </li>
  );
}

function RowSkeleton() {
  return (
    <div aria-busy="true" className="grid">
      <span className="sr">Loading</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-[10px] py-[12px] px-[12px] border-b border-line last:border-b-0">
          <span className="block w-[28px] h-[12px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
          <span className="block flex-1 h-[12px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
          <span className="block w-[90px] h-[12px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

export default function SprintPanel({
  panelId,
  title,
  meta,
  actions,
  issues,
  status,
  onRetry,
  emptyTitle,
  emptyText,
  dropActive,
  rowProps,
}) {
  return (
    <section
      className={cn("card p-0 overflow-hidden", dropActive && "shadow-[inset_0_0_0_2px_var(--ember)]")}
      data-panel-id={panelId}
      aria-labelledby={`bl-${panelId}`}
    >
      <header className="flex flex-wrap items-center gap-[10px] px-[18px] py-[14px] border-b border-line">
        <h2 id={`bl-${panelId}`} className="text-[15px] font-bold m-0">
          {title}
        </h2>
        <span className="text-muted text-[12.5px] tnum">{meta}</span>
        {actions ? <span className="ml-auto flex items-center gap-[8px]">{actions}</span> : null}
      </header>

      {status === "loading" ? <RowSkeleton /> : null}
      {status === "error" ? <EmptyState tone="error" title="Could not load these issues" onRetry={onRetry} /> : null}
      {status === "success" && issues.length === 0 ? (
        <EmptyState icon="backlog" title={emptyTitle} text={emptyText} />
      ) : null}
      {status === "success" && issues.length > 0 ? (
        <ul role="list" aria-label={`${title} issues`} className="grid">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} panelId={panelId} rowProps={rowProps} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
