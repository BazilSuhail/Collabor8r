// feat(pages/reports/ReportsPage): chart a project's flow, velocity, burndown, time spent and workload from the report endpoints.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import KpiCard from "../../components/reports/KpiCard.jsx";
import ReportCard from "../../components/reports/ReportCard.jsx";
import LineChart from "../../components/reports/LineChart.jsx";
import BarChart from "../../components/reports/BarChart.jsx";
import DonutChart from "../../components/reports/DonutChart.jsx";
import Heatmap from "../../components/reports/Heatmap.jsx";
import HBars from "../../components/reports/HBars.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useResource } from "../../utils/useResource.js";
import { formatNumber } from "../../utils/format.js";
import { cardRise, fadeUp, bindLift, useViewEntry } from "../../utils/motion.js";
import {
  summary,
  createdVsResolved,
  velocity,
  burndown,
  timeSpent,
  workload,
} from "../../libs/api/reports.js";
import { listSprints } from "../../libs/api/boards.js";

const DAY = 864e5;
const RANGE_DAYS = 90;
const keyOf = (row) => row.id ?? row._id;
const shortDay = (s) =>
  new Date(`${String(s).slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
const none = () => Promise.resolve({ data: null, meta: null });

export default function ReportsPage() {
  const { projectId } = useProject();
  const range = useMemo(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - (RANGE_DAYS - 1) * DAY).toISOString(), to: to.toISOString() };
  }, [projectId]);

  const summaryRes = useResource(() => summary(projectId), [projectId]);
  const flowRes = useResource(() => createdVsResolved(projectId, range), [projectId]);
  const timeRes = useResource(() => timeSpent(projectId, range), [projectId]);
  const velocityRes = useResource(() => velocity(projectId), [projectId]);
  const workloadRes = useResource(() => workload(projectId), [projectId]);
  const sprintRes = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);

  const sprints = sprintRes.data ?? [];
  const [pickedSprint, setPickedSprint] = useState(null);
  const defaultSprint = sprints.find((s) => s.state === "active") ?? sprints[0] ?? null;
  const sprintId = pickedSprint ?? (defaultSprint ? keyOf(defaultSprint) : null);
  const burnRes = useResource(() => (sprintId ? burndown(projectId, sprintId) : none()), [projectId, sprintId]);

  const ready = summaryRes.status === "success";
  useViewEntry(
    "reports",
    ({ q, root }) => {
      if (!ready) return undefined;
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const totals = summaryRes.data ?? { created: 0, resolved: 0, byType: {} };
  const flow = flowRes.data ?? [];
  const timeRows = timeRes.data ?? [];
  const hoursTotal = timeRows.reduce((n, r) => n + (r.hours ?? 0), 0);
  const openCount = Math.max(0, totals.created - totals.resolved);
  const velocityData = velocityRes.data ?? { sprints: [], average: 0 };
  const burn = burnRes.data;
  const typeParts = Object.entries(totals.byType ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  const typeTotal = typeParts.reduce((n, p) => n + p.value, 0);
  const workRows = workloadRes.data ?? [];

  const stats = ready
    ? [
        { label: "Created", value: formatNumber(totals.created), icon: "plus" },
        { label: "Resolved", value: formatNumber(totals.resolved), icon: "check" },
        { label: "Hours, 90 days", value: formatNumber(Math.round(hoursTotal)), icon: "time" },
      ]
    : undefined;

  return (
    <>
      <PageHead
        title="Reports"
        sub="Flow, velocity, burndown, time and workload for this project."
        stats={stats}
        actions={
          <Button as={Link} to={`/p/${projectId}/dashboards`} variant="soft" icon="dashboard">
            Dashboards
          </Button>
        }
      />

      {summaryRes.status === "loading" && <Skeleton variant="kpi" count={4} cols={4} />}
      {summaryRes.status === "error" && (
        <div className="card">
          <EmptyState tone="error" title="Could not load the summary" onRetry={summaryRes.reload} />
        </div>
      )}
      {ready && (
        <div className="grid grid-cols-2 gap-[var(--gap)] mb-[var(--gap)] w560:gap-[10px]">
          <KpiCard tone="ember" icon="plus" label="Created" value={totals.created} format={(v) => formatNumber(Math.round(v))} foot="All time" />
          <KpiCard tone="spruce" icon="check" label="Resolved" value={totals.resolved} format={(v) => formatNumber(Math.round(v))} foot="All time" />
          <KpiCard tone="iris" icon="list" label="Open" value={openCount} format={(v) => formatNumber(Math.round(v))} foot="Created minus resolved" />
          <KpiCard tone="saffron" icon="time" label="Hours logged" value={Math.round(hoursTotal * 10) / 10} format={(v) => v.toFixed(1)} foot="Last 90 days" />
        </div>
      )}

      <div className="grid grid-cols-12 gap-[var(--gap)] w1100:grid-cols-[minmax(0,1fr)]">
        <ReportCard
          id="rp-flow"
          className="col-span-8 w1100:col-span-full"
          title="Created vs resolved"
          sub="Last 90 days"
          status={flowRes.status}
          error={flowRes.error}
          onRetry={flowRes.reload}
          empty={flow.length === 0}
          emptyText="Items show up here once they are created or resolved."
        >
          <LineChart
            label="Created and resolved items per day"
            labels={flow.map((r) => shortDay(r.date))}
            series={[
              { name: "Created", tone: "ember", values: flow.map((r) => r.created ?? 0) },
              { name: "Resolved", tone: "spruce", values: flow.map((r) => r.resolved ?? 0) },
            ]}
          />
        </ReportCard>

        <ReportCard
          id="rp-velocity"
          className="col-span-4 w1100:col-span-full"
          title="Velocity"
          sub={`Average ${velocityData.average} points per sprint`}
          status={velocityRes.status}
          error={velocityRes.error}
          onRetry={velocityRes.reload}
          empty={velocityData.sprints.length === 0}
          emptyText="Close a sprint to see its velocity."
        >
          <BarChart
            label="Points finished per closed sprint"
            labels={velocityData.sprints.map((s) => s.name)}
            values={velocityData.sprints.map((s) => s.velocity)}
            tone="ember"
          />
        </ReportCard>

        <ReportCard
          id="rp-burndown"
          className="col-span-8 w1100:col-span-full"
          title="Burndown"
          sub={sprints.find((s) => keyOf(s) === sprintId)?.name}
          status={sprintRes.status === "success" ? burnRes.status : sprintRes.status}
          error={burnRes.error ?? sprintRes.error}
          onRetry={burnRes.reload}
          empty={sprints.length === 0 || !burn || (burn.points ?? []).length === 0}
          emptyTitle={sprints.length === 0 ? "No sprints yet" : "Nothing to chart"}
          emptyText={sprints.length === 0 ? "Create a sprint on the board to see its burndown." : "This sprint has no dates yet."}
          tools={
            sprints.length > 0 && (
              <Select
                label="Sprint"
                hideLabel
                size="sm"
                value={sprintId}
                onChange={(v) => setPickedSprint(v)}
                options={sprints.map((s) => ({ value: keyOf(s), label: s.name }))}
              />
            )
          }
        >
          {burn && (
            <LineChart
              label="Remaining points against the ideal line"
              labels={burn.points.map((p) => shortDay(p.date))}
              series={[
                { name: "Remaining", tone: "ember", values: burn.points.map((p) => p.remaining) },
                { name: "Ideal", tone: "muted", values: burn.points.map((p) => p.ideal), dashed: true },
              ]}
            />
          )}
        </ReportCard>

        <ReportCard
          id="rp-activity"
          className="col-span-4 w1100:col-span-full"
          title="Activity"
          sub="Items created per day, 13 weeks"
          status={flowRes.status}
          error={flowRes.error}
          onRetry={flowRes.reload}
          empty={flow.every((r) => !r.created)}
          emptyText="No items were created in this window."
        >
          <Heatmap label="Items created per day" days={flow.map((r) => ({ date: r.date, value: r.created ?? 0 }))} />
        </ReportCard>

        <ReportCard
          id="rp-time"
          className="col-span-6 w1100:col-span-full"
          title="Time spent"
          sub={`${formatNumber(Math.round(hoursTotal * 10) / 10)} hours in the last 90 days`}
          status={timeRes.status}
          error={timeRes.error}
          onRetry={timeRes.reload}
          empty={timeRows.every((r) => !r.hours)}
          emptyText="No time has been logged in this window."
        >
          <LineChart
            label="Hours logged per day"
            labels={timeRows.map((r) => shortDay(r.date))}
            series={[{ name: "Hours", tone: "iris", values: timeRows.map((r) => r.hours ?? 0) }]}
            format={(v) => v.toFixed(1)}
          />
        </ReportCard>

        <ReportCard
          id="rp-mix"
          className="col-span-6 w1100:col-span-full"
          title="Items by type"
          sub={`${formatNumber(typeTotal)} items`}
          status={summaryRes.status}
          error={summaryRes.error}
          onRetry={summaryRes.reload}
          empty={typeParts.length === 0}
          emptyText="Items show up here once they exist."
        >
          <DonutChart
            label="Items by type"
            parts={typeParts}
            centerValue={formatNumber(typeTotal)}
            centerLabel="items"
          />
        </ReportCard>

        <ReportCard
          id="rp-workload"
          className="col-span-12"
          title="Workload"
          sub="Open items per assignee"
          status={workloadRes.status}
          error={workloadRes.error}
          onRetry={workloadRes.reload}
          empty={workRows.length === 0}
          emptyText="Nobody has open items assigned."
        >
          <HBars
            label="Open items per assignee"
            rows={workRows.map((w) => ({
              key: String(w.userId),
              label: w.name,
              value: w.openItems ?? 0,
              valueText: `${w.openItems ?? 0} open`,
              tone: "iris",
            }))}
          />
        </ReportCard>
      </div>
    </>
  );
}
