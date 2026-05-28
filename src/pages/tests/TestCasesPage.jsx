// feat(pages/tests/TestCasesPage): maintain the test case library and start new test runs.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteTestCase, listTestCases, listTestRuns } from "../../libs/api/tests.js";
import { EMPTY } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import TestCaseFormModal from "./components/TestCaseFormModal.jsx";
import TestRunFormModal from "./components/TestRunFormModal.jsx";

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchCases = ({ pid, ...p }) => listTestCases(pid, p).then(withIds);
const fetchRuns = ({ pid, ...p }) => listTestRuns(pid, p).then(withIds);

const RUN_TONE = { planned: "plain", inProgress: "iris", completed: "spruce" };
const RUN_LABEL = { planned: "Planned", inProgress: "In progress", completed: "Completed" };

function CasesTable({ projectId, canEdit, onNew, onEdit, onDelete }) {
  const cases = usePaged(fetchCases, { pid: projectId });
  const columns = [
    {
      key: "title",
      label: "Test case",
      render: (row) => (
        <span className="grid gap-[2px] min-w-0">
          <span className="text-muted text-[12px] font-semibold tnum">{row.key}</span>
          <span className="font-semibold text-text truncate">{row.title}</span>
        </span>
      ),
    },
    { key: "priority", label: "Priority", render: (row) => row.priority || "None" },
    { key: "steps", label: "Steps", align: "right", render: (row) => row.steps?.length ?? 0 },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant="status" tone={row.status === "ready" ? "spruce" : "plain"}>
          {row.status ?? "draft"}
        </Badge>
      ),
    },
  ];
  const rowMenu = canEdit
    ? (row) => [
        { id: "edit", label: "Edit", icon: "edit", onSelect: () => onEdit(row) },
        "separator",
        { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => onDelete(row) },
      ]
    : undefined;
  return (
    <DataTable
      label="Test cases"
      columns={columns}
      rows={cases.items}
      status={cases.status}
      error={cases.error}
      onRetry={cases.reload}
      empty={{
        ...EMPTY.tests,
        action: canEdit ? <Button variant="ember" size="sm" icon="plus" onClick={onNew}>New test case</Button> : null,
      }}
      rowMenu={rowMenu}
      hasMore={cases.hasMore}
      onLoadMore={cases.loadMore}
      loadingMore={cases.loadingMore}
    />
  );
}

function RunsTable({ projectId }) {
  const runs = usePaged(fetchRuns, { pid: projectId });
  const navigate = useNavigate();
  const columns = [
    {
      key: "name",
      label: "Run",
      render: (row) => (
        <Link to={paths.testRun(projectId, row.id)} className="font-semibold text-text hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant="status" tone={RUN_TONE[row.status] ?? "plain"}>
          {RUN_LABEL[row.status] ?? "Planned"}
        </Badge>
      ),
    },
    {
      key: "results",
      label: "Results",
      render: (row) => {
        const total = row.counts?.total ?? 0;
        const passed = row.counts?.passed ?? 0;
        const failed = row.counts?.failed ?? 0;
        const pct = total ? Math.round((passed / total) * 100) : 0;
        return (
          <span className="grid gap-[6px] min-w-[160px]">
            <span className="meter">
              <span className="meter__fill meter__fill--spruce" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-muted text-[12.5px] tnum">
              {passed} passed, {failed} failed of {total}
            </span>
          </span>
        );
      },
    },
  ];
  return (
    <DataTable
      label="Test runs"
      columns={columns}
      rows={runs.items}
      status={runs.status}
      error={runs.error}
      onRetry={runs.reload}
      empty={{ ...EMPTY.tests, title: "No test runs yet", text: "Start a run to record results case by case." }}
      onRowClick={(row) => navigate(paths.testRun(projectId, row.id))}
      hasMore={runs.hasMore}
      onLoadMore={runs.loadMore}
      loadingMore={runs.loadingMore}
    />
  );
}

export default function TestCasesPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const canEdit = can("test.edit");
  const [tab, setTab] = useState("cases");
  const [version, setVersion] = useState(0);
  const [caseModal, setCaseModal] = useState({ open: false, target: null });
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useViewEntry(
    "tests",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26 });
      return bindLift(root);
    },
    [tab],
  );

  const refresh = () => setVersion((v) => v + 1);

  const confirmDelete = async () => {
    try {
      await deleteTestCase(projectId, deleting.id);
      toast.success("Test case deleted");
      setDeleting(null);
      refresh();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  return (
    <>
      <PageHead
        title="Test cases"
        sub="The test library and the runs that check it."
        actions={
          canEdit ? (
            <>
              <Button variant="soft" icon="plus" onClick={() => setRunModalOpen(true)}>
                New test run
              </Button>
              <Button variant="ember" icon="plus" onClick={() => setCaseModal({ open: true, target: null })}>
                New test case
              </Button>
            </>
          ) : null
        }
      />
      <div className="toolbar">
        <SegmentedControl
          label="Test views"
          as="tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: "cases", label: "Cases" },
            { value: "runs", label: "Runs" },
          ]}
        />
      </div>
      {tab === "cases" ? (
        <CasesTable
          key={`cases-${version}`}
          projectId={projectId}
          canEdit={canEdit}
          onNew={() => setCaseModal({ open: true, target: null })}
          onEdit={(row) => setCaseModal({ open: true, target: row })}
          onDelete={(row) => setDeleting(row)}
        />
      ) : (
        <RunsTable key={`runs-${version}`} projectId={projectId} />
      )}
      <TestCaseFormModal
        open={caseModal.open}
        onClose={() => setCaseModal({ open: false, target: null })}
        projectId={projectId}
        testCase={caseModal.target}
        onSaved={() => {
          setCaseModal({ open: false, target: null });
          refresh();
        }}
      />
      <TestRunFormModal
        open={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        projectId={projectId}
        onCreated={(run) => {
          setRunModalOpen(false);
          navigate(paths.testRun(projectId, run.id ?? run._id));
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete test case?"
        text={`"${deleting?.title ?? ""}" is removed from the library. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
