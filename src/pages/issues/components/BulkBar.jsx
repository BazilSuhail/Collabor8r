// feat(pages/issues/components/BulkBar): bulk status, assignee, sprint and delete for the selected issues.
import { useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import Select from "../../../components/ui/Select.jsx";
import { useProject } from "../../../context/ProjectContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { listSprints } from "../../../libs/api/boards.js";
import { bulkUpdate, deleteIssue, transitionIssue } from "../../../libs/api/issues.js";
import { searchUsers } from "../../../libs/api/users.js";
import { useResource } from "../../../utils/useResource.js";

const NO_SPRINT = "__backlog";
const plural = (n) => (n === 1 ? "issue" : "issues");

// Bulk writes carry no version (only issue PATCH does). Status moves go through transition, one call per issue.
export default function BulkBar({ ids, onClear, onChanged }) {
  const { projectId, statuses, can } = useProject();
  const toast = useToast();
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = ids.length;

  const sprintOptions = [
    { value: NO_SPRINT, label: "Backlog" },
    ...(sprints.data ?? [])
      .filter((s) => s.state !== "closed")
      .map((s) => ({ value: String(s.id ?? s._id), label: s.name })),
  ];

  const applyPatch = async (patch) => {
    setBusy(true);
    try {
      await bulkUpdate(projectId, { issueIds: ids, patch });
      toast.success(`${count} ${plural(count)} updated`);
      onChanged();
    } catch (err) {
      if (err.status === 409) {
        toast.warning("Changed by someone else. Reloaded.");
        onChanged();
      } else {
        toast.error(err.message ?? "Could not update the issues");
      }
    } finally {
      setBusy(false);
    }
  };

  const applyStatus = async (statusId) => {
    setBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => transitionIssue(projectId, id, { toStatus: statusId })),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (count - failed) toast.success(`${count - failed} ${plural(count - failed)} updated`);
    if (failed) toast.error(`${failed} ${plural(failed)} could not be moved`);
    setBusy(false);
    onChanged();
  };

  const removeAll = async () => {
    const results = await Promise.allSettled(ids.map((id) => deleteIssue(projectId, id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    if (count - failed) toast.success(`Deleted ${count - failed} ${plural(count - failed)}`);
    if (failed) toast.error(`${failed} ${plural(failed)} could not be deleted`);
    onChanged();
  };

  const loadUsers = async (q) => {
    const res = await searchUsers(q);
    return (res.data ?? []).map((u) => ({ value: String(u.id ?? u._id), label: u.displayName }));
  };

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-[10px] rounded-card border border-line bg-float shadow-[var(--shadow-pop)] py-[10px] px-[14px] mb-[12px]"
    >
      <span className="inline-flex items-center gap-[6px] text-[13.5px] font-bold tnum">
        <Icon name="check" cls="text-spruce" />
        {count} selected
      </span>
      <Select
        variant="button"
        size="sm"
        label="Set status"
        hideLabel
        placeholder="Status"
        value={null}
        disabled={busy}
        options={statuses.map((s) => ({ value: String(s.id ?? s._id), label: s.name }))}
        onChange={applyStatus}
      />
      <Select
        variant="button"
        size="sm"
        label="Set assignee"
        hideLabel
        placeholder="Assignee"
        value={null}
        searchable
        disabled={busy}
        loadOptions={loadUsers}
        onChange={(assigneeId) => applyPatch({ assigneeId })}
      />
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => applyPatch({ assigneeId: null })}>
        Unassign
      </Button>
      <Select
        variant="button"
        size="sm"
        label="Move to sprint"
        hideLabel
        placeholder="Sprint"
        value={null}
        disabled={busy}
        options={sprintOptions}
        onChange={(v) => applyPatch({ sprintId: v === NO_SPRINT ? null : v })}
      />
      {can("issue.delete") ? (
        <Button variant="danger" size="sm" icon="trash" disabled={busy} onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      ) : null}
      <span className="toolbar__spacer" />
      <Button variant="ghost" size="sm" iconOnly icon="close" aria-label="Clear selection" onClick={onClear} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${count} ${plural(count)}?`}
        text="Deleted issues cannot be restored."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeAll}
      />
    </div>
  );
}
