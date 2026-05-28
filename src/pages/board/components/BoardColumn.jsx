// feat(pages/board/components/BoardColumn): one board column with its status header, WIP limit and issue cards.
import Avatar from "../../../components/ui/Avatar.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import { cn } from "../../../utils/cn.js";
import { relativeTime } from "../../../utils/format.js";
import { priorityIcon, priorityTone, statusTone, typeIcon } from "../../../utils/issueVisuals.js";

const TONE_CLASS = { iris: "pp-col--iris", spruce: "pp-col--spruce" };
const TONE_VAR = { plain: "var(--faint)", iris: "var(--iris)", spruce: "var(--spruce)" };

// One issue card. Drag, keyboard move and open are wired by the page (data-key is the issue id).
export function BoardCard({ issue }) {
  const assignee = issue.assigneeUser ?? issue.assignee ?? null;
  const checklist = issue.checklist ?? [];
  const checkDone = checklist.filter((c) => c.done).length;
  const attachments = issue.counts?.attachments ?? 0;
  return (
    <article
      className="pp-card cursor-grab select-none rounded-[15px] outline-none relative flex-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ember focus-visible:outline-offset-2 [&_img]:pointer-events-none [&.is-placeholder>.pp-face]:invisible [&>.pp-face]:[transition:opacity_0.2s_var(--ease)] [&.is-pressing>.pp-face]:opacity-[0.8]"
      tabIndex={0}
      role="listitem"
      data-key={issue.id}
      aria-label={`${issue.key} ${issue.title}, ${issue.statusName}`}
      aria-keyshortcuts="Enter [ ] ArrowLeft ArrowRight"
    >
      <div className="pp-face grid gap-[8px] border rounded-[15px] p-[12px] pb-[11px] [background:var(--pp-card)] [box-shadow:var(--pp-card-shadow)]">
        <div className="flex items-center gap-[7px] min-w-0">
          <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} cls="text-muted" />
          <span className="tnum text-muted text-[11.5px] font-bold whitespace-nowrap">{issue.key}</span>
          <span className="ml-auto">
            <Badge variant="badge" tone={priorityTone(issue.priorityRank)} icon={priorityIcon(issue.priorityRank, issue.priorityIcon)} label={issue.priorityName ?? "No priority"} />
          </span>
        </div>
        <p className="m-0 text-[13.5px] font-semibold leading-[1.3] line-clamp-2">{issue.title}</p>
        <div className="flex flex-wrap items-center justify-between gap-[6px]">
          <span className="flex items-center gap-[10px] text-muted text-[11.5px] font-semibold">
            {checklist.length ? (
              <span className="inline-flex items-center gap-[4px]">
                <Icon name="checklist" cls="text-faint" />
                <span className="tnum">{`${checkDone}/${checklist.length}`}</span>
              </span>
            ) : null}
            {attachments ? (
              <span className="inline-flex items-center gap-[4px]">
                <Icon name="attach" cls="text-faint" />
                <span className="tnum">{attachments}</span>
              </span>
            ) : null}
            <span className="whitespace-nowrap">{relativeTime(issue.lastActivityAt ?? issue.updatedAt)}</span>
          </span>
          {assignee ? (
            <Avatar name={assignee.displayName ?? "User"} src={assignee.avatar} size="xs" />
          ) : (
            <span className="text-faint text-[11.5px]">Unassigned</span>
          )}
        </div>
      </div>
    </article>
  );
}

// count is the column's full size. items are the cards left after the page's search and quick filters.
export default function BoardColumn({ id, name, category, wipLimit, count, items }) {
  const tone = statusTone(category);
  const overLimit = Boolean(wipLimit) && count > wipLimit;
  return (
    <section
      className={cn(
        "pp-col rounded-card border [background:var(--pp-lane)] [border-color:var(--pp-lane-rim)] flex flex-col min-w-0 min-h-0 pt-[12px] px-[8px] pb-0 relative",
        TONE_CLASS[tone],
      )}
      data-col={id}
      style={{ "--t": TONE_VAR[tone] }}
      aria-labelledby={`pp-h-${id}`}
    >
      <header className="pp-col__head flex flex-wrap items-center gap-[1px_7px] pb-[9px] px-[6px] relative">
        <span className="pp-col__dot flex-none rounded-[50%] w-[10px] h-[10px] [background:var(--t)] [box-shadow:0_0_0_3px_color-mix(in_srgb,var(--t)_22%,transparent)]" aria-hidden="true" />
        <h2 className="pp-col__name [font:700_14px_var(--font)] tracking-[-.01em] whitespace-nowrap text-ellipsis min-w-0 overflow-hidden" id={`pp-h-${id}`}>
          {name}
        </h2>
        <span className="pp-col__count tnum bg-surface border border-line rounded-full place-items-center min-w-[22px] h-[20px] ml-auto px-[6px] text-[11px] font-bold inline-grid">
          {count}
        </span>
        {wipLimit ? (
          <span className="basis-full pl-[17px] text-[12px] text-muted">
            {overLimit ? <Badge variant="badge" tone="ember" label="Over the WIP limit">{`Over WIP limit ${wipLimit}`}</Badge> : `WIP limit ${wipLimit}`}
          </span>
        ) : null}
      </header>
      <div
        className="pp-col__body flex flex-col flex-1 gap-[10px] min-h-0 mx-[-4px] p-[4px] pb-[16px] relative overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:var(--line-2)_transparent]"
        role="list"
        aria-label={`${name} issues`}
      >
        {items.map((issue) => (
          <BoardCard key={issue.id} issue={issue} />
        ))}
        {items.length === 0 ? (
          <p className="grid place-items-center h-[96px] rounded-[15px] border-[1.5px] border-dashed border-line-2 text-[12.5px] font-semibold text-muted m-0">
            {count === 0 ? "Drop an issue here" : "No issues match the filters"}
          </p>
        ) : null}
      </div>
    </section>
  );
}
