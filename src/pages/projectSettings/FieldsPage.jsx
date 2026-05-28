// feat(pages/projectSettings/FieldsPage): configure a project's issue types, priorities, resolutions and custom fields.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { emptyCopy } from "../../metadata/empty.js";
import { listConfig, updateConfig } from "../../libs/api/config.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";
import ConfigTable from "./components/ConfigTable.jsx";
import ConfigFormModal, { SEG_SINGULAR, configApi } from "./components/ConfigFormModal.jsx";

const SEGMENTS = [
  { value: "issue-types", label: "Issue types" },
  { value: "priorities", label: "Priorities" },
  { value: "resolutions", label: "Resolutions" },
  { value: "custom-fields", label: "Custom fields" },
];

export default function FieldsPage() {
  const { projectId, status, can, members } = useProject();
  const toast = useToast();
  const ready = status === "success";
  const canEdit = can("config.manage");
  const canDelete = can("config.delete");

  useViewEntry(
 "fields",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const [seg, setSeg] = useState("issue-types");
  const config = useResource(() => listConfig(projectId, seg, { limit: 100 }), [projectId, seg]);
  const rows = config.data ?? [];

  // editor: null when closed, otherwise { row } where row is null for create.
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Swaps a row with its neighbour, then rewrites the order of every row that moved.
  const move = async (row, dir) => {
  const key = seg === "priorities" ? "rank" : "sortOrder";
  const base = seg === "priorities" ? 1 : 0;
  const sorted = [...rows].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
  const index = sorted.findIndex((r) => r._id === row._id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= sorted.length) return;
  const next = [...sorted];
  [next[index], next[target]] = [next[target], next[index]];
  const writes = next
  .map((r, i) => ({ r, value: i + base }))
  .filter(({ r, value }) => r[key] !== value)
  .map(({ r, value }) => updateConfig(projectId, seg, r._id, { [key]: value }));
  try {
  await Promise.all(writes);
  config.reload();
  } catch (err) {
  if (err?.status === 409 || err?.status === 422) toast.error(err.message);
  }
  };

  const runDelete = async () => {
  try {
  await configApi(seg).remove(projectId, deleteTarget._id);
  toast.success("Deleted");
  config.reload();
  } catch (err) {
  if (err?.status === 409 || err?.status === 422) toast.error(err.message);
  throw err;
  }
  };

  const singular = SEG_SINGULAR[seg];

  return (
  <>
  <PageHead
  title="Fields"
  sub="Issue types, priorities, resolutions and custom fields"
  actions={
  canEdit ? (
  <Button variant="ember" icon="plus" onClick={() => setEditor({ row: null })}>
  New {singular}
  </Button>
  ) : null
  }
  />
  <ProjectSettingsNav active="fields" />

  <div className="mb-[16px]  overflow-x-auto">
  <SegmentedControl as="tabs" label="Field groups" value={seg} onChange={setSeg} options={SEGMENTS} />
  </div>

  <section className="card p-[8px]">
  <ConfigTable
  seg={seg}
  rows={rows}
  status={config.status}
  error={config.error}
  onRetry={config.reload}
  empty={emptyCopy("fields")}
  canEdit={canEdit}
  canDelete={canDelete}
  onEdit={(row) => setEditor({ row })}
  onDelete={(row) => setDeleteTarget(row)}
  onMove={move}
  />
  </section>

  <ConfigFormModal
  key={`${seg}-${editor?.row?._id ?? "new"}-${editor ? "open" : "closed"}`}
  open={Boolean(editor)}
  onClose={() => setEditor(null)}
  seg={seg}
  row={editor?.row ?? null}
  members={members}
  onSaved={() => config.reload()}
  />

  <ConfirmDialog
  open={Boolean(deleteTarget)}
  onClose={() => setDeleteTarget(null)}
  title={`Delete ${deleteTarget?.name ?? singular}?`}
  text="Issues that use it keep their data, but the choice is removed from the list."
  confirmLabel="Delete"
  tone="danger"
  onConfirm={runDelete}
  />
  </>
  );
}
