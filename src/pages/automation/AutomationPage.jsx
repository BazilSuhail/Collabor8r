// feat(pages/automation/AutomationPage): list automation rules with on/off switches and inspect their run history.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import FilterChip from "../../components/ui/FilterChip.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Switch from "../../components/ui/Switch.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteRule, listRuns, listRules, toggleRule } from "../../libs/api/automation.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { cardRise, bindLift, fadeUp, useViewEntry } from "../../utils/motion.js";
import { relativeTime } from "../../utils/format.js";
import { usePaged } from "../../utils/usePaged.js";
import RuleRunModal from "./components/RuleRunModal.jsx";
import RunDetailDrawer from "./components/RunDetailDrawer.jsx";
import RunsTable from "./components/RunsTable.jsx";
import { triggerLabel } from "./components/RuleSection.jsx";

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

const RUN_FILTERS = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
];

export default function AutomationPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const canManage = can("automation.manage");

  const [view, setView] = useState("rules");
  const [runFilter, setRunFilter] = useState("all");
  const [pendingId, setPendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [runTarget, setRunTarget] = useState(null);
  const [openRun, setOpenRun] = useState(null);

  const rulesQ = usePaged((q) => listRules(projectId, q), {});
  const runsQ = usePaged((q) => listRuns(projectId, q), {
  status: runFilter === "all" ? undefined : runFilter,
  });

  const rules = rulesQ.items.map(withId);
  const ruleNames = Object.fromEntries(rules.map((r) => [r.id, r.name]));
  const ready = rulesQ.status === "success";

  useViewEntry(
 "automation",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const setEnabled = (id, enabled) =>
  rulesQ.setItems((prev) => prev.map((r) => (String(r.id ?? r._id) === id ? { ...r, enabled } : r)));

  // The server flips the flag on each toggle call, so undo is one more call.
  const flipRule = async (id, wasEnabled) => {
  const next = !wasEnabled;
  setEnabled(id, next);
  await toggleRule(projectId, id);
  return next;
  };

  const onToggle = async (rule) => {
  setPendingId(rule.id);
  try {
  const next = await flipRule(rule.id, rule.enabled);
  toast.success(next ? "Rule enabled" : "Rule disabled", {
  undo: async () => {
  try {
  await flipRule(rule.id, next);
  } catch {
  // The API layer already showed the error toast.
  }
  },
  });
  } catch {
  setEnabled(rule.id, rule.enabled);
  } finally {
  setPendingId(null);
  }
  };

  const confirmDelete = async () => {
  await deleteRule(projectId, deleteTarget.id);
  rulesQ.setItems((prev) => prev.filter((r) => String(r.id ?? r._id) !== deleteTarget.id));
  toast.success("Rule deleted");
  };

  const ruleColumns = [
  {
  key: "name",
  label: "Rule",
  render: (row) => (
  <div className="min-w-0">
  <p className="font-semibold text-text truncate">{row.name}</p>
  {row.description ? <p className="card__sub truncate">{row.description}</p> : null}
  </div>
  ),
  },
  {
  key: "trigger",
  label: "Trigger",
  render: (row) => (
  <Badge tone="plain" icon="bolt" className=" truncate">
  {triggerLabel(row.trigger?.type)}
  </Badge>
  ),
  },
  {
  key: "enabled",
  label: "On",
  render: (row) => (
  <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
  <Switch
  checked={Boolean(row.enabled)}
  disabled={!canManage || pendingId === row.id}
  onChange={() => onToggle(row)}
  label={`Enable ${row.name}`}
  hideLabel
  />
  </span>
  ),
  },
  {
  key: "lastRun",
  label: "Last run",
  render: (row) => {
  const when = row.lastRunAt ? relativeTime(row.lastRunAt) : row.runCount ? `${row.runCount} runs` : "Never";
  return (
  <span className="inline-flex items-center gap-[8px] text-muted">
  {when}
  {row.errorCount > 0 ? (
  <Badge tone="down" variant="count" label={`${row.errorCount} failed runs`}>
  {row.errorCount}
  </Badge>
  ) : null}
  </span>
  );
  },
  },
  ];

  const rowMenu = (row) => [
  { id: "edit", label: "Edit rule", icon: "edit", onSelect: () => navigate(paths.automationRule(projectId, row.id)) },
  { id: "run", label: "Run on issue", icon: "play", onSelect: () => setRunTarget(row) },
 "separator",
  { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleteTarget(row) },
  ];

  return (
  <>
  <PageHead
  title="Automation"
  sub="Rules run when issues change. Turn them on or off, or inspect their history."
  actions={
  canManage ? (
  <Button variant="ember" icon="plus" as={Link} to={paths.automationNew(projectId)} magnetic>
  New rule
  </Button>
  ) : null
  }
  />

  <div className="toolbar">
  <SegmentedControl
  as="tabs"
  label="Automation views"
  value={view}
  onChange={setView}
  options={[
  { value: "rules", label: "Rules" },
  { value: "runs", label: "Runs" },
  ]}
  />
  <span className="toolbar__spacer" />
  {view === "runs" ? (
  <div className="flex flex-wrap gap-[8px]" role="group" aria-label="Filter runs by result">
  {RUN_FILTERS.map((f) => (
  <FilterChip key={f.value} pressed={runFilter === f.value} onClick={() => setRunFilter(f.value)}>
  {f.label}
  </FilterChip>
  ))}
  </div>
  ) : null}
  </div>

  {view === "rules" ? (
  <DataTable
  label="Automation rules"
  columns={ruleColumns}
  rows={rules}
  rowKey="id"
  status={rulesQ.status}
  error={rulesQ.error}
  onRetry={rulesQ.reload}
  empty={{
  ...emptyCopy("automation"),
  action: canManage ? (
  <Button variant="ember" as={Link} to={paths.automationNew(projectId)}>
  New rule
  </Button>
  ) : undefined,
  }}
  onRowClick={(row) => navigate(paths.automationRule(projectId, row.id))}
  rowMenu={canManage ? rowMenu : undefined}
  hasMore={rulesQ.hasMore}
  onLoadMore={rulesQ.loadMore}
  loadingMore={rulesQ.loadingMore}
  />
  ) : (
  <RunsTable
  rows={runsQ.items}
  status={runsQ.status}
  error={runsQ.error}
  onRetry={runsQ.reload}
  hasMore={runsQ.hasMore}
  onLoadMore={runsQ.loadMore}
  loadingMore={runsQ.loadingMore}
  onOpen={setOpenRun}
  ruleNames={ruleNames}
  />
  )}

  <ConfirmDialog
  open={Boolean(deleteTarget)}
  onClose={() => setDeleteTarget(null)}
  title="Delete this rule?"
  text={deleteTarget ? `"${deleteTarget.name}" and its run history will be removed.` : ""}
  confirmLabel="Delete"
  tone="danger"
  onConfirm={confirmDelete}
  />

  <RuleRunModal
  open={Boolean(runTarget)}
  onClose={() => setRunTarget(null)}
  pid={projectId}
  rule={runTarget}
  onRan={() => runsQ.reload()}
  />

  <RunDetailDrawer
  open={Boolean(openRun)}
  onClose={() => setOpenRun(null)}
  run={openRun}
  ruleName={openRun ? ruleNames[String(openRun.ruleId)] : undefined}
  />
  </>
  );
}
