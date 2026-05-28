// feat(pages/projectSettings/WorkflowsPage): list a project's workflows and create or remove drafts.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import FormModal from "../../components/ui/FormModal.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { emptyCopy } from "../../metadata/empty.js";
import { createWorkflow, deleteWorkflow, getWorkflow, listWorkflows } from "../../libs/api/config.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import { paths } from "../../routes/paths.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";
import { cleanStatuses } from "./components/StatusList.jsx";
import { cleanTransitions } from "./components/TransitionEditor.jsx";

export default function WorkflowsPage() {
  const { projectId, status, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const ready = status === "success";
  const canManage = can("workflow.manage");

  useViewEntry(
    "workflows",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const workflows = usePaged((p) => listWorkflows(projectId, p), {});
  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const columns = [
    {
      key: "name",
      label: "Workflow",
      render: (row) => (
        <span className="grid gap-[2px]">
          <span className="font-semibold text-text">{row.name}</span>
          {row.description ? <span className="text-muted text-[13px]">{row.description}</span> : null}
        </span>
      ),
    },
    {
      key: "state",
      label: "State",
      render: (row) =>
        row.status === "live" ? <Badge tone="spruce">Live</Badge> : <Badge>Draft</Badge>,
    },
    { key: "statuses", label: "Statuses", render: (row) => <span className="text-muted">{row.statuses?.length ?? 0}</span> },
    { key: "transitions", label: "Transitions", render: (row) => <span className="text-muted">{row.transitions?.length ?? 0}</span> },
    { key: "version", label: "Version", render: (row) => <span className="text-muted">v{row.version ?? 0}</span> },
  ];

  const rowMenu = (row) => [
    { id: "open", label: canManage && row.status === "draft" ? "Edit" : "View", icon: "pen", onSelect: () => navigate(paths.workflow(projectId, row._id)) },
    ...(canManage && row.status === "draft"
      ? [{ id: "delete", label: "Delete draft", icon: "trash", danger: true, onSelect: () => setDeleteTarget(row) }]
      : []),
  ];

  const runDelete = async () => {
    try {
      await deleteWorkflow(projectId, deleteTarget._id);
      toast.success("Draft deleted");
      workflows.reload();
    } catch (err) {
      if (err?.status === 409) toast.error(err.message);
      throw err;
    }
  };

  return (
    <>
      <PageHead
        title="Workflows"
        sub="Statuses and transitions an issue moves through"
        actions={
          canManage ? (
            <Button variant="ember" icon="plus" onClick={() => setNewOpen(true)}>
              New draft
            </Button>
          ) : null
        }
      />
      <ProjectSettingsNav active="workflows" />

      <section className="card p-[8px]">
        <DataTable
          label="Workflows"
          rowKey="_id"
          columns={columns}
          rows={workflows.items}
          status={workflows.status}
          error={workflows.error}
          onRetry={workflows.reload}
          hasMore={workflows.hasMore}
          onLoadMore={workflows.loadMore}
          loadingMore={workflows.loadingMore}
          onRowClick={(row) => navigate(paths.workflow(projectId, row._id))}
          rowMenu={rowMenu}
          empty={emptyCopy("workflows")}
        />
      </section>

      <FormModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New workflow draft"
        description="A draft is edited first, then published to take effect."
        submitLabel="Create draft"
        initialValues={{ name: "", copyFrom: "" }}
        onSubmit={async (v) => {
          const body = { name: v.name.trim() };
          if (v.copyFrom) {
            const source = (await getWorkflow(projectId, v.copyFrom)).data;
            body.statuses = cleanStatuses(source.statuses ?? []);
            body.transitions = cleanTransitions(source.transitions ?? []);
          }
          const created = (await createWorkflow(projectId, body)).data;
          toast.success("Draft created");
          navigate(paths.workflow(projectId, created._id));
        }}
        fields={({ values, set, errors }) => (
          <>
            <div className="col-span-full">
              <Input
                label="Name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                hint="Use a name your team will recognize, for example Bug triage."
              />
            </div>
            <div className="col-span-full">
              <Select
                label="Copy from"
                hint="Copies statuses and transitions from a workflow. Start blank to build from scratch."
                value={values.copyFrom}
                options={[
                  { value: "", label: "Start blank" },
                  ...(workflows.items ?? []).map((w) => ({ value: w._id, label: `${w.name} (${w.status})` })),
                ]}
                onChange={(v) => set("copyFrom", v)}
                error={errors.copyFrom}
              />
            </div>
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "draft"}?`}
        text="The draft and its statuses are removed. Live workflows cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={runDelete}
      />
    </>
  );
}
