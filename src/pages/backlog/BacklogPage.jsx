// feat(pages/backlog/BacklogPage): plan sprints by ranking backlog issues and moving them into, starting and completing sprints.
import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import Fly from "../../components/pipeline/Fly.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Dropdown from "../../components/ui/Dropdown.jsx";
import SplitTitle from "../../components/SplitTitle.jsx";
// CONTRACT-GAP: SprintFormModal is owned by H07. Props assumed { open, onClose, projectId, boardId, sprint, onSaved }.
import SprintFormModal from "../../components/sprints/SprintFormModal.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteSprint, getBacklog, listBoards, listSprints, rankIssue, startSprint } from "../../libs/api/boards.js";
import { listIssues } from "../../libs/api/issues.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { formatDate } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, flip, gsap, prefersReduced, scaled, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import CompleteSprintModal from "./components/CompleteSprintModal.jsx";
import SprintPanel from "./components/SprintPanel.jsx";

const BACKLOG = "backlog";
const FLY_CLASS = "rounded-card border border-line bg-float shadow-[var(--shadow-pop)] overflow-hidden";
const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });
const stateOrder = (a, b) => (a.state === "active" ? 0 : 1) - (b.state === "active" ? 0 : 1);

const listOf = (data, panelId) => (panelId === BACKLOG ? data.backlog : (data.sprintIssues[panelId] ?? []));
const withList = (data, panelId, list) =>
  panelId === BACKLOG
    ? { ...data, backlog: list }
    : { ...data, sprintIssues: { ...data.sprintIssues, [panelId]: list } };
const panelOf = (data, id) => {
  if (data.backlog.some((i) => i.id === id)) return BACKLOG;
  return data.sprints.find((s) => (data.sprintIssues[s.id] ?? []).some((i) => i.id === id))?.id ?? null;
};

const sprintMeta = (sprint, count) => {
  const dates =
    sprint.startDate && sprint.endDate
      ? `${formatDate(sprint.startDate)} to ${formatDate(sprint.endDate)}`
      : "No dates set";
  return `${dates} · ${count} ${count === 1 ? "issue" : "issues"}`;
};

export default function BacklogPage() {
  const navigate = useNavigate();
  const { projectId, can } = useProject();
  const toast = useToast();
  const { openCreateIssue } = useShell();
  const canRank = can("issue.rank");
  const canSprint = can("sprint.manage");
  const containerRef = useRef(null);
  const liveRef = useRef(null);
  const dragRef = useRef(null);
  const listenersRef = useRef(null);
  const flyKey = useRef(0);
  const [overPanel, setOverPanel] = useState(null);
  const [flies, setFlies] = useState([]);
  const [sprintModal, setSprintModal] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [starting, setStarting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useResource(async () => {
    const [sprintRes, boardRes, backlogRes] = await Promise.all([
      listSprints(projectId, { limit: 100 }),
      listBoards(projectId),
      getBacklog(projectId, { limit: 100 }),
    ]);
    const open = (sprintRes.data ?? []).map(withId).filter((s) => s.state !== "closed").sort(stateOrder);
    const perSprint = await Promise.all(open.map((s) => listIssues(projectId, { sprint: s.id, limit: 100 })));
    const sprintIssues = {};
    open.forEach((s, i) => {
      sprintIssues[s.id] = (perSprint[i].data ?? []).map(withId);
    });
    const boards = (boardRes.data ?? []).map(withId);
    const defaultBoard = boards.find((b) => b.isDefault) ?? boards[0] ?? null;
    return {
      data: {
        sprints: open,
        sprintIssues,
        backlog: (backlogRes.data ?? []).map(withId).filter((i) => !i.sprintId),
        cursor: backlogRes.meta?.nextCursor ?? null,
        boardId: defaultBoard?.id ?? null,
      },
      meta: null,
    };
  }, [projectId]);

  // Handlers read the latest lists through this ref.
  const dataRef = useRef(null);
  dataRef.current = load.data;
  const data = load.data;
  const ready = load.status === "success";

  const addFly = (rect, face, cls, run) => {
    face.removeAttribute("data-lift");
    face.style.transform = "";
    const id = ++flyKey.current;
    setFlies((fs) => [...fs, { id, rect, face, cls, run }]);
  };
  const removeFly = (id) => setFlies((fs) => fs.filter((f) => f.id !== id));

  const announce = (message) => {
    if (liveRef.current) liveRef.current.textContent = message;
  };

  // Moves one issue to panel at index (counted among the other rows). Optimistic, then rank. Reverts on failure.
  const relocate = async (id, toPanel, index) => {
    const snapshot = dataRef.current;
    const fromPanel = snapshot ? panelOf(snapshot, id) : null;
    if (!fromPanel) return false;
    const item = listOf(snapshot, fromPanel).find((i) => i.id === id);
    const others = listOf(snapshot, toPanel).filter((i) => i.id !== id);
    const beforeId = others[index - 1]?.id ?? null;
    const afterId = others[index]?.id ?? null;
    const moving = fromPanel !== toPanel;
    const sprintId = toPanel === BACKLOG ? null : toPanel;
    const removed = withList(snapshot, fromPanel, listOf(snapshot, fromPanel).filter((i) => i.id !== id));
    const next = withList(removed, toPanel, [...others.slice(0, index), { ...item, sprintId }, ...others.slice(index)]);
    const container = containerRef.current;
    flip(container, () => flushSync(() => load.setData(next)));
    announce(`${item.key} moved`);
    try {
      await rankIssue(projectId, id, { beforeId, afterId, ...(moving ? { sprintId } : {}) });
      return true;
    } catch {
      load.setData(snapshot);
      toast.error(`Could not move ${item.key}`);
      return false;
    }
  };

  const relocateToEnd = (id, toPanel) => {
    const list = listOf(dataRef.current, toPanel).filter((i) => i.id !== id);
    return relocate(id, toPanel, list.length);
  };

  const onRowKey = (e, issue, panelId) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown") || !canRank) return;
    e.preventDefault();
    const list = listOf(dataRef.current, panelId);
    const idx = list.findIndex((i) => i.id === issue.id);
    const delta = e.key === "ArrowUp" ? -1 : 1;
    const to = idx + delta;
    if (idx < 0 || to < 0 || to > list.length - 1) return;
    relocate(issue.id, panelId, to).then(() =>
      requestAnimationFrame(() => containerRef.current?.querySelector(`[data-key="${issue.id}"] button`)?.focus()),
    );
  };

  const loadMore = async () => {
    const cursor = dataRef.current?.cursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getBacklog(projectId, { limit: 100, cursor });
      load.setData((d) => ({
        ...d,
        backlog: [...d.backlog, ...(res.data ?? []).map(withId).filter((i) => !i.sprintId)],
        cursor: res.meta?.nextCursor ?? null,
      }));
    } catch (err) {
      toast.error(err.message ?? "Could not load more issues");
    } finally {
      setLoadingMore(false);
    }
  };

  // Pointer drag between panels. The row becomes a Fly; the hovered panel takes the drop.
  const detachMove = () => {
    const l = listenersRef.current;
    if (!l) return;
    window.removeEventListener("pointermove", l.move);
    window.removeEventListener("pointerup", l.up);
    window.removeEventListener("pointercancel", l.cancel);
    window.removeEventListener("keydown", l.esc, true);
    listenersRef.current = null;
  };

  const hitPanel = (x, y) => {
    for (const el of containerRef.current?.querySelectorAll("[data-panel-id]") ?? []) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top - 4 && y <= r.bottom + 4) return el;
    }
    return null;
  };

  const indexIn = (panelEl, id, y) => {
    let index = 0;
    for (const row of panelEl.querySelectorAll("li[data-key]")) {
      if (row.dataset.key === id) continue;
      const r = row.getBoundingClientRect();
      if (y > r.top + r.height / 2) index += 1;
      else break;
    }
    return index;
  };

  const flyBack = (d) => {
    const finish = () => d.done();
    if (prefersReduced()) {
      finish();
      return;
    }
    gsap.to(d.fly, { x: d.rect.left, y: d.rect.top, scale: 1, rotation: 0, duration: scaled(0.5), ease: "back.out(1.4)", onComplete: finish });
  };

  const startDrag = (press, x, y) => {
    press.started = true;
    const rect = press.row.getBoundingClientRect();
    const origin = {
      panelId: press.panelId,
      index: listOf(dataRef.current, press.panelId).findIndex((i) => i.id === press.id),
    };
    press.row.style.opacity = "0.35";
    addFly(rect, press.row.cloneNode(true), FLY_CLASS, (fly, done) => {
      if (press.ended) {
        press.row.style.opacity = "";
        done();
        return;
      }
      dragRef.current = {
        id: press.id,
        key: press.issue.key,
        row: press.row,
        fly,
        done,
        rect,
        offX: x - rect.left,
        offY: y - rect.top,
        origin,
        target: null,
        x,
        y,
        qx: gsap.quickTo(fly, "x", { duration: scaled(0.16) || 1e-3, ease: "power3.out" }),
        qy: gsap.quickTo(fly, "y", { duration: scaled(0.16) || 1e-3, ease: "power3.out" }),
      };
      announce(`Picked up ${press.issue.key}. Drop it on a sprint or the backlog.`);
    });
  };

  const endDrag = async (cancel) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    setOverPanel(null);
    d.row.style.opacity = "";
    gsap.killTweensOf(d.fly, "x,y,rotation,scale");
    const t = cancel ? null : d.target;
    if (!t || (t.panelId === d.origin.panelId && t.index === d.origin.index)) {
      flyBack(d);
      return;
    }
    const panelEl = containerRef.current?.querySelector(`[data-panel-id="${t.panelId}"]`);
    if (panelEl && !prefersReduced()) {
      const r = panelEl.getBoundingClientRect();
      gsap.to(d.fly, { x: r.left + 12, y: r.top + 12, scale: 0.98, duration: scaled(0.35), ease: "power3.inOut" });
    }
    const ok = await relocate(d.id, t.panelId, t.index);
    if (ok) d.done();
    else flyBack(d);
  };

  const onHandleDown = (e, issue, panelId) => {
    if (e.button !== 0 || !canRank) return;
    const press = { id: issue.id, issue, panelId, row: e.currentTarget.closest("[data-key]"), pid: e.pointerId, x: e.clientX, y: e.clientY, started: false, ended: false };
    const move = (ev) => {
      if (ev.pointerId !== press.pid) return;
      if (!dragRef.current) {
        if (!press.started && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 5) startDrag(press, press.x, press.y);
        return;
      }
      const d = dragRef.current;
      d.x = ev.clientX;
      d.y = ev.clientY;
      d.qx(d.x - d.offX);
      d.qy(d.y - d.offY);
      const panelEl = hitPanel(d.x, d.y);
      d.target = panelEl ? { panelId: panelEl.dataset.panelId, index: indexIn(panelEl, d.id, d.y) } : null;
      setOverPanel(panelEl?.dataset.panelId ?? null);
    };
    const up = (ev) => {
      if (ev.pointerId !== press.pid) return;
      press.ended = true;
      detachMove();
      endDrag(false);
    };
    const cancel = () => {
      press.ended = true;
      detachMove();
      endDrag(true);
    };
    const esc = (ev) => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation();
      press.ended = true;
      detachMove();
      endDrag(true);
    };
    detachMove();
    listenersRef.current = { move, up, cancel, esc };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", esc, true);
  };

  useEffect(() => () => detachMove(), []);

  const menuFor = (issue, panelId) => {
    const items = [{ id: "open", label: "Open", icon: "external", onSelect: () => navigate(paths.issue(projectId, issue.key)) }];
    if (canRank) {
      items.push("separator");
      if (panelId !== BACKLOG) {
        items.push({ id: "to-backlog", label: "Move to backlog", icon: "backlog", onSelect: () => relocateToEnd(issue.id, BACKLOG) });
      }
      (data?.sprints ?? [])
        .filter((s) => s.id !== panelId)
        .forEach((s) =>
          items.push({ id: `to-${s.id}`, label: `Move to ${s.name}`, icon: "sprint", onSelect: () => relocateToEnd(issue.id, s.id) }),
        );
    }
    return items;
  };

  const rowProps = { pid: projectId, canRank, onHandleDown, onKeyMove: onRowKey, menuFor };

  const sprintActions = (sprint) => {
    if (!canSprint) return null;
    const items = [{ id: "edit", label: "Edit sprint", icon: "pen", onSelect: () => setSprintModal({ sprint }) }];
    if (sprint.state === "planned") items.push({ id: "start", label: "Start sprint", icon: "play", onSelect: () => setStarting(sprint) });
    if (sprint.state === "active") items.push({ id: "complete", label: "Complete sprint", icon: "complete", onSelect: () => setCompleting(sprint) });
    if (sprint.state === "planned") {
      items.push("separator", { id: "delete", label: "Delete sprint", icon: "trash", danger: true, onSelect: () => setDeleting(sprint) });
    }
    return (
      <Dropdown
        label={`${sprint.name} actions`}
        items={items}
        trigger={(p) => <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`${sprint.name} actions`} {...p} />}
      />
    );
  };

  const startNow = async () => {
    try {
      await startSprint(projectId, starting.id);
      toast.success("Sprint started");
      load.reload();
    } catch (err) {
      toast.error(err.message ?? "Could not start the sprint");
      throw err;
    }
  };

  const removeSprint = async () => {
    try {
      await deleteSprint(projectId, deleting.id);
      toast.success("Sprint deleted");
      load.reload();
    } catch (err) {
      toast.error(err.message ?? "Could not delete the sprint");
      throw err;
    }
  };

  useViewEntry(
    "backlog",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8, delay: 0.12 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  const sprints = data?.sprints ?? [];
  const backlogEmpty = emptyCopy("backlog");

  return (
    <>
      <header className="head">
        <div className="head__lead">
          <div className="head__text">
            <SplitTitle text="Backlog" />
            <p className="head__sub">Rank the backlog, then drag issues into a sprint. Start and complete sprints from their menu.</p>
          </div>
        </div>
        <div className="head__actions">
          {canSprint ? (
            <Button variant="soft" icon="plus" disabled={!data?.boardId} onClick={() => setSprintModal({ sprint: null })}>
              Create sprint
            </Button>
          ) : null}
          {can("issue.create") ? (
            <Button variant="ember" icon="plus" magnetic onClick={() => openCreateIssue({})}>
              New issue
            </Button>
          ) : null}
        </div>
      </header>

      <p className="sr" aria-live="polite" ref={liveRef} />

      <div ref={containerRef} className="grid gap-[var(--gap)]">
        {sprints.map((sprint) => (
          <SprintPanel
            key={sprint.id}
            panelId={sprint.id}
            title={sprint.name}
            meta={sprintMeta(sprint, (data.sprintIssues[sprint.id] ?? []).length)}
            actions={sprintActions(sprint)}
            issues={data?.sprintIssues[sprint.id] ?? []}
            status={load.status}
            error={load.error}
            onRetry={load.reload}
            emptyTitle={sprint.state === "active" ? "No issues in this sprint" : "This sprint is empty"}
            emptyText="Drag issues here from the backlog."
            dropActive={overPanel === sprint.id}
            rowProps={rowProps}
          />
        ))}

        <SprintPanel
          panelId={BACKLOG}
          title="Backlog"
          meta={`${data?.backlog.length ?? 0} ${data?.backlog.length === 1 ? "issue" : "issues"}${data?.cursor ? ", more to load" : ""}`}
          actions={null}
          issues={data?.backlog ?? []}
          status={load.status}
          error={load.error}
          onRetry={load.reload}
          emptyTitle={backlogEmpty.title}
          emptyText={backlogEmpty.text}
          dropActive={overPanel === BACKLOG}
          rowProps={rowProps}
        />

        {data?.cursor ? (
          <div className="flex justify-center">
            <Button variant="soft" size="sm" disabled={loadingMore} onClick={loadMore}>
              Show more
            </Button>
          </div>
        ) : null}
      </div>

      {createPortal(
        flies.map((f) => <Fly key={f.id} fly={f} onDone={removeFly} />),
        document.body,
      )}

      <SprintFormModal
        open={Boolean(sprintModal)}
        onClose={() => setSprintModal(null)}
        projectId={projectId}
        boardId={sprintModal?.sprint?.boardId ?? data?.boardId ?? null}
        sprint={sprintModal?.sprint ?? null}
        onSaved={load.reload}
      />

      <CompleteSprintModal
        open={Boolean(completing)}
        onClose={() => setCompleting(null)}
        projectId={projectId}
        sprint={completing}
        targets={sprints.filter((s) => s.state === "planned" && s.id !== completing?.id)}
        onDone={load.reload}
      />

      <ConfirmDialog
        open={Boolean(starting)}
        onClose={() => setStarting(null)}
        title={`Start ${starting?.name ?? "sprint"}?`}
        text={
          starting
            ? `It runs ${starting.startDate ? formatDate(starting.startDate) : "from today"} to ${starting.endDate ? formatDate(starting.endDate) : "the end date set"}. Only one sprint can be active at a time.`
            : ""
        }
        confirmLabel="Start sprint"
        tone="default"
        onConfirm={startNow}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? "sprint"}?`}
        text="Issues in the sprint move back to the backlog."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeSprint}
      />
    </>
  );
}
