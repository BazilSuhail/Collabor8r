// feat(pages/dashboard/DashboardPage): give the signed-in user a home view of their open work, time, goals and recent project activity.
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ActivityList from "../../components/activity/ActivityList.jsx";
import { ProjectIssueSideModal } from "../../components/issues/IssueSideModal.jsx"; // CONTRACT-GAP: IssueSideModal props assumed as { open, onClose, projectId, issueId }
import IssueKpis from "../../components/issues/IssueKpis.jsx";
import IssueList from "../../components/issues/IssueList.jsx";
import PageHead from "../../components/layout/PageHead.jsx";
import NotificationList from "../../components/notifications/NotificationList.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { listActivity } from "../../libs/api/projects.js";
import { listNotifications, markRead } from "../../libs/api/notifications.js";
import { myIssues, myWorklogs } from "../../libs/api/myWork.js";
import { listGoals } from "../../libs/api/reports.js";
import { cn } from "../../utils/cn.js";
import { formatDuration } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, tileRise, useEntry, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";

const VIEW = "dashboard";
const DAY_MS = 86400000;
const idOf = (item) => item?.id ?? item?._id ?? null;

function storedProjectId() {
  try {
    return window.localStorage.getItem("c8r.project");
  } catch {
    return null;
  }
}

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const startOfWeek = (date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(day, -((day.getDay() + 6) % 7));
};

function Panel({ title, sub, className, children }) {
  const id = `db-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section className={cn("card p-[18px] grid gap-[12px] content-start", className)} aria-labelledby={id}>
      <header className="card__head min-h-[32px]">
        <h2 className="card__title" id={id}>
          {title}
        </h2>
        {sub ? <span className="card__sub">{sub}</span> : null}
      </header>
      {children}
    </section>
  );
}

// Seven bars, Monday to Sunday, scaled to the busiest day.
function TimeCard({ days, status, onRetry }) {
  const barsRef = useRef(null);
  useEntry(
    barsRef,
    ({ gsap, q, reduced }) => {
      const d = (n) => (reduced ? 0 : n);
      gsap.fromTo(
        q(".bars__bar"),
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: "50% 100%", duration: d(0.9), ease: "power3.out", stagger: d(0.035), clearProps: "transform" },
      );
    },
    [status],
  );

  if (status === "loading") return <Skeleton variant="feed" count={3} />;
  if (status === "error") return <EmptyState tone="error" title="Could not load your time" onRetry={onRetry} />;

  const max = Math.max(1, ...days.map((d) => d.seconds));
  const total = days.reduce((sum, d) => sum + d.seconds, 0);
  return (
    <div className="grid gap-[10px]">
      <p className="text-muted text-[12.5px] font-semibold">Logged {formatDuration(total)} this week</p>
      <div className="bars h-[180px]" role="list" aria-label="Time logged per day this week" ref={barsRef}>
        {days.map((d) => (
          <div className="bars__col" role="listitem" key={d.label} aria-label={`${d.label}: ${formatDuration(d.seconds)}`}>
            <div className="bars__track">
              <span className="bars__bar bars__bar--iris" style={{ height: `${(d.seconds / max) * 100}%`, transformOrigin: "50% 100%" }} />
            </div>
            <span className="bars__lab">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Meters for the first goals of the current project. Fills grow from the left (F.12).
function GoalsCard({ goals, status, onRetry }) {
  const listRef = useRef(null);
  useEntry(
    listRef,
    ({ gsap, q, reduced }) => {
      gsap.fromTo(
        q("[data-fill]"),
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: "left", duration: reduced ? 0 : 0.9, ease: "power3.out", clearProps: "transform" },
      );
    },
    [status],
  );

  if (status === "loading") return <Skeleton variant="feed" count={2} />;
  if (status === "error") return <EmptyState tone="error" title="Could not load goals" onRetry={onRetry} />;
  if (!goals.length) return <EmptyState icon="goal" title="No goals yet" text="Goals for this project show their progress here." />;

  return (
    <ul className="grid gap-[14px] list-none m-0 p-0" ref={listRef}>
      {goals.slice(0, 4).map((g) => {
        const target = Number(g.target) || 0;
        const pct = target ? Math.min(100, ((Number(g.current) || 0) / target) * 100) : 0;
        return (
          <li key={idOf(g)} className="grid gap-[6px]" data-key={idOf(g)}>
            <div className="flex items-center justify-between gap-[10px]">
              <b className="font-bold whitespace-nowrap text-ellipsis overflow-hidden">{g.name ?? "Goal"}</b>
              <span className="tnum text-muted text-[12.5px] font-semibold">
                {g.current ?? 0} / {g.target ?? 0}
              </span>
            </div>
            <div className="meter">
              <span className="meter__fill meter__fill--spruce block h-full" data-fill="" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { openCreateIssue, refreshUnread } = useShell();
  const [pid] = useState(storedProjectId);
  const [openIssue, setOpenIssue] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 7);
  const weekKey = weekStart.getTime();

  const issues = useResource(() => myIssues({ limit: 50 }), []);
  const worklogs = useResource(
    () =>
      myWorklogs({
        limit: 100,
        from: weekStart.toISOString(),
        to: addDays(weekStart, 6).toISOString(),
      }),
    [weekKey],
  );
  const notifications = useResource(() => listNotifications({ unread: true, limit: 5 }), []);
  const activity = useResource(
    () => (pid ? listActivity(pid, { limit: 8 }) : Promise.resolve({ data: [] })),
    [pid],
  );
  const goals = useResource(
    () => (pid ? listGoals(pid, { limit: 10 }) : Promise.resolve({ data: [] })),
    [pid],
  );

  const ready = issues.status === "success";
  useViewEntry(
    VIEW,
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      tileRise(q("[data-kpi]"), { stagger: 0.06 });
      cardRise(q("section.card"), { y: 22, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const list = issues.data ?? [];
  const open = list.filter((i) => i.statusCategory !== "done");
  const dueThisWeek = open.filter((i) => {
    const d = localDay(i.dueDate);
    return d && d >= todayStart && d < weekEnd;
  }).length;
  const overdue = open.filter((i) => {
    const d = localDay(i.dueDate);
    return d && d < todayStart;
  }).length;
  const loggedSeconds = (worklogs.data ?? []).reduce((sum, w) => sum + (w.seconds ?? 0), 0);

  const kpiStatus =
    issues.status === "error" ? "error" : issues.status === "loading" || worklogs.status === "loading" ? "loading" : "success";
  const kpiItems = [
    { id: "open", label: "Assigned open", value: open.length, icon: "task", tone: "iris" },
    { id: "due", label: "Due this week", value: dueThisWeek, icon: "calendar", tone: "saffron" },
    { id: "overdue", label: "Overdue", value: overdue, icon: "alert", tone: overdue ? "ember" : "plain" },
    {
      id: "logged",
      label: "Logged this week",
      value: worklogs.status === "error" ? "Unavailable" : formatDuration(loggedSeconds),
      icon: "time",
      tone: "spruce",
    },
  ];

  const dueSoon = open
    .filter((i) => i.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  const days = Array.from({ length: 7 }, (_, i) => ({
    label: addDays(weekStart, i).toLocaleDateString("en-US", { weekday: "short" }),
    seconds: 0,
  }));
  for (const w of worklogs.data ?? []) {
    const d = localDay(w.date);
    if (!d) continue;
    const index = Math.round((d - weekStart) / DAY_MS);
    if (index >= 0 && index < 7) days[index].seconds += w.seconds ?? 0;
  }

  const markOne = async (id) => {
    setBusyId(id);
    try {
      await markRead(id);
      notifications.reload();
      refreshUnread();
    } catch {
      // The API client already reports failures.
    } finally {
      setBusyId(null);
    }
  };

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <>
      <PageHead
        title={`Hello, ${firstName}`}
        sub="Your open work, time this week and recent project activity."
        actions={
          <Button variant="ember" icon="plus" magnetic onClick={() => openCreateIssue(pid ? { projectId: pid } : {})}>
            New issue
          </Button>
        }
      />

      <IssueKpis items={kpiItems} status={kpiStatus} onRetry={issues.reload} />

      <div className="grid gap-[var(--gap)] mt-[var(--gap)] grid-cols-[repeat(2,minmax(0,1fr))] w1000:grid-cols-[minmax(0,1fr)]">
        <Panel title="Due soon" sub="Open issues by due date">
          <IssueList
            issues={dueSoon}
            status={issues.status}
            error={issues.error}
            onRetry={issues.reload}
            onOpen={(issue) => setOpenIssue({ id: idOf(issue), projectId: issue.projectId })}
            compact
            empty={{ icon: "calendar", title: "Nothing due soon", text: "Issues with a due date show up here." }}
          />
        </Panel>

        <Panel title="My time this week" sub="Hours per day">
          <TimeCard days={days} status={worklogs.status} onRetry={worklogs.reload} />
        </Panel>

        <Panel title="Goals" sub="Current project">
          {!pid ? (
            <EmptyState icon="project" title="Pick a project" text="Goals belong to a project." action={<Button as={Link} to="/projects" variant="soft" size="sm">Choose a project</Button>} />
          ) : (
            <GoalsCard goals={goals.data ?? []} status={goals.status} onRetry={goals.reload} />
          )}
        </Panel>

        <Panel title="Notifications" sub="Unread">
          {notifications.status === "loading" ? <Skeleton variant="feed" count={3} /> : null}
          {notifications.status === "error" ? (
            <EmptyState tone="error" title="Could not load notifications" onRetry={notifications.reload} />
          ) : null}
          {notifications.status === "success" && !(notifications.data ?? []).length ? (
            <EmptyState icon="bellOff" title="You are all caught up" />
          ) : null}
          {notifications.status === "success" && (notifications.data ?? []).length ? (
            <NotificationList items={notifications.data} onRead={markOne} busyId={busyId} />
          ) : null}
        </Panel>

        <Panel title="Recent activity" sub={pid ? "Current project" : undefined} className="col-span-full">
          {!pid ? (
            <EmptyState icon="project" title="Pick a project" text="Activity is shown for the project you last used." action={<Button as={Link} to="/projects" variant="soft" size="sm">Choose a project</Button>} />
          ) : null}
          {pid && activity.status === "loading" ? <Skeleton variant="feed" count={4} /> : null}
          {pid && activity.status === "error" ? (
            <EmptyState tone="error" title="Could not load activity" onRetry={activity.reload} />
          ) : null}
          {pid && activity.status === "success" && !(activity.data ?? []).length ? (
            <EmptyState icon="history" title="No activity yet" />
          ) : null}
          {pid && activity.status === "success" && (activity.data ?? []).length ? (
            <ActivityList items={activity.data} />
          ) : null}
        </Panel>
      </div>

      {openIssue ? (
        <ProjectIssueSideModal open onClose={() => setOpenIssue(null)} projectId={openIssue.projectId} issueId={openIssue.id} />
      ) : null}
    </>
  );
}
