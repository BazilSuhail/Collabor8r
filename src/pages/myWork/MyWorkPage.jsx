// feat(pages/myWork/MyWorkPage): list the user's assigned and reported issues across projects, grouped by due date, with one-click completion.
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ProjectIssueSideModal } from "../../components/issues/IssueSideModal.jsx"; // CONTRACT-GAP: IssueSideModal props assumed as { open, onClose, projectId, issueId }
import LogWorkModal from "../../components/issues/LogWorkModal.jsx"; // CONTRACT-GAP: LogWorkModal props assumed as { open, onClose, projectId, issueId, issueKey }
import WorklogList from "../../components/issues/WorklogList.jsx";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Dropdown from "../../components/ui/Dropdown.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { transitionIssue } from "../../libs/api/issues.js";
import { myIssues, myWorklogs } from "../../libs/api/myWork.js";
import { paths } from "../../routes/paths.js";
import { cn } from "../../utils/cn.js";
import { formatDate } from "../../utils/format.js";
import { statusTone } from "../../utils/issueVisuals.js";
import { bindLift, cardRise, fadeUp, flip, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";

const VIEW = "my-work";
const idOf = (item) => item?.id ?? item?._id ?? null;

const GROUPS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "later", label: "Later" },
  { id: "none", label: "No due date" },
];

const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

function bucketOf(issue, todayStart, weekEnd) {
  const due = localDay(issue.dueDate);
  if (!due) return "none";
  if (due < todayStart) return "overdue";
  if (due.getTime() === todayStart.getTime()) return "today";
  if (due < weekEnd) return "week";
  return "later";
}

function IssueRow({ issue, onOpen, onLog, onComplete }) {
  const id = idOf(issue);
  const done = issue.statusCategory === "done";
  const due = issue.dueDate ? formatDate(issue.dueDate) : null;
  const items = [
    { id: "open", label: "Open", icon: "chevR", onSelect: () => onOpen(issue) },
    { id: "project", label: "Open in project", icon: "project", href: paths.issue(issue.projectId, issue.key) },
    { id: "log", label: "Log work", icon: "time", onSelect: () => onLog(issue) },
  ];

  return (
    <li className="flex items-center gap-[12px] p-[10px_12px] rounded-[14px] hover:bg-surface-2" data-key={id}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark ${issue.key} done`}
        disabled={done}
        onClick={() => onComplete(issue)}
        className="check shrink-0 disabled:cursor-default"
      >
        {done ? <Icon name="check" /> : null}
      </button>
      <button type="button" className="min-w-0 flex-1 grid gap-[2px] text-left" onClick={() => onOpen(issue)}>
        <span className={cn("font-bold whitespace-nowrap text-ellipsis overflow-hidden", done && "text-muted line-through")}>
          <span className="text-muted mr-[6px]">{issue.key}</span>
          {issue.summary ?? issue.title}
        </span>
        <small className="text-muted text-[12px] font-semibold">
          {[issue.projectName, due ? `due ${due}` : null].filter(Boolean).join(" · ")}
        </small>
      </button>
      <Badge variant="status" tone={statusTone(issue.statusCategory)}>
        {issue.statusName ?? "To do"}
      </Badge>
      <Dropdown
        label={`Actions for ${issue.key}`}
        items={items}
        trigger={(p) => (
          <Button iconOnly variant="ghost" size="sm" icon="more" aria-label={`Actions for ${issue.key}`} {...p} />
        )}
      />
    </li>
  );
}

// Assigned issues, grouped by due date. Completing a row moves it to Done with an undo.
function AssignedList({ onOpen, onLog }) {
  const toast = useToast();
  const listRef = useRef(null);
  const { items, status, hasMore, loadMore, loadingMore, reload, setItems } = usePaged((params) =>
    myIssues(params),
  );

  const today = new Date();
  const stamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const groups = useMemo(() => {
    const todayStart = new Date(stamp);
    const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const map = new Map(GROUPS.map((g) => [g.id, []]));
    for (const issue of items) map.get(bucketOf(issue, todayStart, weekEnd)).push(issue);
    return GROUPS.map((g) => ({ ...g, issues: map.get(g.id) })).filter((g) => g.issues.length);
  }, [items, stamp]);

  // F.8: a row that changes group glides to its new place.
  const patch = (id, fields) =>
    flip(listRef.current, () =>
      flushSync(() => setItems((prev) => prev.map((i) => (idOf(i) === id ? { ...i, ...fields } : i)))),
    );

  const undo = async (issue, before) => {
    try {
      await transitionIssue(issue.projectId, idOf(issue), { toStatus: before.statusId });
    } catch {
      toast.error(`Could not move ${issue.key}`);
      return;
    }
    patch(idOf(issue), before);
    toast.success(`${issue.key} moved back`);
  };

  const complete = async (issue) => {
    const before = {
      statusId: issue.statusId,
      statusName: issue.statusName,
      statusCategory: issue.statusCategory,
    };
    try {
      await transitionIssue(issue.projectId, idOf(issue), { toStatus: "done" });
    } catch {
      toast.error(`Could not move ${issue.key}`);
      return;
    }
    patch(idOf(issue), { statusId: "done", statusName: "Done", statusCategory: "done" });
    toast.success(`${issue.key} marked done`, { undo: () => undo(issue, before) });
  };

  if (status === "loading") return <Skeleton variant="feed" count={6} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load your issues" onRetry={reload} />;
  }
  if (!items.length) {
    return (
      <EmptyState
        icon="task"
        title="Nothing assigned to you"
        text="Issues assigned to you across projects show up here."
      />
    );
  }

  return (
    <div className="grid gap-[18px]">
      <div ref={listRef} className="grid gap-[16px]">
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`mw-${group.id}`} data-group={group.id}>
            <h2 id={`mw-${group.id}`} className="mb-[6px] text-muted text-[12.5px] font-bold uppercase tracking-[0.04em]">
              {group.label} <span className="tnum">{group.issues.length}</span>
            </h2>
            <ul className="grid gap-[2px] list-none m-0 p-0">
              {group.issues.map((issue) => (
                <IssueRow key={idOf(issue)} issue={issue} onOpen={onOpen} onLog={onLog} onComplete={complete} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="soft" size="sm" loading={loadingMore} onClick={loadMore}>
            Show more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// Logged time across projects for the signed-in user.
function TimeList() {
  const { items, status, hasMore, loadMore, loadingMore, reload } = usePaged((params) => myWorklogs(params));
  return (
    <WorklogList
      items={items}
      status={status}
      onRetry={reload}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      emptyTitle="No time logged yet"
      emptyText="Log work from an issue, or from the menu on any row."
    />
  );
}

export default function MyWorkPage() {
  const [tab, setTab] = useState("assigned");
  const [openIssue, setOpenIssue] = useState(null);
  const [logFor, setLogFor] = useState(null);

  useViewEntry(
    VIEW,
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 22, stagger: 0.07 });
      return bindLift(root);
    },
    [tab],
  );

  return (
    <>
      <PageHead title="My work" sub="Issues assigned to you across projects, grouped by due date." />

      <div className="toolbar mb-[16px]">
        <SegmentedControl
          label="My work views"
          value={tab}
          onChange={setTab}
          options={[
            { value: "assigned", label: "Assigned" },
            { value: "time", label: "Time" },
          ]}
        />
      </div>

      <section className="card p-[18px]" aria-label={tab === "time" ? "Logged time" : "Assigned issues"}>
        {tab === "assigned" ? (
          <AssignedList onOpen={(issue) => setOpenIssue({ id: idOf(issue), projectId: issue.projectId })} onLog={setLogFor} />
        ) : (
          <TimeList />
        )}
      </section>

      {openIssue ? (
        <ProjectIssueSideModal open onClose={() => setOpenIssue(null)} projectId={openIssue.projectId} issueId={openIssue.id} />
      ) : null}
      {logFor ? (
        <LogWorkModal
          open
          onClose={() => setLogFor(null)}
          projectId={logFor.projectId}
          issueId={idOf(logFor)}
          issueKey={logFor.key}
        />
      ) : null}
    </>
  );
}
