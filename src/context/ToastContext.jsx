import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { flip } from "../utils/motion.js";
import { ToastViewport } from "../components/ui/Toast.jsx";
import { setErrorToaster } from "../libs/axios.js";

const MAX_VISIBLE = 3;
const ToastCtx = createContext(null);

// Real-time timers (setTimeout), never gsap timelines, so reduced motion does
// not stretch the hold.
function durationFor(type, hasAction) {
  if (type === "error") return 7000;
  if (type === "warning" || hasAction) return 5000;
  return 2600;
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const [politeText, setPoliteText] = useState("");
  const [alertText, setAlertText] = useState("");
  const timers = useRef(new Map());
  const sources = useRef({ hover: false, focus: false, hidden: false });
  const paused = useRef(false);
  const rootRef = useRef(null);
  const returnRef = useRef(null);
  const counter = useRef(0);

  const startTimer = (id) => {
    const t = timers.current.get(id);
    if (!t || !Number.isFinite(t.remaining)) return;
    clearTimeout(t.handle);
    t.startedAt = Date.now();
    t.handle = setTimeout(() => dismiss(id), t.remaining);
  };

  const stopTimer = (id) => {
    const t = timers.current.get(id);
    if (!t || t.handle === null) return;
    clearTimeout(t.handle);
    t.handle = null;
    t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
  };

  const syncPause = () => {
    const s = sources.current;
    const shouldPause = s.hover || s.focus || s.hidden;
    if (shouldPause === paused.current) return;
    paused.current = shouldPause;
    timers.current.forEach((_, id) => {
      if (shouldPause) stopTimer(id);
      else startTimer(id);
    });
  };

  const dismiss = (id, opts = {}) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t.handle);
      t.handle = null;
    }
    setItems((prev) => {
      const hit = prev.find((x) => x.id === id);
      if (!hit || hit.leaving) return prev;
      return prev.map((x) => (x.id === id ? { ...x, leaving: true } : x));
    });
    if (opts.restore && returnRef.current && returnRef.current.isConnected) {
      returnRef.current.focus({ preventScroll: true });
    }
  };

  const onGone = (id) => {
    timers.current.delete(id);
    flip(rootRef.current, () => flushSync(() => setItems((prev) => prev.filter((x) => x.id !== id))));
  };

  const add = (type, message, opts = {}) => {
    const id = opts.id ?? `toast-${++counter.current}`;
    const action = opts.undo ? { label: "Undo", onClick: opts.undo } : opts.action ?? null;
    const duration = opts.duration ?? durationFor(type, Boolean(action));
    const item = { id, type, message: String(message), action, icon: opts.icon ?? null, leaving: false };

    setItems((prev) => {
      const exists = prev.some((x) => x.id === id);
      let next = exists
        ? prev.map((x) => (x.id === id ? { ...x, ...item, leaving: false } : x))
        : [...prev, item];
      const live = next.filter((x) => !x.leaving);
      if (live.length > MAX_VISIBLE) {
        const oldest = live[0];
        next = next.map((x) => (x.id === oldest.id ? { ...x, leaving: true } : x));
      }
      return next;
    });

    const prevTimer = timers.current.get(id);
    if (prevTimer) clearTimeout(prevTimer.handle);
    timers.current.set(id, { remaining: duration, startedAt: 0, handle: null });
    if (!paused.current) startTimer(id);

    if (type === "error") setAlertText(String(message));
    else setPoliteText(String(message));
    return id;
  };

  const api = useMemo(
    () => ({
      success: (message, opts) => add("success", message, opts),
      error: (message, opts) => add("error", message, opts),
      info: (message, opts) => add("info", message, opts),
      warning: (message, opts) => add("warning", message, opts),
      dismiss: (id) => {
        if (id !== undefined) {
          dismiss(id);
          return;
        }
        timers.current.forEach((_, key) => dismiss(key));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // libs/axios decides which failures toast and calls this with
  // { type: "error" | "warning" | "info", kind, message }. kind is an icon key.
  useEffect(() => {
    setErrorToaster(({ type, kind, message }) => {
      const opts = kind ? { icon: kind } : undefined;
      if (type === "warning") api.warning(message, opts);
      else if (type === "info") api.info(message, opts);
      else api.error(message, opts);
    });
  }, [api]);

  useEffect(() => {
    const onVisibility = () => {
      sources.current.hidden = document.hidden;
      syncPause();
    };
    const onKey = (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.key.toLowerCase() !== "t") return;
      const nodes = rootRef.current ? rootRef.current.querySelectorAll("[data-key]") : [];
      const newest = nodes[nodes.length - 1];
      if (!newest) return;
      e.preventDefault();
      returnRef.current = document.activeElement;
      newest.focus({ preventScroll: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKey);
      timers.current.forEach((t) => clearTimeout(t.handle));
      timers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastViewport
        items={items}
        rootRef={rootRef}
        politeText={politeText}
        alertText={alertText}
        onDismiss={dismiss}
        onGone={onGone}
        onHoverChange={(on) => {
          sources.current.hover = on;
          syncPause();
        }}
        onFocusChange={(on) => {
          sources.current.focus = on;
          syncPause();
        }}
      />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastCtx);
  if (!toast) throw new Error("useToast must be used inside ToastProvider");
  return toast;
}
