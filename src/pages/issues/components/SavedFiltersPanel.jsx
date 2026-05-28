// feat(pages/issues/components/SavedFiltersPanel): list, apply, save and delete the project's saved issue filters.
import { useState } from "react";
import Button from "../../../components/ui/Button.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import SideModal from "../../../components/ui/SideModal.jsx";
import { useProject } from "../../../context/ProjectContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createSavedFilter, deleteSavedFilter, listSavedFilters } from "../../../libs/api/issues.js";
import { useResource } from "../../../utils/useResource.js";

const withId = (f) => ({ ...f, id: String(f.id ?? f._id) });

// query is the saved-filter grammar built by the page ("field = value" joined by AND).
export default function SavedFiltersPanel({ open, onClose, query, activeId, onApply, onDeleted }) {
  const { projectId, can } = useProject();
  const toast = useToast();
  const list = useResource(
    async () => {
      const res = await listSavedFilters(projectId, { limit: 100 });
      return { data: (res.data ?? []).map(withId), meta: res.meta };
    },
    [projectId, open],
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const removeFilter = async () => {
    try {
      await deleteSavedFilter(projectId, deleting.id);
      toast.success("Filter deleted");
      if (activeId === deleting.id) onDeleted?.();
      list.reload();
    } catch (err) {
      toast.error(err.message ?? "Could not delete the filter");
      throw err;
    }
  };

  return (
    <>
      <SideModal open={open} onClose={onClose} side="left" title="Saved filters" subtitle="Apply a saved view, or save the current filters.">
        <div className="grid gap-[12px]">
          {can("filter.create") ? (
            <div className="grid gap-[6px]">
              <Button variant="soft" icon="plus" disabled={!query} onClick={() => setSaving(true)}>
                Save current filters
              </Button>
              <p className="text-muted text-[12.5px]">
                {query ? "Saves the filters now applied to the issues list." : "Apply a filter on the issues list first, then save it here."}
              </p>
            </div>
          ) : null}

          {list.status === "loading" ? (
            <div aria-busy="true" className="grid gap-[8px]">
              <span className="sr">Loading</span>
              {[0, 1, 2].map((i) => (
                <span key={i} className="block h-[40px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
              ))}
            </div>
          ) : null}

          {list.status === "error" ? (
            <EmptyState tone="error" title="Could not load saved filters" onRetry={list.reload} />
          ) : null}

          {list.status === "success" && list.data.length === 0 ? (
            <EmptyState icon="savedFilter" title="No saved filters" text="Save the filters you use often to return to them in one click." />
          ) : null}

          {list.status === "success" && list.data.length > 0 ? (
            <ul className="grid gap-[6px]" aria-label="Saved filters">
              {list.data.map((f) => (
                <li key={f.id} className="flex items-center gap-[6px]">
                  <button
                    type="button"
                    aria-pressed={activeId === f.id}
                    onClick={() => onApply(f)}
                    className="flex-1 min-w-0 text-left rounded-ctl py-[9px] px-[12px] text-[13.5px] font-semibold text-text hover:bg-well aria-[pressed=true]:bg-ink aria-[pressed=true]:text-on-ink truncate"
                  >
                    {f.name}
                  </button>
                  {can("filter.create") ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon="trash"
                      aria-label={`Delete ${f.name}`}
                      onClick={() => setDeleting(f)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SideModal>

      <FormModal
        open={saving}
        onClose={() => setSaving(false)}
        title="Save filter"
        description="The current filters are saved under this name."
        submitLabel="Save filter"
        initialValues={{ name: "" }}
        onSubmit={async (values) => {
          const res = await createSavedFilter(projectId, { name: values.name.trim(), query });
          toast.success("Filter saved");
          list.reload();
          return res;
        }}
        fields={({ values, set, errors }) => (
          <Input
            className="col-span-full"
            label="Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            hint="Up to 100 characters."
            maxLength={100}
            required
            autoFocus
          />
        )}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? "filter"}?`}
        text="The saved filter is removed for everyone it is shared with."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeFilter}
      />
    </>
  );
}
