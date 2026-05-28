// feat(pages/boardHub/BoardHubPage): cross-project board showing only issues, with projects you can drag to open or reorder.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { getBoardIssues, listBoardProjects, saveBoardOrder } from "../../libs/api/boardhub.js";
import { transitionIssue } from "../../libs/api/issues.js";
import { paths } from "../../routes/paths.js";
import { cn } from "../../utils/cn.js";
import { userAvatarSrc } from "../../utils/media.js";
import { priorityIcon, priorityTone, statusTone } from "../../utils/issueVisuals.js";
import { useMutation } from "../../utils/useMutation.js";
import { useResource } from "../../utils/useResource.js";

const PROJECT_TYPE = "application/x-board-project";
const ISSUE_TYPE = "application/x-board-issue";

const SORT_OPTIONS = [
  { value: "rank", label: "Rank" },
  { value: "priority", label: "Priority" },
  { value: "due", label: "Due date" },
  { value: "updated", label: "Recently updated" },
];

// Ascending, with missing values last.
const cmpAsc = (a, b) => {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
};

const stamp = (value) => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
};

const SORTERS = {
  rank: (a, b) => cmpAsc(a.rank ?? null, b.rank ?? null),
  priority: (a, b) => cmpAsc(a.priority?.rank ?? null, b.priority?.rank ?? null),
  due: (a, b) => cmpAsc(stamp(a.dueDate), stamp(b.dueDate)),
  updated: (a, b) => cmpAsc(stamp(b.updatedAt), stamp(a.updatedAt)),
};

const sortIssues = (items, key) => [...items].sort(SORTERS[key] ?? SORTERS.rank);

const normalizeBoard = (data) =>
  data
  ? {
  project: data.project,
  statuses: (data.statuses ?? []).map((s) => ({ ...s, id: String(s.id) })),
  issues: (data.issues ?? []).map((i) => ({ ...i, id: String(i.id), statusId: String(i.statusId) })),
  }
  : null;

const formatDue = (value) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? "" : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function IssueCard({ issue, onOpen, onStep }) {
  const { priority, assignee } = issue;
  const overdue = Boolean(issue.dueDate) && issue.statusCategory !== "done" && Date.parse(issue.dueDate) < Date.now();

  const onKeyDown = (e) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter") {
  e.preventDefault();
  onOpen();
  return;
  }
  const delta = e.key === "ArrowLeft" || e.key === "[" ? -1 : e.key === "ArrowRight" || e.key === "]" ? 1 : 0;
  if (delta) {
  e.preventDefault();
  onStep(delta);
  }
  };

  return (
  <article
  draggable
  tabIndex={0}
  data-issue-id={issue.id}
  onDragStart={(e) => {
  e.dataTransfer.setData(ISSUE_TYPE, issue.id);
  e.dataTransfer.effectAllowed = "move";
  }}
  onClick={onOpen}
  onKeyDown={onKeyDown}
  className="grid cursor-grab gap-[8px] rounded-[15px] border border-line bg-surface p-[12px] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lift)]"
  >
  <div className="flex items-center justify-between gap-[8px]">
  <span className="text-[12px] font-semibold tabular-nums text-muted">{issue.key}</span>
  {priority ? (
  <Badge tone={priorityTone(priority.rank)} icon={priorityIcon(priority.rank)}>
  {priority.name}
  </Badge>
  ) : null}
  </div>
  <p className="break-words text-[14px] font-semibold leading-[1.35] text-text">{issue.title}</p>
  <div className="flex items-center justify-between gap-[8px] text-[12px] text-muted">
  <span className={cn("tabular-nums", overdue && "text-bad")}>{issue.dueDate ? formatDue(issue.dueDate) : ""}</span>
  {assignee ? (
  <Avatar name={assignee.name} src={userAvatarSrc({ avatarKey: assignee.avatarKey, avatarUrl: assignee.avatarUrl })} id={assignee.id} size="xs" />
  ) : (
  <span className="text-faint">Unassigned</span>
  )}
  </div>
  </article>
  );
}

export default function BoardHubPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState("rank");
  const [overProject, setOverProject] = useState(null);
  const [overDrop, setOverDrop] = useState(false);
  const [overStatus, setOverStatus] = useState(null);

  const projects = useResource(async () => {
  const res = await listBoardProjects();
  return { data: res.data ?? [] };
  }, []);
  const list = projects.data ?? [];

  const board = useResource(async () => {
  if (!selectedId) return { data: null };
  const res = await getBoardIssues(selectedId);
  return { data: normalizeBoard(res.data) };
  }, [selectedId]);
  const data = board.data;
  const statuses = data?.statuses ?? [];
  const issues = data?.issues ?? [];
  const columns = statuses.map((status) => ({
  status,
  items: sortIssues(
  issues.filter((i) => i.statusId === status.id),
  sortKey,
  ),
  }));

  const reorder = useMutation(
  async (ids) => {
  await saveBoardOrder(ids);
  return true;
  },
  { error: "Could not save the project order" },
  );

  // Same mechanism as BoardPage: transitionIssue with the target status, reverted on failure.
  const transition = useMutation(
  async (projectId, issueId, toStatus) => {
  await transitionIssue(projectId, issueId, { toStatus });
  return true;
  },
  { success: "Issue moved", error: "Could not move the issue" },
  );

  const openBoard = (id) => setSelectedId(id);

  const commitOrder = async (ids) => {
  const snapshot = projects.data;
  if (!snapshot) return;
  projects.setData(ids.map((id) => snapshot.find((p) => p.id === id)).filter(Boolean));
  const ok = await reorder.run(ids);
  if (!ok) projects.setData(snapshot);
  };

  const dropProjectOn = (dragId, targetId) => {
  const ids = list.map((p) => p.id);
  const from = ids.indexOf(dragId);
  const to = ids.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, dragId);
  commitOrder(next);
  };

  const moveProject = (id, delta) => {
  const ids = list.map((p) => p.id);
  const from = ids.indexOf(id);
  const target = ids[from + delta];
  if (target === undefined) return;
  dropProjectOn(id, target);
  };

  const moveIssue = async (issueId, toStatusId) => {
  const snapshot = board.data;
  const issue = snapshot?.issues.find((i) => i.id === issueId);
  const status = snapshot?.statuses.find((s) => s.id === toStatusId);
  if (!issue || !status || issue.statusId === status.id) return;
  board.setData((d) => ({
  ...d,
  issues: d.issues.map((i) => (i.id === issueId ? { ...i, statusId: status.id, statusCategory: status.category } : i)),
  }));
  const ok = await transition.run(selectedId, issueId, status.id);
  if (!ok) board.setData(snapshot);
  };

  const stepIssue = (issueId, fromIndex, delta) => {
  const target = columns[fromIndex + delta];
  if (target) moveIssue(issueId, target.status.id);
  };

  const selectedName = list.find((p) => p.id === selectedId)?.name ?? "Board";

  let body;
  if (board.status === "error") {
  body = (
  <div className="card p-[16px]">
  <EmptyState tone="error" title="Could not load this board" onRetry={board.reload} />
  </div>
  );
  } else if (board.status === "loading" || !data) {
  body = <Skeleton variant="cards" count={3} />;
  } else if (!issues.length || !statuses.length) {
  body = (
  <div className="card p-[16px]">
  <EmptyState icon="kanban" title="No issues in this project" text="Issues created here will show up on this board." />
  </div>
  );
  } else {
  body = (
  <div className="grid grid-flow-col gap-[12px] overflow-x-auto pb-[4px] [grid-auto-columns:minmax(240px,1fr)]">
  {columns.map(({ status, items }, index) => (
  <section
  key={status.id}
  aria-label={`${status.name}, ${items.length} issues`}
  onDragOver={(e) => {
  if (!e.dataTransfer.types.includes(ISSUE_TYPE)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  setOverStatus(status.id);
  }}
  onDragLeave={(e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) setOverStatus(null);
  }}
  onDrop={(e) => {
  const issueId = e.dataTransfer.getData(ISSUE_TYPE);
  e.preventDefault();
  setOverStatus(null);
  if (issueId) moveIssue(issueId, status.id);
  }}
  className={cn(
 "grid min-h-[240px] min-w-0 content-start gap-[10px] rounded-card border bg-surface-2 p-[10px]",
  overStatus === status.id ? "border-ember" : "border-line",
  )}
  >
  <header className="flex items-center justify-between gap-[8px] px-[4px]">
  <span className="flex min-w-0 items-center gap-[8px]">
  <Badge variant="dot" tone={statusTone(status.category)} />
  <h3 className="truncate text-[13px] font-semibold text-text">{status.name}</h3>
  </span>
  <Badge variant="count" tone="plain" label={`${items.length} issues`}>
  {items.length}
  </Badge>
  </header>
  {items.map((issue) => (
  <IssueCard
  key={issue.id}
  issue={issue}
  onOpen={() => navigate(paths.issue(selectedId, issue.key))}
  onStep={(delta) => stepIssue(issue.id, index, delta)}
  />
  ))}
  </section>
  ))}
  </div>
  );
  }

  return (
  <>
  <PageHead
  title="Board"
  sub="Issues from every project you can see, in one place. Drag a project to reorder it, or drop it on the board area to open it."
  />

  <div className="grid items-start gap-[var(--gap)] grid-cols-[300px_minmax(0,1fr)] w760:grid-cols-[minmax(0,1fr)]">
  <aside className="grid min-w-0 gap-[10px] w760:hidden" aria-labelledby="board-hub-projects">
  <h2 id="board-hub-projects" className="flex items-center gap-[8px] text-[15px] font-semibold text-text">
  <Icon name="folder" cls="shrink-0" />
  Projects
  </h2>
  {projects.status === "loading" ? <Skeleton variant="cards" count={4} /> : null}
  {projects.status === "error" ? (
  <div className="card p-[16px]">
  <EmptyState tone="error" title="Could not load the projects" onRetry={projects.reload} />
  </div>
  ) : null}
  {projects.status === "success" && list.length === 0 ? (
  <div className="card p-[16px]">
  <EmptyState icon="project" title="No projects yet" text="Projects you join will appear here." />
  </div>
  ) : null}
  {projects.status === "success" && list.length > 0 ? (
  <ul className="grid gap-[8px]" aria-label="Projects">
  {list.map((p, i) => {
  const counts = p.counts ?? {};
  return (
  <li
  key={p.id}
  data-project-id={p.id}
  draggable
  onDragStart={(e) => {
  e.dataTransfer.setData(PROJECT_TYPE, p.id);
  e.dataTransfer.effectAllowed = "move";
  }}
  onDragOver={(e) => {
  if (!e.dataTransfer.types.includes(PROJECT_TYPE)) return;
  e.preventDefault();
  setOverProject(p.id);
  }}
  onDrop={(e) => {
  const dragId = e.dataTransfer.getData(PROJECT_TYPE);
  e.preventDefault();
  setOverProject(null);
  if (dragId) dropProjectOn(dragId, p.id);
  }}
  onDragEnd={() => setOverProject(null)}
  onClick={() => openBoard(p.id)}
  className={cn(
 "grid cursor-grab gap-[8px] rounded-card border bg-surface p-[12px] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lift)]",
  selectedId === p.id ? "border-ember" : "border-line",
  overProject === p.id && "border-iris",
  )}
  >
  <div className="flex items-start justify-between gap-[8px]">
  <div className="min-w-0">
  <p className="truncate text-[14px] font-semibold text-text">{p.name}</p>
  <p className="truncate text-[12px] text-muted">
  {p.key} · {p.orgName}
  </p>
  </div>
  <div className="flex shrink-0 gap-[2px]">
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="up"
  aria-label={`Move ${p.name} up`}
  disabled={i === 0}
  onClick={(e) => {
  e.stopPropagation();
  moveProject(p.id, -1);
  }}
  />
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="down"
  aria-label={`Move ${p.name} down`}
  disabled={i === list.length - 1}
  onClick={(e) => {
  e.stopPropagation();
  moveProject(p.id, 1);
  }}
  />
  </div>
  </div>
  <div className="flex items-center justify-between gap-[8px]">
  <div className="flex flex-wrap gap-[6px]">
  <Badge variant="count" tone="plain" label={`${counts.todo ?? 0} to do`}>
  {counts.todo ?? 0}
  </Badge>
  <Badge variant="count" tone="iris" label={`${counts.inProgress ?? 0} in progress`}>
  {counts.inProgress ?? 0}
  </Badge>
  <Badge variant="count" tone="spruce" label={`${counts.done ?? 0} done`}>
  {counts.done ?? 0}
  </Badge>
  </div>
  <Button
  size="sm"
  variant="soft"
  onClick={(e) => {
  e.stopPropagation();
  openBoard(p.id);
  }}
  >
  Open
  </Button>
  </div>
  </li>
  );
  })}
  </ul>
  ) : null}
  </aside>

  <section aria-label="Board" className="grid min-w-0 gap-[12px]">
  <div className="hidden w760:block">
  <Select
  label="Project"
  size="sm"
  placeholder="Choose a project"
  value={selectedId}
  options={list.map((p) => ({ value: p.id, label: p.name }))}
  onChange={(v) => v && openBoard(v)}
  />
  </div>

  <div
  onDragOver={(e) => {
  if (!e.dataTransfer.types.includes(PROJECT_TYPE)) return;
  e.preventDefault();
  setOverDrop(true);
  }}
  onDragLeave={(e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) setOverDrop(false);
  }}
  onDrop={(e) => {
  const id = e.dataTransfer.getData(PROJECT_TYPE);
  e.preventDefault();
  setOverDrop(false);
  if (id) openBoard(id);
  }}
  className={cn(
 "grid place-items-center justify-items-center gap-[8px] rounded-card border-2 border-dashed bg-surface p-[16px] text-center text-[14px] text-muted",
  selectedId ? "min-h-[56px]" : "min-h-[180px]",
  overDrop ? "border-ember bg-[color:var(--ember-soft)] text-text" : "border-line-2",
  )}
  >
  {selectedId ? null : <Illustration name="team" alt="" className="w-[140px] w1000:hidden" />}
  <span className="inline-flex items-center gap-[8px]">
  <Icon name="kanban" cls="shrink-0" />
  Drop a project here to open its board
  </span>
  </div>

  {selectedId ? (
  <>
  <div className="flex flex-wrap items-center justify-between gap-[8px]">
  <h2 className="flex min-w-0 items-center gap-[8px] text-[15px] font-semibold text-text">
  <Icon name="kanban" cls="shrink-0" />
  <span className="min-w-0 truncate">{selectedName}</span>
  </h2>
  <div className="w-[200px] ">
  <Select
  label="Sort issues"
  size="sm"
  value={sortKey}
  options={SORT_OPTIONS}
  onChange={(v) => v && setSortKey(v)}
  />
  </div>
  </div>
  {body}
  </>
  ) : null}
  </section>
  </div>
  </>
  );
}
