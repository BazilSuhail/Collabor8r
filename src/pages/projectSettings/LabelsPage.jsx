// feat(pages/projectSettings/LabelsPage): manage a project's labels and components.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Dropdown from "../../components/ui/Dropdown.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { emptyCopy } from "../../metadata/empty.js";
import { listComponents, listLabels } from "../../libs/api/config.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { cn } from "../../utils/cn.js";
import { useResource } from "../../utils/useResource.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";
import ConfigFormModal, { SEG_SINGULAR, configApi } from "./components/ConfigFormModal.jsx";
import { SWATCH } from "./components/ConfigTable.jsx";

const TABS = [
  { value: "labels", label: "Labels" },
  { value: "components", label: "Components" },
];

export default function LabelsPage() {
  const { projectId, status, can, members } = useProject();
  const toast = useToast();
  const ready = status === "success";
  const [tab, setTab] = useState("labels");

  // Server rules: labels are created by reporters, components by leads; deletes need admin.
  const isLabels = tab === "labels";
  const canCreate = isLabels ? can("label.create") : can("config.manage");
  const canEdit = can("config.manage");
  const canDelete = isLabels ? can("label.delete") : can("config.delete");

  useViewEntry(
 "labels",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const data = useResource(
  () => (isLabels ? listLabels(projectId, { limit: 100 }) : listComponents(projectId, { limit: 100 })),
  [projectId, tab],
  );
  const rows = data.data ?? [];

  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const runDelete = async () => {
  try {
  await configApi(tab).remove(projectId, deleteTarget._id);
  toast.success("Deleted");
  data.reload();
  } catch (err) {
  if (err?.status === 409 || err?.status === 422) toast.error(err.message);
  throw err;
  }
  };

  const itemMenu = (row) => [
  ...(canEdit ? [{ id: "edit", label: "Edit", icon: "pen", onSelect: () => setEditor({ row }) }] : []),
  ...(canDelete ? [{ id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleteTarget(row) }] : []),
  ];

  const componentColumns = [
  { key: "name", label: "Component", render: (row) => <span className="font-semibold text-text">{row.name}</span> },
  {
  key: "lead",
  label: "Lead",
  render: (row) =>
  row.leadName ? (
  <span className="inline-flex items-center gap-[8px]">
  <Avatar name={row.leadName} size="xs" />
  <span className="text-text">{row.leadName}</span>
  </span>
  ) : (
  <span className="text-faint">No lead</span>
  ),
  },
  {
  key: "description",
  label: "Description",
  render: (row) => <span className="text-muted">{row.description ?? ""}</span>,
  },
  ];

  return (
  <>
  <PageHead
  title="Labels"
  sub="Group issues across the project"
  actions={
  canCreate ? (
  <Button variant="ember" icon="plus" onClick={() => setEditor({ row: null })}>
  New {SEG_SINGULAR[tab]}
  </Button>
  ) : null
  }
  />
  <ProjectSettingsNav active="labels" />

  <div className="mb-[16px]  overflow-x-auto">
  <SegmentedControl as="tabs" label="Label groups" value={tab} onChange={setTab} options={TABS} />
  </div>

  <section className="card p-[20px]" aria-label={isLabels ? "Labels" : "Components"}>
  {data.status === "loading" ? (
  <Skeleton variant="rows" count={4} cols={3} />
  ) : data.status === "error" ? (
  <EmptyState tone="error" icon={isLabels ? "labels" : "component"} title="This list could not load" text={data.error?.message} onRetry={data.reload} />
  ) : isLabels ? (
  rows.length === 0 ? (
  <div className="grid justify-items-center gap-[12px]">
  <Illustration name="empty" className="w-[180px] w1000:hidden" />
  <EmptyState icon={emptyCopy("labels").icon} title={emptyCopy("labels").title} text={emptyCopy("labels").text} />
  </div>
  ) : (
  <ul className="flex flex-wrap gap-[8px]" aria-label="Labels">
  {rows.map((row) => {
  const chip = (triggerProps) => (
  <button type="button" className="chip h-[30px] gap-[8px]" {...triggerProps}>
  <span
  aria-hidden="true"
  className={cn("inline-block h-[10px] w-[10px] rounded-[3px]", SWATCH[row.color] ?? "bg-faint")}
  />
  <span>{row.name}</span>
  </button>
  );
  const items = itemMenu(row);
  return (
  <li key={row._id}>
  {items.length ? (
  <Dropdown label={`Actions for ${row.name}`} items={items} trigger={chip} />
  ) : (
  <span className="chip h-[30px] gap-[8px]">
  <span
  aria-hidden="true"
  className={cn("inline-block h-[10px] w-[10px] rounded-[3px]", SWATCH[row.color] ?? "bg-faint")}
  />
  <span>{row.name}</span>
  </span>
  )}
  </li>
  );
  })}
  </ul>
  )
  ) : (
  <DataTable
  label="Components"
  rowKey="_id"
  columns={componentColumns}
  rows={rows}
  status={data.status}
  error={data.error}
  onRetry={data.reload}
  rowMenu={canEdit || canDelete ? itemMenu : undefined}
  empty={{ icon: "component", title: "No components yet", text: "Components group issues by area of the product." }}
  />
  )}
  </section>

  <ConfigFormModal
  key={`${tab}-${editor?.row?._id ?? "new"}`}
  open={Boolean(editor)}
  onClose={() => setEditor(null)}
  seg={tab}
  row={editor?.row ?? null}
  members={members}
  onSaved={() => data.reload()}
  />

  <ConfirmDialog
  open={Boolean(deleteTarget)}
  onClose={() => setDeleteTarget(null)}
  title={`Delete ${deleteTarget?.name ?? SEG_SINGULAR[tab]}?`}
  text="Issues keep their history, but this choice is removed from every issue."
  confirmLabel="Delete"
  tone="danger"
  onConfirm={runDelete}
  />
  </>
  );
}
