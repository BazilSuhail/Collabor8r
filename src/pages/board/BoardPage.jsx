// feat(pages/board/BoardPage): show a project's board as status columns and move issues by drag and drop.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import Fly from "../../components/pipeline/Fly.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import FilterChip from "../../components/ui/FilterChip.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import SplitTitle from "../../components/SplitTitle.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getBoardIssues, listBoards, rankIssue } from "../../libs/api/boards.js";
import { transitionIssue } from "../../libs/api/issues.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, gsap, prefersReduced, scaled, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import BoardColumn from "./components/BoardColumn.jsx";
import BoardSettingsModal from "./components/BoardSettingsModal.jsx";

const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });
const LONG_PRESS_MS = 280;

const normalizeBoard = (data) =>
  data
    ? {
        ...data,
        columns: (data.columns ?? []).map((c) => ({
          ...c,
          id: String(c.id ?? c._id),
          statusIds: (c.statusIds ?? []).map(String),
          items: (c.items ?? []).map(withId),
        })),
      }
    : null;

const locate = (data, id) => {
  for (const col of data?.columns ?? []) {
    const index = col.items.findIndex((x) => x.id === id);
    if (index >= 0) return { col, index, item: col.items[index] };
  }
  return null;
};

// Takes the card out of its column and puts it into the target column at index (index counts the other cards).
const applyMove = (data, id, toColId, index, status) => {
  let moved = null;
  const columns = data.columns.map((c) => {
    const found = c.items.find((x) => x.id === id);
    if (found) moved = found;
    return { ...c, items: c.items.filter((x) => x.id !== id) };
  });
  if (!moved) return data;
  const next = { ...moved, statusId: status.id, statusName: status.name, statusCategory: status.category };
  return {
    ...data,
    columns: columns.map((c) => {
      if (c.id !== toColId) return c;
      const items = [...c.items];
      items.splice(index, 0, next);
      return { ...c, items };
    }),
  };
};

export default function BoardPage() {
  const { boardId: routeBoardId } = useParams();
  const navigate = useNavigate();
  const { projectId, statuses, can } = useProject();
  const { user } = useAuth();
  const { openCreateIssue } = useShell();
  const toast = useToast();
  const liveRef = useRef(null);
  const boardRef = useRef(null);
  const colsRef = useRef(null);
  const dragRef = useRef(null);
  const pressRef = useRef(null);
  const listenersRef = useRef(null);
  const flyKey = useRef(0);
  const lastDragEnd = useRef(0);
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [bugsOnly, setBugsOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flies, setFlies] = useState([]);
  const [dragging, setDragging] = useState(false);

  const boards = useResource(async () => {
    const res = await listBoards(projectId);
    return { data: (res.data ?? []).map(withId), meta: res.meta };
  }, [projectId]);
  const boardList = boards.data ?? [];
  const activeBoard =
    boardList.find((b) => b.id === routeBoardId) ?? boardList.find((b) => b.isDefault) ?? boardList[0] ?? null;
  const activeId = activeBoard?.id ?? null;

  const assigneeId = mine && user ? idOf(user) : null;
  const detail = useResource(async () => {
    if (!activeId) return { data: null, meta: null };
    const res = await getBoardIssues(projectId, activeId, assigneeId ? { assigneeId } : {});
    return { data: normalizeBoard(res.data), meta: res.meta };
  }, [projectId, activeId, assigneeId]);

  // Handlers read the latest board through this ref. Drag start and drop run after state has changed.
  const dataRef = useRef(null);
  dataRef.current = detail.data;
  const ready = detail.status === "success";
  const canMove = can("issue.rank");

  const columns = detail.data?.columns ?? [];
  const firstStatusId = columns[0]?.statusIds?.[0] ?? null;
  const categoryOf = (col) => statuses.find((s) => idOf(s) === col.statusIds[0])?.category ?? "todo";
  const needle = search.trim().toLowerCase();
  const visibleItems = (col) =>
    col.items.filter(
      (i) =>
        (!needle || `${i.key} ${i.title}`.toLowerCase().includes(needle)) &&
        (!bugsOnly || /bug/i.test(i.typeName ?? "")),
    );

  const addFly = useCallback((rect, face, cls, run) => {
    face.removeAttribute("data-lift");
    face.style.transform = "";
    const id = ++flyKey.current;
    setFlies((fs) => [...fs, { id, rect, face, cls, run }]);
  }, []);
  const removeFly = useCallback((id) => setFlies((fs) => fs.filter((f) => f.id !== id)), []);

  const announce = (message) => {
    if (liveRef.current) liveRef.current.textContent = message;
  };

  const statusMeta = (statusId) => {
    const s = statuses.find((x) => idOf(x) === String(statusId));
    return { id: String(statusId), name: s?.name ?? "", category: s?.category ?? "todo" };
  };

  // Optimistic move, then transition (when the status changes) and rank. Returns false after reverting.
  const persistMove = async (id, toColId, index) => {
    const snapshot = dataRef.current;
    const found = locate(snapshot, id);
    const toCol = snapshot?.columns.find((c) => c.id === toColId);
    if (!found || !toCol) return false;
    const others = toCol.items.filter((x) => x.id !== id);
    const beforeId = others[index - 1]?.id ?? null;
    const afterId = others[index]?.id ?? null;
    const sameStatus = toCol.statusIds.includes(found.item.statusId);
    const target = sameStatus
      ? { id: found.item.statusId, name: found.item.statusName, category: found.item.statusCategory }
      : statusMeta(toCol.statusIds[0]);
    detail.setData((d) => applyMove(d, id, toColId, index, target));
    if (!sameStatus) {
      try {
        await transitionIssue(projectId, id, { toStatus: target.id });
      } catch {
        detail.setData(snapshot);
        toast.error(`Could not move ${found.item.key}`);
        return false;
      }
    }
    try {
      await rankIssue(projectId, id, { beforeId, afterId });
      return true;
    } catch {
      toast.error(`Could not move ${found.item.key}`);
      detail.reload();
      return false;
    }
  };

  const moveByKeyboard = async (id, delta) => {
    const data = dataRef.current;
    const from = locate(data, id);
    const toCol = from ? data.columns[data.columns.indexOf(from.col) + delta] : null;
    if (!from || !toCol) return;
    const index = toCol.items.filter((x) => x.id !== id).length;
    announce(`Moving ${from.item.key} to ${toCol.name}`);
    const ok = await persistMove(id, toCol.id, index);
    if (ok) announce(`${from.item.key} moved to ${toCol.name}`);
    requestAnimationFrame(() =>
      boardRef.current?.querySelector(`.pp-card[data-key="${id}"]`)?.focus({ preventScroll: true }),
    );
  };

  const onKeyDown = (e) => {
    const card = e.target.closest?.(".pp-card");
    if (!card || e.target !== card || e.metaKey || e.ctrlKey || e.altKey) return;
    const found = locate(dataRef.current, card.dataset.key);
    if (!found) return;
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(paths.issue(projectId, found.item.key));
      return;
    }
    const delta = e.key === "[" || e.key === "ArrowLeft" ? -1 : e.key === "]" || e.key === "ArrowRight" ? 1 : 0;
    if (!delta || !canMove) return;
    e.preventDefault();
    e.stopPropagation();
    moveByKeyboard(card.dataset.key, delta);
  };

  const onBoardClick = (e) => {
    if (performance.now() - lastDragEnd.current < 300) return;
    const card = e.target.closest?.(".pp-card");
    if (!card || e.target.closest("button, a, input")) return;
    const found = locate(dataRef.current, card.dataset.key);
    if (found) navigate(paths.issue(projectId, found.item.key));
  };

  // Pointer drag. Listeners are attached on press and removed on drop, cancel or unmount.
  const detachMove = () => {
    const l = listenersRef.current;
    if (!l) return;
    window.removeEventListener("pointermove", l.move);
    window.removeEventListener("pointerup", l.up);
    window.removeEventListener("pointercancel", l.cancel);
    window.removeEventListener("keydown", l.esc, true);
    window.removeEventListener("touchmove", l.noScroll);
    listenersRef.current = null;
  };

  const clearOver = () => boardRef.current?.querySelectorAll(".pp-col.is-over").forEach((el) => el.classList.remove("is-over"));

  const hitColumn = (x, y) => {
    const cols = colsRef.current;
    if (!cols) return null;
    const cr = cols.getBoundingClientRect();
    if (y < cr.top - 40 || y > cr.bottom + 40 || x < cr.left - 30 || x > cr.right + 30) return null;
    for (const el of cols.querySelectorAll(".pp-col[data-col]")) {
      const r = el.getBoundingClientRect();
      if (x >= r.left - 6 && x <= r.right + 6) return el;
    }
    return null;
  };

  // Index among the other cards of a column: how many of them sit above the pointer.
  const dropIndexIn = (body, id, y) => {
    let index = 0;
    for (const el of body.querySelectorAll(".pp-card[data-key]")) {
      if (el.dataset.key === id) continue;
      const r = el.getBoundingClientRect();
      if (y > r.top + r.height / 2) index += 1;
      else break;
    }
    return index;
  };

  const flyBack = (d) => {
    const finish = () => {
      d.card.classList.remove("is-placeholder");
      d.done();
    };
    if (prefersReduced()) {
      finish();
      return;
    }
    gsap.to(d.fly, { x: d.rect.left, y: d.rect.top, scale: 1, rotation: 0, duration: scaled(0.5), ease: "back.out(1.4)", onComplete: finish });
  };

  const startDrag = (x, y) => {
    const press = pressRef.current;
    if (!press) return;
    clearTimeout(press.timer);
    press.card.classList.remove("is-pressing");
    pressRef.current = null;
    const found = locate(dataRef.current, press.id);
    if (!found) {
      detachMove();
      return;
    }
    const { card } = press;
    const rect = card.getBoundingClientRect();
    const face = card.querySelector(".pp-face");
    const offX = x - rect.left;
    const offY = y - rect.top;
    const origin = { colId: found.col.id, index: found.index };
    card.classList.add("is-placeholder");
    setDragging(true);
    try {
      boardRef.current?.setPointerCapture(press.pid);
    } catch {
      // Capture is best effort. The window listeners still deliver the moves.
    }
    addFly(rect, face.cloneNode(true), "pp-fly is-lifted is-drag", (fly, done) => {
      gsap.set(fly, { transformOrigin: `${offX}px ${offY}px` });
      gsap.to(fly, { scale: 1.03, duration: scaled(0.28), ease: "back.out(2.2)" });
      dragRef.current = {
        id: press.id,
        key: found.item.key,
        card,
        pid: press.pid,
        fly,
        done,
        rect,
        offX,
        offY,
        origin,
        target: null,
        x,
        y,
        qx: gsap.quickTo(fly, "x", { duration: scaled(0.16) || 1e-3, ease: "power3.out" }),
        qy: gsap.quickTo(fly, "y", { duration: scaled(0.16) || 1e-3, ease: "power3.out" }),
      };
      announce(`Picked up ${found.item.key}. Release over a column to move the issue.`);
    });
  };

  const endDrag = async (cancel) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    detachMove();
    try {
      boardRef.current?.releasePointerCapture(d.pid);
    } catch {
      // The capture may already be gone.
    }
    lastDragEnd.current = performance.now();
    setDragging(false);
    clearOver();
    gsap.killTweensOf(d.fly, "x,y,rotation,scale");

    const target = cancel ? null : d.target;
    const data = dataRef.current;
    const toCol = target ? data?.columns.find((c) => c.id === target.colId) : null;
    const bodyEl = toCol ? boardRef.current?.querySelector(`.pp-col[data-col="${toCol.id}"] .pp-col__body`) : null;
    const index = bodyEl ? dropIndexIn(bodyEl, d.id, d.y) : 0;
    if (!toCol || !bodyEl || (toCol.id === d.origin.colId && index === d.origin.index)) {
      flyBack(d);
      return;
    }

    // The fly lands on the target column while the request runs. Success removes it, failure flies it back.
    if (!prefersReduced()) {
      const landing = bodyEl.getBoundingClientRect();
      gsap.to(d.fly, { x: landing.left + 8, y: landing.top + 8, scale: 0.94, rotation: 0, duration: scaled(0.4), ease: "power3.inOut" });
    }
    const ok = await persistMove(d.id, toCol.id, index);
    if (ok) {
      d.card.classList.remove("is-placeholder");
      d.done();
      announce(`${d.key} moved to ${toCol.name}`);
    } else {
      flyBack(d);
    }
  };

  const onPointerDown = (e) => {
    if (dragRef.current || pressRef.current || e.button !== 0 || !e.isPrimary || !canMove) return;
    const card = e.target.closest?.(".pp-card");
    if (!card || e.target.closest("button, a, input")) return;
    const press = { id: card.dataset.key, card, pid: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType, timer: 0 };
    pressRef.current = press;
    if (e.pointerType === "touch") {
      press.timer = window.setTimeout(() => startDrag(press.x, press.y), LONG_PRESS_MS);
      card.classList.add("is-pressing");
    }

    const move = (ev) => {
      const p = pressRef.current;
      if (p && ev.pointerId === p.pid && !dragRef.current) {
        const dist = Math.hypot(ev.clientX - p.x, ev.clientY - p.y);
        if (p.type === "touch") {
          if (dist > 8) abortPress();
          return;
        }
        if (dist <= 5) return;
        startDrag(p.x, p.y);
      }
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pid) return;
      d.x = ev.clientX;
      d.y = ev.clientY;
      d.qx(d.x - d.offX);
      d.qy(d.y - d.offY);
      const colEl = hitColumn(d.x, d.y);
      const colId = colEl?.dataset.col ?? null;
      if (colId === (d.target?.colId ?? null)) return;
      clearOver();
      if (colEl) colEl.classList.add("is-over");
      d.target = colId ? { colId } : null;
    };
    const up = (ev) => {
      if (pressRef.current && !dragRef.current) {
        abortPress();
        return;
      }
      if (dragRef.current && ev.pointerId === dragRef.current.pid) endDrag(false);
    };
    const cancel = () => {
      if (dragRef.current) endDrag(true);
      else abortPress();
    };
    const esc = (ev) => {
      if (ev.key === "Escape" && dragRef.current) {
        ev.preventDefault();
        ev.stopPropagation();
        endDrag(true);
      }
    };
    const noScroll = (ev) => {
      if (dragRef.current) ev.preventDefault();
    };
    listenersRef.current = { move, up, cancel, esc, noScroll };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", esc, true);
    window.addEventListener("touchmove", noScroll, { passive: false });
  };

  const abortPress = () => {
    const press = pressRef.current;
    if (press) {
      clearTimeout(press.timer);
      press.card.classList.remove("is-pressing");
    }
    pressRef.current = null;
    if (!dragRef.current) detachMove();
  };

  useLayoutEffect(() => {
    if (!dragging) return undefined;
    const root = document.documentElement;
    root.classList.add("pp-dragging");
    return () => root.classList.remove("pp-dragging");
  }, [dragging]);

  useEffect(
    () => () => {
      detachMove();
      clearTimeout(pressRef.current?.timer);
    },
    [],
  );

  useViewEntry(
    "pipeline",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8, delay: 0.12 });
      fadeUp(q(".toolbar > *"), { y: 10, stagger: 0.03, delay: 0.2 });
      cardRise(q(".pp-col"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  if (boards.status === "error") {
    return <EmptyState tone="error" title="Could not load the boards" onRetry={boards.reload} />;
  }
  if (boards.status === "success" && !activeBoard) {
    return (
      <div className="grid justify-items-center gap-[8px]">
        <Illustration name="empty" alt="" className="mx-auto w-[180px] w1000:hidden" />
        <EmptyState icon="kanban" title="No board yet" text="Ask a project lead to create a board for this project." />
      </div>
    );
  }

  const boardSettingsButton =
    can("board.manage") && activeBoard ? (
      <Button variant="ghost" icon="settings" onClick={() => setSettingsOpen(true)}>
        Board settings
      </Button>
    ) : null;

  let body;
  if (detail.status === "error") {
    body = <EmptyState tone="error" title="Could not load this board" onRetry={detail.reload} />;
  } else if (!ready) {
    body = (
      <div aria-busy="true" className="pp-cols grid grid-flow-col gap-[12px] [grid-auto-columns:minmax(240px,1fr)] w760:[grid-auto-columns:calc(100%_-_44px)]">
        <span className="sr">Loading</span>
        {[0, 1, 2].map((c) => (
          <div key={c} className="grid gap-[10px] rounded-card border border-line bg-surface p-[12px] content-start">
            <span className="block h-[14px] w-[50%] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
            {[0, 1, 2].map((r) => (
              <span key={r} className="block h-[84px] rounded-[15px] bg-well animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        ))}
      </div>
    );
  } else if (columns.length === 0) {
    body = (
      <EmptyState
        {...emptyCopy("pipeline")}
        action={
          can("board.manage") ? (
            <Button variant="soft" size="sm" onClick={() => setSettingsOpen(true)}>
              Set up columns
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    body = (
      <div
        className="pp-board grid gap-[12px]"
        data-board=""
        ref={boardRef}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onClick={onBoardClick}
      >
        <div
          className="pp-cols grid grid-flow-col gap-[12px] min-w-0 min-h-0 overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain] [scrollbar-width:none] [grid-auto-columns:minmax(240px,1fr)] w1360:[grid-auto-columns:260px] w760:[grid-auto-columns:calc(100%_-_44px)] h-[clamp(440px,100dvh_-_320px,1000px)]"
          ref={colsRef}
        >
          {columns.map((col) => (
            <BoardColumn
              key={col.id}
              id={col.id}
              name={col.name}
              category={categoryOf(col)}
              wipLimit={col.wipLimit}
              count={col.items.length}
              items={visibleItems(col)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="head">
        <div className="head__lead">
          <div className="head__text">
            <SplitTitle text="Board" />
            <p className="head__sub">Drag an issue to another column to change its status.</p>
          </div>
        </div>
        <div className="head__actions">
          {boardList.length > 1 ? (
            <Select
              variant="button"
              size="sm"
              label="Board"
              value={activeId}
              options={boardList.map((b) => ({ value: b.id, label: b.name }))}
              onChange={(v) => v && navigate(paths.board(projectId, v))}
            />
          ) : null}
          {boardSettingsButton}
          {can("issue.create") ? (
            <Button variant="ember" icon="plus" magnetic onClick={() => openCreateIssue({ statusId: firstStatusId })}>
              New issue
            </Button>
          ) : null}
        </div>
      </header>

      <div className="toolbar">
        <Input
          variant="search"
          label="Search this board"
          hideLabel
          placeholder="Search this board"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterChip pressed={mine} icon="user" onClick={() => setMine((v) => !v)}>
          My issues
        </FilterChip>
        <FilterChip pressed={bugsOnly} icon="bug" onClick={() => setBugsOnly((v) => !v)}>
          Bugs only
        </FilterChip>
        <span className="toolbar__spacer" />
      </div>

      <p className="sr" aria-live="polite" ref={liveRef} />

      {body}

      {createPortal(
        flies.map((f) => <Fly key={f.id} fly={f} onDone={removeFly} />),
        document.body,
      )}

      <BoardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
        board={activeBoard}
        statuses={statuses}
        onSaved={() => {
          boards.reload();
          detail.reload();
        }}
      />
    </>
  );
}
