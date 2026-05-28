// feat(pages/calendar/CalendarPage): show the user's issue due dates and the current project's sprints and releases on a month calendar.
import { useMemo, useRef, useState } from "react";
import { ProjectIssueSideModal } from "../../components/issues/IssueSideModal.jsx"; // CONTRACT-GAP: IssueSideModal props assumed as { open, onClose, projectId, issueId }
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { listReleases, listSprints } from "../../libs/api/boards.js";
import { myIssues } from "../../libs/api/myWork.js";
import { cn } from "../../utils/cn.js";
import { bindLift, cardRise, fadeUp, popIn, useEntry, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import AgendaList from "./components/AgendaList.jsx";
import MonthGrid, { KIND, dayKey } from "./components/MonthGrid.jsx";

const VIEW = "calendar";
const PAGE_LIMIT = 100;
// Review workaround (K.7): the API has no due-date range filter, so the calendar reads at most
// five pages of 100 issues and filters by dueDate on the client.
const MAX_ISSUE_PAGES = 5;
const idOf = (item) => item?.id ?? item?._id ?? null;

async function loadDueIssues() {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await myIssues({ limit: PAGE_LIMIT, ...(cursor ? { cursor } : {}) });
    items.push(...(res.data ?? []));
    cursor = res.meta?.nextCursor ?? null;
    pages += 1;
  } while (cursor && pages < MAX_ISSUE_PAGES);
  return { data: items, meta: { capped: Boolean(cursor) } };
}

async function loadProjectPlan(pid) {
  if (!pid) return { data: { sprints: [], releases: [] } };
  const [sprints, releases] = await Promise.all([
    listSprints(pid, { limit: 100 }),
    listReleases(pid, { limit: 100 }),
  ]);
  return { data: { sprints: sprints.data ?? [], releases: releases.data ?? [] } };
}

function storedProjectId() {
  try {
    return window.localStorage.getItem("c8r.project");
  } catch {
    return null;
  }
}

// Local midnight of an ISO value, or null when it is missing or invalid.
function localDay(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const sameMonth = (date, month) =>
  date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Builds the month's events: issues by dueDate, sprint start and end days, release days.
function buildEvents({ issues, sprints, releases, month, todayKey }) {
  const byDay = new Map();
  const add = (ev) => {
    const list = byDay.get(ev.day) ?? [];
    list.push(ev);
    byDay.set(ev.day, list);
  };

  for (const issue of issues) {
    const due = localDay(issue.dueDate);
    if (!due || !sameMonth(due, month)) continue;
    const day = dayKey(due);
    const done = issue.statusCategory === "done";
    const kind = !done && day < todayKey ? "overdue" : "issue";
    add({
      id: `issue-${idOf(issue)}`,
      day,
      kind,
      tone: KIND[kind].tone,
      title: issue.summary ?? issue.title ?? issue.key,
      key: issue.key,
      done,
      issueRef: { id: idOf(issue), projectId: issue.projectId },
    });
  }

  for (const sprint of sprints) {
    const name = sprint.name ?? "Sprint";
    const start = localDay(sprint.startDate);
    const end = localDay(sprint.endDate);
    if (start && sameMonth(start, month)) {
      add({ id: `sprint-start-${idOf(sprint)}`, day: dayKey(start), kind: "sprint", tone: KIND.sprint.tone, title: `${name} starts` });
    }
    if (end && sameMonth(end, month)) {
      add({ id: `sprint-end-${idOf(sprint)}`, day: dayKey(end), kind: "sprint", tone: KIND.sprint.tone, title: `${name} ends` });
    }
  }

  for (const release of releases) {
    const day = localDay(release.releaseDate);
    if (!day || !sameMonth(day, month)) continue;
    add({
      id: `release-${idOf(release)}`,
      day: dayKey(day),
      kind: "release",
      tone: KIND.release.tone,
      title: release.name ?? "Release",
    });
  }

  const counts = { issue: 0, overdue: 0, sprint: 0, release: 0 };
  for (const list of byDay.values()) for (const ev of list) counts[ev.kind] += 1;
  const days = Array.from(byDay.keys())
    .sort()
    .map((key) => ({ key, date: parseKey(key), events: byDay.get(key) }));
  return { byDay, days, counts };
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-[6px]" aria-busy="true">
      <span className="sr">Loading</span>
      {Array.from({ length: 35 }, (_, i) => (
        <span key={i} className="block h-[88px] rounded-[14px] bg-well animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const { openCreateIssue } = useShell();
  const [pid] = useState(storedProjectId);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState("month");
  const [openIssue, setOpenIssue] = useState(null);
  const gridRef = useRef(null);

  const issues = useResource(loadDueIssues, []);
  const plan = useResource(() => loadProjectPlan(pid), [pid]);

  const now = new Date();
  const todayKey = dayKey(now);
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const ready = issues.status === "success";

  const model = useMemo(
    () =>
      buildEvents({
        issues: issues.data ?? [],
        sprints: plan.data?.sprints ?? [],
        releases: plan.data?.releases ?? [],
        month,
        todayKey,
      }),
    [issues.data, plan.data, month, todayKey],
  );

  useViewEntry(
    VIEW,
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  // F.13: chips pop in after the month or view changes.
  useEntry(
    gridRef,
    ({ root }) => {
      popIn(root.querySelectorAll(".cal-ev"), { from: 0.7, stagger: 0.012 });
    },
    [monthKey, view, ready],
  );

  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const goToday = () => {
    const n = new Date();
    setMonth(new Date(n.getFullYear(), n.getMonth(), 1));
  };
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const actions = (
    <>
      <SegmentedControl
        label="Calendar view"
        value={view}
        onChange={setView}
        options={[
          { value: "month", label: "Month" },
          { value: "agenda", label: "Agenda" },
        ]}
      />
      <div className="flex items-center gap-[6px]">
        <Button variant="ghost" iconOnly icon="chevL" aria-label="Previous month" onClick={() => shift(-1)} />
        <Button variant="ghost" size="sm" onClick={goToday}>
          Today
        </Button>
        <Button variant="ghost" iconOnly icon="chevR" aria-label="Next month" onClick={() => shift(1)} />
      </div>
      <Button variant="ember" icon="plus" magnetic onClick={() => openCreateIssue({})}>
        New issue
      </Button>
    </>
  );

  return (
    <>
      <PageHead
        title="Calendar"
        sub="Showing your issues. Sprints and releases come from the current project."
        actions={actions}
      />

      <section className="card p-[18px] w760:p-[14px_10px]" aria-labelledby="cal-period">
        <header className="flex flex-wrap items-center justify-between gap-[10px_16px] mb-[16px]">
          <h2 className="[font:600_22px_var(--display)] tracking-[-0.02em] whitespace-nowrap" id="cal-period" aria-live="polite">
            {monthLabel}
          </h2>
          <div className="flex flex-wrap gap-[6px]" role="group" aria-label="Event types">
            {Object.entries(KIND).map(([kind, meta]) => (
              <span key={kind} className={cn("chip", `cal-key cal-key--${meta.tone}`)}>
                <i aria-hidden="true" className="w-[9px] h-[9px] rounded-full bg-[color:var(--k)]" />
                {meta.label}
                <b className="tnum text-center min-w-[14px] text-[11.5px] text-muted">{model.counts[kind] ?? 0}</b>
              </span>
            ))}
          </div>
        </header>

        {issues.status === "success" && issues.meta?.capped ? (
          <p className="mb-[12px] text-muted text-[12.5px] font-semibold">
            Showing the first {PAGE_LIMIT * MAX_ISSUE_PAGES} of your issues. Some due dates may be missing.
          </p>
        ) : null}
        {plan.status === "error" ? (
          <p role="alert" className="mb-[12px] text-bad text-[13px] font-semibold">
            Could not load sprints and releases for this project.
          </p>
        ) : null}

        {issues.status === "loading" ? <LoadingGrid /> : null}
        {issues.status === "error" ? (
          <EmptyState tone="error" title="Could not load your issues" onRetry={issues.reload} />
        ) : null}

        {ready && view === "month" ? (
          <MonthGrid
            month={month}
            events={model.byDay}
            todayKey={todayKey}
            onOpen={(ev) => setOpenIssue(ev.issueRef)}
            gridRef={gridRef}
            label={monthLabel}
          />
        ) : null}
        {ready && view === "agenda" ? (
          <div ref={gridRef}>
            <AgendaList
              days={model.days}
              todayKey={todayKey}
              onOpen={(ev) => setOpenIssue(ev.issueRef)}
            />
          </div>
        ) : null}
      </section>

      {openIssue ? (
        <ProjectIssueSideModal
          open
          onClose={() => setOpenIssue(null)}
          projectId={openIssue.projectId}
          issueId={openIssue.id}
        />
      ) : null}
    </>
  );
}
