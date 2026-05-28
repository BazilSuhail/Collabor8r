// feat(pages/dashboards/DashboardsPage): list a project's dashboards, create one and choose the default.
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Dropdown from "../../components/ui/Dropdown.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import FormModal from "../../components/ui/FormModal.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { useConfirm } from "../../components/ui/ConfirmDialog.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { usePaged } from "../../utils/usePaged.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { listDashboards, createDashboard, updateDashboard, deleteDashboard } from "../../libs/api/reports.js";

const keyOf = (row) => row.id ?? row._id;

const VIEWS = [
  { value: "grid", label: "Grid", icon: "grid" },
  { value: "list", label: "List", icon: "list" },
];

export default function DashboardsPage() {
  const { projectId, can } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const list = usePaged((p) => listDashboards(projectId, p), {});
  const [view, setView] = useState("grid");
  const [creating, setCreating] = useState(false);
  const canCreate = can("dashboard.create");
  const ready = list.status === "success";

  useViewEntry(
    "dashboards",
    ({ q, root }) => {
      if (!ready) return undefined;
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const create = async (v) => {
    await createDashboard(projectId, { name: v.name.trim(), description: v.description.trim() });
    toast.success("Dashboard saved");
    list.reload();
  };

  const makeDefault = async (d) => {
    try {
      await updateDashboard(projectId, keyOf(d), { isDefault: true });
      toast.success("Dashboard saved");
      list.setItems((prev) => prev.map((x) => ({ ...x, isDefault: keyOf(x) === keyOf(d) })));
    } catch (err) {
      if (err?.status !== 422) toast.error("Could not update the dashboard");
    }
  };

  const remove = async (d) => {
    const ok = await confirm({
      title: "Delete this dashboard?",
      text: `${d.name} and its widgets are removed for everyone in the project.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteDashboard(projectId, keyOf(d));
      toast.success("Dashboard deleted");
      list.setItems((prev) => prev.filter((x) => keyOf(x) !== keyOf(d)));
    } catch (err) {
      if (err?.status !== 422) toast.error("Could not delete the dashboard");
    }
  };

  const newButton = canCreate ? (
    <Button variant="ember" icon="plus" onClick={() => setCreating(true)}>
      New dashboard
    </Button>
  ) : null;

  return (
    <>
      <PageHead
        title="Dashboards"
        sub="Arrange report widgets into boards for this project."
        actions={
          <Button as={Link} to={`/p/${projectId}/reports`} variant="soft" icon="analytics">
            Reports
          </Button>
        }
      />

      <div className="toolbar">
        <span className="toolbar__spacer" />
        <SegmentedControl label="View" value={view} onChange={setView} options={VIEWS} size="sm" />
        {newButton}
      </div>

      {list.status === "loading" && (
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)] gap-[var(--gap)]">
          <Skeleton variant="cards" count={3} />
        </div>
      )}

      {list.status === "error" && (
        <div className="card">
          <EmptyState tone="error" title="Could not load dashboards" onRetry={list.reload} />
        </div>
      )}

      {ready && list.items.length === 0 && (
        <div className="card">
          <Illustration name="team" alt="" className="mx-auto w-[180px] w1000:hidden" />
          <EmptyState
            icon="dashboard"
            title="No dashboards yet"
            text="Dashboards collect report widgets for the whole team."
            action={newButton}
          />
        </div>
      )}

      {ready && list.items.length > 0 && (
        <>
          <div
            className={
              view === "grid"
                ? "grid grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)] gap-[var(--gap)]"
                : "grid grid-cols-[minmax(0,1fr)] gap-[10px]"
            }
          >
            {list.items.map((d) => {
              const id = keyOf(d);
              const isOwner = String(d.ownerId) === String(user?.id);
              const canManage = isOwner || can("issue.delete");
              const widgetCount = (d.widgets ?? []).length;
              const items = [
                { id: "open", label: "Open", icon: "arrow", href: `/p/${projectId}/dashboards/${id}` },
                canManage && !d.isDefault && { id: "default", label: "Make default", icon: "pin", onSelect: () => makeDefault(d) },
                canManage && "separator",
                canManage && { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => remove(d) },
              ].filter(Boolean);
              return (
                <article
                  key={id}
                  className={`card flex ${view === "grid" ? "flex-col" : "flex-row items-center"} gap-[12px] p-[18px] min-w-0`}
                  data-lift=""
                >
                  <header className="flex items-start gap-[12px] min-w-0 flex-1">
                    <span className="kpi__ico shrink-0" aria-hidden="true">
                      <Icon name="dashboard" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="[font:600_16px/1.25_var(--display)] truncate">
                        <Link to={`/p/${projectId}/dashboards/${id}`} className="rounded-[6px] hover:underline">
                          {d.name}
                        </Link>
                      </h3>
                      {d.description && <p className="card__sub line-clamp-2">{d.description}</p>}
                    </div>
                  </header>
                  <footer className="flex flex-wrap items-center gap-[10px] pt-[12px] border-t border-line w-full justify-between">
                    <span className="flex items-center gap-[10px]">
                      <span className="text-muted text-[12.5px] font-semibold">
                        {widgetCount === 1 ? "1 widget" : `${widgetCount} widgets`}
                      </span>
                      {d.isDefault && (
                        <Badge tone="iris" icon="pin">
                          Default
                        </Badge>
                      )}
                    </span>
                    {items.length > 0 && (
                      <Dropdown
                        label={`${d.name} actions`}
                        items={items}
                        trigger={(t) => (
                          <Button iconOnly variant="ghost" size="sm" icon="more" aria-label={`${d.name} actions`} {...t} />
                        )}
                      />
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
          {list.hasMore && (
            <div className="flex justify-center mt-[16px]">
              <Button variant="soft" size="sm" onClick={list.loadMore} disabled={list.loadingMore}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}

      <FormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New dashboard"
        description="Name the board. You add widgets on the next screen."
        submitLabel="Create dashboard"
        initialValues={{ name: "", description: "" }}
        onSubmit={create}
        fields={({ values, set, errors }) => (
          <>
            <div className="col-span-full">
              <Input
                label="Name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                hint="Shown in the dashboard list. Up to 120 characters."
                required
                maxLength={120}
              />
            </div>
            <div className="col-span-full">
              <Input
                as="textarea"
                label="Description"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                error={errors.description}
                hint="Optional. Tell the team what this board tracks."
                maxLength={1000}
              />
            </div>
          </>
        )}
      />
    </>
  );
}
