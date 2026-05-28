// feat(pages/notifications/NotificationsPage): list all notifications with unread filtering and mark them read one by one or all at once.
import { useRef, useState } from "react";
import { listNotifications, markAllRead, markRead } from "../../libs/api/notifications.js";
import { listOrgProjects, listPersonalProjects } from "../../libs/api/projects.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { useShell } from "../../context/ShellContext.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { useViewEntry, useEntry, fadeUp } from "../../utils/motion.js";
import { relativeTime } from "../../utils/format.js";
import { emptyCopy } from "../../metadata/empty.js";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Select from "../../components/ui/Select.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

const idOf = (x) => String(x.id ?? x._id);

export default function NotificationsPage() {
  const { refreshUnread } = useShell();
  const { orgId } = useOrg();
  const [filter, setFilter] = useState("all");
  const [projectId, setProjectId] = useState("");
  const listRef = useRef(null);

  const projects = useResource(
    async () => {
      const personal = await listPersonalProjects();
      const org = orgId ? await listOrgProjects(orgId) : null;
      return { data: [...(personal.data ?? []), ...(org?.data ?? [])], meta: null };
    },
    [orgId],
  );

  const params = {
    unread: filter === "unread" ? true : undefined,
    projectId: projectId || undefined,
  };
  const list = usePaged((p) => listNotifications(p), params);

  const single = useMutation(markRead, { error: "Could not mark that notification as read." });
  const all = useMutation(markAllRead, {
    success: "All caught up",
    error: "Could not mark everything as read.",
  });

  useViewEntry(
    "notifications",
    ({ q }) => {
      fadeUp(q("[data-enter]"), { y: 14, stagger: 0.06 });
    },
    [],
  );

  useEntry(
    listRef,
    ({ q }) => {
      fadeUp(q("[data-key]").slice(0, 14), { y: 10, stagger: 0.035, delay: 0.14 });
    },
    [list.status === "success"],
  );

  const readOne = async (n) => {
    const res = await single.run(idOf(n));
    if (res === undefined) return;
    refreshUnread();
    list.setItems((prev) =>
      filter === "unread"
        ? prev.filter((x) => idOf(x) !== idOf(n))
        : prev.map((x) => (idOf(x) === idOf(n) ?{ ...x, readAt: x.readAt ?? new Date().toISOString() } : x)),
    );
  };

  const readAll = async () => {
    const res = await all.run(projectId ? { projectId } : {});
    if (res === undefined) return;
    refreshUnread();
    list.reload();
  };

  const items = list.items;
  const empty = filter === "unread"
    ? { icon: "bellOff", title: "You're all caught up", text: "No unread notifications right now." }
    : emptyCopy("notifications");

  const projectOptions = [
    { value: "", label: "All projects" },
    ...(projects.data ?? []).map((p) => ({ value: idOf(p), label: p.name ?? p.key ?? "Project" })),
  ];

  return (
    <>
      <PageHead
        title="Notifications"
        sub="Mentions, assignments and updates from your projects."
        actions={
          <Button variant="soft" icon="readAll" onClick={readAll} loading={all.pending} disabled={!items.length}>
            Mark all read
          </Button>
        }
      />

      <div className="toolbar mb-[16px] flex flex-wrap items-center gap-[10px]" data-enter>
        <SegmentedControl label="Filter notifications" value={filter} onChange={setFilter} options={FILTERS} />
        <span className="toolbar__spacer flex-1" />
        <Select
          variant="button"
          label="Project"
          hideLabel
          value={projectId}
          onChange={setProjectId}
          options={projectOptions}
          placeholder="All projects"
        />
      </div>

      <section className="card p-[20px]" data-enter aria-live="polite">
        {list.status === "loading" ? (
          <div aria-busy="true">
            <Skeleton variant="feed" count={6} />
          </div>
        ) : null}

        {list.status === "error" ? (
          <EmptyState tone="error" title="Notifications did not load" text={list.error?.message} onRetry={list.reload} />
        ) : null}

        {list.status === "success" && !items.length ? (
          <div className="grid justify-items-center gap-[12px]">
            <Illustration name="empty" alt="" className="w-[160px] w1000:hidden" />
            <EmptyState {...empty} />
          </div>
        ) : null}

        {list.status === "success" && items.length ? (
          <>
            <ul ref={listRef} className="grid">
              {items.map((n) => {
                const unread = !n.readAt;
                return (
                  <li
                    key={idOf(n)}
                    data-key={idOf(n)}
                    className="flex items-start gap-[14px] py-[14px] not-first:border-t not-first:border-line"
                  >
                    <span className="grid place-items-center size-[40px] flex-none rounded-[12px] bg-well text-text">
                      <Icon name="bell" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`flex items-center gap-[8px] text-text ${unread ? "font-bold" : "font-semibold"}`}>
                        {unread ? (
                          <span aria-label="Unread" className="size-[8px] flex-none rounded-[50%] bg-ember" />
                        ) : null}
                        <span className="truncate">{n.title ?? "Notification"}</span>
                      </p>
                      {n.body ? <p className="text-muted text-[13.5px] mt-[2px]">{n.body}</p> : null}
                      <p className="text-faint text-[12.5px] mt-[4px]">{relativeTime(n.createdAt)}</p>
                    </div>
                    {unread ? (
                      <Button
                        iconOnly
                        variant="ghost"
                        size="sm"
                        icon="check"
                        aria-label="Mark as read"
                        onClick={() => readOne(n)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {list.hasMore ? (
              <div className="mt-[14px] flex justify-center">
                <Button variant="soft" size="sm" onClick={list.loadMore} loading={list.loadingMore}>
                  Show more
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </>
  );
}
