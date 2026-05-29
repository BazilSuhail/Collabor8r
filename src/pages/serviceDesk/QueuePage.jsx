// feat(pages/serviceDesk/QueuePage): work the service desk queue by request type with live SLA countdowns.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import FilterChip from "../../components/ui/FilterChip.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listIssues } from "../../libs/api/issues.js";
import { listRequestTypes, listSlaTimers, pauseTimer, resumeTimer } from "../../libs/api/servicedesk.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { statusTone } from "../../utils/issueVisuals.js";
import { userAvatarSrc } from "../../utils/media.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";
import SlaCountdown from "./components/SlaCountdown.jsx";

const idOf = (row) => String(row?.id ?? row?._id ?? "");
const withId = (row) => ({ ...row, id: idOf(row) });

const STATUS_CHIPS = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "inprogress", label: "In progress" },
  { value: "done", label: "Done" },
];

const ACTIVE_TIMER = new Set(["running", "paused"]);

export default function QueuePage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const canAct = can("issue.edit");
  const canConfigure = can("config.manage");

  const [typeId, setTypeId] = useState("all");
  const [statusCat, setStatusCat] = useState("all");
  const [busyTimer, setBusyTimer] = useState(null);

  const typesQ = useResource(() => listRequestTypes(projectId, { limit: 100 }), [projectId]);
  const timersQ = useResource(() => listSlaTimers(projectId, { limit: 100 }), [projectId]);
  // The server filters issues by issue type, not request type: send the type the request type creates.
  const selectedRT = typeId === "all" ? null : (typesQ.data ?? []).find((t) => String(t.id ?? t._id) === typeId);
  const selectedIssueTypeId = selectedRT?.issueTypeId ? String(selectedRT.issueTypeId) : undefined;
  const issuesQ = usePaged((q) => listIssues(projectId, q), {
  type: selectedIssueTypeId,
  status: statusCat === "all" ? undefined : statusCat,
  });

  const ready = issuesQ.status === "success";
  useViewEntry(
 "desk",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const types = (typesQ.data ?? []).map(withId);
  const typeNames = Object.fromEntries(types.map((t) => [t.id, t.name]));
  const timers = timersQ.data ?? [];

  // One timer per issue. A running or paused timer wins over a finished one.
  const timerByIssue = {};
  timers.forEach((t) => {
  const key = String(t.issueId);
  const current = timerByIssue[key];
  if (!current || (ACTIVE_TIMER.has(t.status) && !ACTIVE_TIMER.has(current.status))) timerByIssue[key] = t;
  });

  const replaceTimer = (rec) =>
  timersQ.setData((prev) => (prev ?? []).map((t) => (idOf(t) === idOf(rec) ? { ...t, ...rec, id: idOf(rec) } : t)));

  const setTimerStatus = async (timer, pausing) => {
  const call = pausing ? pauseTimer : resumeTimer;
  const res = await call(projectId, idOf(timer));
  replaceTimer(res.data ?? { ...timer, status: pausing ? "paused" : "running" });
  };

  const onToggleTimer = async (timer) => {
  const pausing = timer.status === "running";
  setBusyTimer(idOf(timer));
  try {
  await setTimerStatus(timer, pausing);
  toast.success(pausing ? "Timer paused" : "Timer resumed", {
  undo: async () => {
  try {
  await setTimerStatus(timer, !pausing);
  } catch {
  // The API layer shows the error toast.
  }
  },
  });
  } catch {
  // The API layer shows the error toast.
  } finally {
  setBusyTimer(null);
  }
  };

  const issues = issuesQ.items.map(withId);

  const columns = [
  {
  key: "key",
  label: "Key",
  render: (row) => <span className="font-mono text-[12.5px] font-semibold text-text">{row.key}</span>,
  },
  {
  key: "title",
  label: "Summary",
  render: (row) => <span className="block  truncate font-semibold text-text">{row.title}</span>,
  },
  {
  key: "customer",
  label: "Customer",
  render: (row) => <span className="text-muted">{row.customer?.name ?? row.customerName ?? "—"}</span>,
  },
  {
  key: "requestType",
  label: "Request type",
  render: (row) => <span className="text-muted">{typeNames[String(row.requestTypeId)] ?? "—"}</span>,
  },
  {
  key: "sla",
  label: "SLA",
  render: (row) => {
  const timer = timerByIssue[row.id];
  return timer ? (
  <SlaCountdown timer={timer} canAct={canAct} busy={busyTimer === idOf(timer)} onToggle={onToggleTimer} />
  ) : (
  <span className="text-faint">No SLA</span>
  );
  },
  },
  {
  key: "assignee",
  label: "Assignee",
  render: (row) =>
  row.assignee?.displayName ? (
  <span className="inline-flex min-w-0 items-center gap-[8px]">
  <Avatar name={row.assignee.displayName} src={userAvatarSrc({ avatarKey: row.assignee.avatarKey, avatarUrl: row.assignee.avatarUrl })} size="xs" />
  <span className="truncate">{row.assignee.displayName}</span>
  </span>
  ) : (
  <span className="text-faint">Unassigned</span>
  ),
  },
  {
  key: "status",
  label: "Status",
  render: (row) => (
  <Badge tone={statusTone(row.statusCategory)} variant="status">
  {row.statusName ?? row.statusCategory}
  </Badge>
  ),
  },
  ];

  return (
  <>
  <PageHead
  title="Service desk"
  sub="Customer requests by type. Each timer shows how long is left before the target."
  actions={
  canConfigure ? (
  <Button variant="soft" icon="gear" as={Link} to={paths.deskSettings(projectId)}>
  Desk settings
  </Button>
  ) : null
  }
  />

  <div className="toolbar flex-wrap">
  <SegmentedControl
  as="tabs"
  label="Request types"
  value={typeId}
  onChange={setTypeId}
  options={[{ value: "all", label: "All" }, ...types.map((t) => ({ value: t.id, label: t.name }))]}
  />
  </div>

  <div className="mb-[16px] flex flex-wrap gap-[8px]" role="group" aria-label="Filter by status">
  {STATUS_CHIPS.map((c) => (
  <FilterChip key={c.value} pressed={statusCat === c.value} onClick={() => setStatusCat(c.value)}>
  {c.label}
  </FilterChip>
  ))}
  </div>

  <DataTable
  label="Service desk queue"
  columns={columns}
  rows={issues}
  rowKey="id"
  status={issuesQ.status}
  error={issuesQ.error}
  onRetry={issuesQ.reload}
  empty={emptyCopy("desk")}
  onRowClick={(row) => navigate(paths.issue(projectId, row.key))}
  hasMore={issuesQ.hasMore}
  onLoadMore={issuesQ.loadMore}
  loadingMore={issuesQ.loadingMore}
  />
  </>
  );
}
