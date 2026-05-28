// feat(pages/projects/ProjectOverviewPage): summarize a project's status, active sprint, goals and recent activity on one screen.
import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { listSprints } from "../../libs/api/boards.js";
import { summary, listGoals } from "../../libs/api/reports.js";
import { listActivity } from "../../libs/api/projects.js";
import { paths } from "../../routes/paths.js";
import { emptyCopy } from "../../metadata/empty.js";
import { bindLift, cardRise, fadeUp, gsap, useViewEntry } from "../../utils/motion.js";
import { relativeTime } from "../../utils/format.js";
import { cn } from "../../utils/cn.js";
import { themePath } from "../../utils/media.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";

const KIND_TEXT = {
  issueCreated: "created an issue",
  issueUpdated: "updated an issue",
  statusChanged: "changed a status",
  commentAdded: "commented on",
  sprintStarted: "started a sprint",
  sprintClosed: "closed a sprint",
  memberAdded: "added a member",
  memberRemoved: "removed a member",
  releaseShipped: "shipped a release",
  pageUpdated: "updated a wiki page",
};

// Shows a card's own loading, error or empty state. Returns null when it has content to show.
function CardState({ status, error, onRetry, empty }) {
  if (status === "loading") return <Skeleton variant="feed" count={3} />;
  if (status === "error") {
    return <EmptyState tone="error" icon="alert" title="Could not load this section" text={error?.message} onRetry={onRetry} />;
  }
  if (empty) return <EmptyState icon={empty.icon} title={empty.title} text={empty.text} />;
  return null;
}

export default function ProjectOverviewPage() {
  const { projectId, project, status: projectStatus, statuses } = useProject();
  const ready = projectStatus === "success" && Boolean(project);
  const [failedThemeSrc, setFailedThemeSrc] = useState(null);

  const stats = useResource(() => summary(projectId), [projectId]);
  const goals = useResource(() => listGoals(projectId, { limit: 20 }), [projectId]);
  const sprint = useResource(() => listSprints(projectId, { state: "active", limit: 1 }), [projectId]);
  const activity = usePaged((p) => listActivity(projectId, p), { projectId });

  useViewEntry(
    "project-overview",
    ({ q, root }) => {
      if (!ready) return undefined;
      const tl = gsap.timeline();
      tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
      tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
      return bindLift(root);
    },
    [ready],
  );

  const labelOf = (key) => statuses.find((s) => s.id === key || s.name === key)?.name ?? key;
  const byStatus = stats.data?.byStatus ?? {};
  const statusTotal = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const activeSprint = (sprint.data ?? [])[0] ?? null;
  const goalList = goals.data ?? [];

  const themeSrc = themePath(project?.themeKey);
  const imageSrc = themeSrc && failedThemeSrc !== themeSrc ? themeSrc : null;
  const headline = project?.headline || project?.description || "";
  const resolvedCount = stats.data?.resolved ?? 0;
  const statTiles = [
    {
      key: "open",
      icon: "flag",
      label: "Open",
      value: stats.status === "success" ? Math.max(0, statusTotal - resolvedCount) : "-",
    },
    { key: "done", icon: "check", label: "Done", value: stats.status === "success" ? resolvedCount : "-" },
    { key: "created", icon: "chartLine", label: "Created", value: stats.status === "success" ? (stats.data?.created ?? 0) : "-" },
    {
      key: "sprint",
      icon: "clock",
      label: "Active sprint",
      value: sprint.status === "success" ? (activeSprint?.name ?? "None") : "-",
    },
  ];

  return (
    <>
      <div className="grid gap-[var(--gap)]">
        <section
          aria-busy={ready ? undefined : "true"}
          className={cn(
            "relative overflow-hidden rounded-card aspect-[4/1] w1000:aspect-auto w1000:h-[240px] min-h-[180px]",
            !ready && "bg-well animate-pulse motion-reduce:animate-none",
            ready && !imageSrc && "bg-gradient-to-br from-[color:var(--ember-soft)] to-[color:var(--iris-soft)]",
          )}
        >
          {ready && imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt=""
                onError={() => setFailedThemeSrc(themeSrc)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[color:var(--surface)] via-[color:var(--surface)]/60 to-transparent"
              />
            </>
          ) : null}
          {ready ? (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[12px] p-[20px]">
              <div className="min-w-0">
                {project?.key ? <Badge tone="iris">{project.key}</Badge> : null}
                <h1 className="mt-[8px] truncate [font:700_26px_var(--display)] text-text">{project?.name ?? "Overview"}</h1>
                {headline ? <p className="mt-[4px] line-clamp-2 text-[13.5px] text-muted">{headline}</p> : null}
              </div>
              <Button as={Link} to={paths.board(projectId)} variant="soft" size="sm" icon="kanban" className="shrink-0">
                Open board
              </Button>
            </div>
          ) : (
            <span className="sr">Loading</span>
          )}
        </section>

        <nav
          aria-label="Project sections"
          className="card flex items-center gap-[8px] p-[8px] overflow-x-auto w760:[scrollbar-width:none] w760:[&::-webkit-scrollbar]:hidden"
        >
          {[
            { label: "Board", icon: "kanban", to: paths.board(projectId) },
            { label: "Backlog", icon: "backlog", to: paths.backlog(projectId) },
            { label: "Sprints", icon: "sprint", to: paths.backlog(projectId) },
            { label: "Issues", icon: "task", to: paths.issues(projectId) },
            { label: "Releases", icon: "release", to: paths.releases(projectId) },
            { label: "Wiki", icon: "wiki", to: paths.wiki(projectId) },
            { label: "Reports", icon: "analytics", to: paths.reports(projectId) },
            { label: "Timesheet", icon: "timesheet", to: paths.timesheet(projectId) },
          ].map((item) => (
            <Button key={item.label} as={Link} to={item.to} variant="ghost" size="sm" icon={item.icon} className="shrink-0">
              {item.label}
            </Button>
          ))}
          <span className="flex-1" aria-hidden="true" />
          <Button as={Link} to={paths.projectSettings(projectId)} variant="soft" size="sm" icon="edit" className="shrink-0">
            Edit project
          </Button>
        </nav>

        {!ready ? (
          <section className="card p-[24px]">
            <Skeleton variant="kpi" count={3} />
          </section>
        ) : (
          <div className="grid gap-[var(--gap)]">
            <div className="grid grid-cols-2 gap-[10px] w1000:grid-cols-4">
              {statTiles.map((t) => (
                <div key={t.key} className="card p-[14px] min-w-0" data-stat={t.key} data-lift>
                  <div className="flex items-center gap-[6px] text-[12.5px] font-semibold text-muted">
                    <Icon name={t.icon} />
                    <span className="truncate">{t.label}</span>
                  </div>
                  <div className="mt-[6px] truncate tabular-nums [font:700_22px_var(--display)] text-text">{t.value}</div>
                </div>
              ))}
            </div>

          <div className="grid gap-[var(--gap)] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] w1100:grid-cols-[minmax(0,1fr)]">
            <div className="grid gap-[var(--gap)]">
              <section className="card p-[24px]">
                <h2 className="[font:600_18px_var(--display)] text-text">Status breakdown</h2>
                <div className="mt-[14px] grid gap-[12px]">
                  {stats.status !== "success" || statusTotal === 0 ? (
                    <CardState
                      status={stats.status}
                      error={stats.error}
                      onRetry={stats.reload}
                      empty={stats.status === "success" ? { icon: "chartLine", title: "No status data yet", text: emptyCopy("reports").text } : null}
                    />
                  ) : (
                    Object.entries(byStatus).map(([key, count]) => (
                      <div key={key} className="grid gap-[6px]">
                        <div className="flex items-center justify-between text-[13.5px]">
                          <span className="font-semibold text-text">{labelOf(key)}</span>
                          <span className="tabular-nums text-muted">{count}</span>
                        </div>
                        <div className="h-[8px] overflow-hidden rounded-full bg-well">
                          <div
                            className="h-full rounded-full bg-spruce"
                            style={{ width: `${Math.max(0, Math.min(100, (count / statusTotal) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="card p-[24px]">
                <h2 className="[font:600_18px_var(--display)] text-text">Goals</h2>
                <div className="mt-[14px] grid gap-[14px]">
                  <CardState
                    status={goals.status}
                    error={goals.error}
                    onRetry={goals.reload}
                    empty={goals.status === "success" && goalList.length === 0 ? emptyCopy("goals") : null}
                  />
                  {goals.status === "success"
                    ? goalList.map((g) => {
                        const pct = g.target ? Math.max(0, Math.min(100, (g.current / g.target) * 100)) : 0;
                        return (
                          <div key={g.id} className="grid gap-[6px]">
                            <div className="flex items-center justify-between gap-[10px] text-[13.5px]">
                              <span className="truncate font-semibold text-text">{g.name}</span>
                              <span className="shrink-0 tabular-nums text-muted">
                                {g.current ?? 0}/{g.target ?? 0} {g.unit ?? ""}
                              </span>
                            </div>
                            <div className="h-[8px] overflow-hidden rounded-full bg-well">
                              <div className="h-full rounded-full bg-iris" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    : null}
                </div>
              </section>
            </div>

            <section className="card p-[24px]">
              <h2 className="[font:600_18px_var(--display)] text-text">Recent activity</h2>
              <div className="mt-[14px]">
                <CardState
                  status={activity.status}
                  error={activity.error}
                  onRetry={activity.reload}
                  empty={activity.status === "success" && activity.items.length === 0 ? emptyCopy("project-overview") : null}
                />
                {activity.status === "success" && activity.items.length > 0 ? (
                  <ul className="grid gap-[14px]">
                    {activity.items.map((a) => (
                      <li key={a.id ?? a._id} className="flex items-start gap-[12px]">
                        <Avatar name={a.actorName} src={a.actorAvatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] text-text">
                            <span className="font-semibold">{a.actorName || "Someone"}</span>{" "}
                            {a.summary || KIND_TEXT[a.kind] || a.kind}
                            {a.itemKey ? <span className="text-muted"> {a.itemKey}</span> : null}
                            {a.itemTitle ? <span className="text-muted"> {a.itemTitle}</span> : null}
                          </p>
                          <p className="text-[12.5px] text-muted">{a.at ? relativeTime(a.at) : ""}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {activity.hasMore ? (
                  <div className="mt-[16px] flex justify-center">
                    <Button variant="soft" size="sm" loading={activity.loadingMore} onClick={activity.loadMore}>
                      Show more
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
