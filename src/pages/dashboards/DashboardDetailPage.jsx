// feat(pages/dashboards/DashboardDetailPage): show a dashboard's report widgets and let the owner add, remove and reorder them.
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import ReportCard from "../../components/reports/ReportCard.jsx";
import LineChart from "../../components/reports/LineChart.jsx";
import BarChart from "../../components/reports/BarChart.jsx";
import DonutChart from "../../components/reports/DonutChart.jsx";
import HBars from "../../components/reports/HBars.jsx";
import WidgetPicker, { WIDGET_TYPES } from "../../components/reports/WidgetPicker.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Switch from "../../components/ui/Switch.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { formatNumber } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, flip, useViewEntry } from "../../utils/motion.js";
import {
  getDashboard,
  updateDashboard,
  summary,
  createdVsResolved,
  velocity,
  burndown,
  workload,
} from "../../libs/api/reports.js";
import { listSprints } from "../../libs/api/boards.js";

const DAY = 864e5;
const RANGE_DAYS = 90;
const GRID_COLUMNS = 12;
const keyOf = (row) => row.id ?? row._id;
const none = () => Promise.resolve({ data: null, meta: null });
const TYPE_LABEL = { ...Object.fromEntries(WIDGET_TYPES.map((w) => [w.type, w.label])), velocity: "Velocity" };
const STAT_LABEL = { created: "Created", resolved: "Resolved", open: "Open" };
const DEFAULT_SIZE = {
  stat: { w: 3, h: 4 },
  text: { w: 12, h: 3 },
};
const sizeFor = (type) => DEFAULT_SIZE[type] ?? { w: 6, h: 8 };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lastDays = (days) => {
  const to = new Date();
  return { from: new Date(to.getTime() - (days - 1) * DAY).toISOString(), to: to.toISOString() };
};
const makeId = () => `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Places widgets left to right on the 12-column grid and wraps to a new row when full.
function packWidgets(list) {
  let x = 0;
  let y = 0;
  let rowH = 0;
  return list.map((w) => {
    const span = clamp(Number(w.w) || 6, 1, GRID_COLUMNS);
    const h = clamp(Number(w.h) || 8, 1, 48);
    if (x + span > GRID_COLUMNS) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    const out = { ...w, x, y, w: span, h };
    x += span;
    rowH = Math.max(rowH, h);
    return out;
  });
}

// The data call a widget needs. Returns null when the widget draws from its own config only.
function widgetSource(projectId, widget) {
  const { type } = widget;
  const config = widget.config ?? {};
  if (type === "stat" || type === "donut") return () => summary(projectId);
  if (type === "lineChart") return () => createdVsResolved(projectId, lastDays(RANGE_DAYS));
  if (type === "barChart" || type === "velocity") return () => velocity(projectId);
  if (type === "workload") return () => workload(projectId);
  if (type === "burndown") return config.sprintId ? () => burndown(projectId, config.sprintId) : null;
  return null;
}

function WidgetCard({ projectId, widget, index, count, editing, onMove, onRemove }) {
  const { type } = widget;
  const config = widget.config ?? {};
  const title = widget.title || TYPE_LABEL[type] || type;
  const span = clamp(Number(widget.w) || 6, 1, GRID_COLUMNS);
  const source = widgetSource(projectId, widget);
  const res = useResource(source ?? none, [projectId, type, config.sprintId]);
  const data = res.data;

  let body = null;
  let empty = false;
  let emptyText;
  let sub;

  if (type === "text") {
    body = <p className="whitespace-pre-wrap text-[15px] leading-[1.55]">{config.text || "No text yet."}</p>;
  } else if (type === "stat" && data) {
    const created = data.created ?? 0;
    const resolved = data.resolved ?? 0;
    const metric = config.metric ?? "open";
    const value = metric === "created" ? created : metric === "resolved" ? resolved : Math.max(0, created - resolved);
    sub = STAT_LABEL[metric];
    body = (
      <div className="grid place-items-center gap-[4px] py-[18px] text-center">
        <b className="num [font:600_clamp(34px,3.2vw,46px)/1_var(--display)] tracking-[-0.025em]">{formatNumber(value)}</b>
        <span className="text-muted text-[13px] font-semibold">{STAT_LABEL[metric]} items</span>
      </div>
    );
  } else if (type === "lineChart" && data) {
    const rows = data;
    empty = rows.length === 0;
    emptyText = "Items show up here once they are created or resolved.";
    sub = "Last 90 days";
    body = (
      <LineChart
        label="Created and resolved items per day"
        labels={rows.map((r) => String(r.date).slice(5))}
        series={[
          { name: "Created", tone: "ember", values: rows.map((r) => r.created ?? 0) },
          { name: "Resolved", tone: "spruce", values: rows.map((r) => r.resolved ?? 0) },
        ]}
      />
    );
  } else if ((type === "barChart" || type === "velocity") && data) {
    const sprints = data.sprints ?? [];
    empty = sprints.length === 0;
    emptyText = "Close a sprint to see its velocity.";
    sub = `Average ${data.average ?? 0} points per sprint`;
    body = (
      <BarChart
        label="Points finished per closed sprint"
        labels={sprints.map((s) => s.name)}
        values={sprints.map((s) => s.velocity ?? 0)}
        tone="ember"
      />
    );
  } else if (type === "donut" && data) {
    const parts = Object.entries(data.byType ?? {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
    const total = parts.reduce((n, p) => n + p.value, 0);
    empty = parts.length === 0;
    emptyText = "Items show up here once they exist.";
    body = <DonutChart label="Items by type" parts={parts} centerValue={formatNumber(total)} centerLabel="items" />;
  } else if (type === "burndown") {
    if (!config.sprintId) {
      empty = true;
      emptyText = "This widget has no sprint.";
    } else if (data) {
      const points = data.points ?? [];
      empty = points.length === 0;
      emptyText = "This sprint has no dates yet.";
      body = (
        <LineChart
          label="Remaining points against the ideal line"
          labels={points.map((p) => String(p.date).slice(5))}
          series={[
            { name: "Remaining", tone: "ember", values: points.map((p) => p.remaining) },
            { name: "Ideal", tone: "muted", values: points.map((p) => p.ideal), dashed: true },
          ]}
        />
      );
    }
  } else if (type === "workload" && data) {
    empty = data.length === 0;
    emptyText = "Nobody has open items assigned.";
    body = (
      <HBars
        label="Open items per assignee"
        rows={data.map((w) => ({
          key: String(w.userId),
          label: w.name,
          value: w.openItems ?? 0,
          valueText: `${w.openItems ?? 0} open`,
          tone: "iris",
        }))}
      />
    );
  }

  return (
    <div
      data-key={widget.id}
      className="min-w-0 w760:![grid-column:1/-1]"
      style={{ gridColumn: `span ${span}` }}
    >
      <ReportCard
        id={`w-${widget.id}`}
        className="h-full"
        title={title}
        sub={sub}
        status={res.status}
        error={res.error}
        onRetry={res.reload}
        empty={empty}
        emptyText={emptyText}
        tools={
          editing && (
            <span className="flex items-center gap-[2px]">
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon="up"
                aria-label={`Move ${title} up`}
                disabled={index === 0}
                onClick={() => onMove(-1)}
              />
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon="down"
                aria-label={`Move ${title} down`}
                disabled={index === count - 1}
                onClick={() => onMove(1)}
              />
              <Button iconOnly variant="ghost" size="sm" icon="trash" aria-label={`Remove ${title}`} onClick={onRemove} />
            </span>
          )
        }
      >
        {body}
      </ReportCard>
    </div>
  );
}

export default function DashboardDetailPage() {
  const { projectId, can } = useProject();
  const { dashboardId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const dash = useResource(() => getDashboard(projectId, dashboardId), [projectId, dashboardId]);
  const gridRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [picking, setPicking] = useState(false);

  const ready = dash.status === "success";
  const saved = dash.data?.widgets ?? [];
  const widgets = editing ? draft : saved;
  const canEdit = ready && (String(dash.data.ownerId) === String(user?.id) || can("issue.delete"));

  useViewEntry(
    "dashboard-detail",
    ({ q, root }) => {
      if (!ready) return undefined;
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const save = useMutation((list) => updateDashboard(projectId, dashboardId, { widgets: packWidgets(list) }), {
    success: "Dashboard saved",
    error: "Could not save the dashboard",
  });

  const startEdit = () => {
    setDraft(saved.map((w) => ({ ...w })));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft([]);
  };

  const onSave = async () => {
    const res = await save.run(draft);
    if (!res) return;
    dash.setData(res.data);
    setEditing(false);
    setDraft([]);
  };

  // Swaps a widget with its neighbour. flip() animates the move; the state update is flushed inside it.
  const moveWidget = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= draft.length) return;
    flip(gridRef.current, () =>
      flushSync(() =>
        setDraft((prev) => {
          const next = [...prev];
          [next[i], next[j]] = [next[j], next[i]];
          return next;
        }),
      ),
    );
  };

  const removeWidget = (i) => setDraft((prev) => prev.filter((_, idx) => idx !== i));

  const addWidget = async (type) => {
    setPicking(false);
    const size = sizeFor(type);
    const config = {};
    if (type === "text") config.text = "Write a note for the team.";
    if (type === "stat") config.metric = "open";
    if (type === "burndown") {
      try {
        const sprints = (await listSprints(projectId, { limit: 100 })).data ?? [];
        const pick = sprints.find((s) => s.state === "active") ?? sprints[0];
        if (pick) config.sprintId = keyOf(pick);
      } catch {
        toast.error("Could not load sprints");
      }
    }
    setDraft((prev) => [...prev, { id: makeId(), type, config, x: 0, y: 0, w: size.w, h: size.h }]);
  };

  const openPicker = () => {
    if (!editing) startEdit();
    setPicking(true);
  };

  return (
    <>
      <PageHead
        title={dash.data?.name ?? "Dashboard"}
        sub={dash.data?.description || undefined}
        actions={
          <Button as={Link} to={`/p/${projectId}/dashboards`} variant="soft" icon="chevL">
            All dashboards
          </Button>
        }
      />

      {canEdit && (
        <div className="toolbar">
          <Switch checked={editing} onChange={(on) => (on ? startEdit() : cancelEdit())} label="Edit layout" />
          <span className="toolbar__spacer" />
          {editing && (
            <>
              <Button variant="soft" icon="plus" onClick={openPicker}>
                Add widget
              </Button>
              <Button variant="ghost" onClick={cancelEdit}>
                Discard
              </Button>
              <Button variant="ember" onClick={onSave} loading={save.pending}>
                Save layout
              </Button>
            </>
          )}
        </div>
      )}

      {dash.status === "loading" && (
        <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-[var(--gap)] w760:grid-cols-[minmax(0,1fr)]">
          <Skeleton variant="cards" count={2} />
        </div>
      )}

      {dash.status === "error" && (
        <div className="card">
          <EmptyState tone="error" title="Could not load this dashboard" onRetry={dash.reload} />
        </div>
      )}

      {ready && widgets.length === 0 && (
        <div className="card">
          <EmptyState
            icon="dashboard"
            title="Add your first widget"
            text="Widgets show live numbers from this project's reports."
            action={
              canEdit ? (
                <Button variant="ember" icon="plus" onClick={openPicker}>
                  Add widget
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {ready && widgets.length > 0 && (
        <div
          ref={gridRef}
          className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-[var(--gap)] w760:grid-cols-[minmax(0,1fr)]"
        >
          {widgets.map((w, i) => (
            <WidgetCard
              key={w.id}
              projectId={projectId}
              widget={w}
              index={i}
              count={widgets.length}
              editing={editing}
              onMove={(dir) => moveWidget(i, dir)}
              onRemove={() => removeWidget(i)}
            />
          ))}
        </div>
      )}

      <WidgetPicker open={picking} onClose={() => setPicking(false)} onPick={addWidget} />
    </>
  );
}
