import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReduced, scaled, fadeUp } from "../../utils/motion.js";
import { cn } from "../../utils/cn.js";
import { useEscapeLayer } from "./Dropdown.jsx";
import Button from "./Button.jsx";

// Module stack of open modals, bottom to top. Shared by every modal instance.
const stack = [];
const MAX_DEPTH = 2;
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export const SCRIM = "bg-[#14100c4d] dark:bg-[#0009] backdrop-blur-[6px]";
const PLAIN = "bg-float border border-line shadow-[var(--shadow-pop)] rounded-[15px] w-[min(420px,100vw_-_24px)] max-h-[min(86dvh,860px)] overflow-auto";

let scrollLocks = 0;
let savedOverflow = "";
let savedPadding = "";
let hooks = { onFirstOpen: null };

export function registerModalHooks(next) {
  hooks = { ...hooks, ...next };
}

// Closes every open modal, top first. Used by the layout on route change.
// Bypasses the dirty guard and dismissible (a route change always leaves).
export function closeAllModals(reason = "route") {
  [...stack].reverse().forEach((entry) => entry.close(reason, true));
}

function getModalRoot() {
  let el = document.querySelector("[data-modal-root]");
  if (!el) {
    el = document.createElement("div");
    el.setAttribute("data-modal-root", "");
    document.body.appendChild(el);
  }
  return el;
}

function syncRoot() {
  const root = document.getElementById("root");
  if (!root) return;
  if (stack.length) root.setAttribute("inert", "");
  else root.removeAttribute("inert");
}

function lockScroll() {
  scrollLocks += 1;
  if (scrollLocks !== 1) return;
  const de = document.documentElement;
  savedOverflow = de.style.overflow;
  savedPadding = document.body.style.paddingRight;
  const bar = window.innerWidth - de.clientWidth;
  de.style.overflow = "hidden";
  if (bar > 0) document.body.style.paddingRight = `${bar}px`;
}

function unlockScroll() {
  if (scrollLocks === 0) return;
  scrollLocks -= 1;
  if (scrollLocks !== 0) return;
  document.documentElement.style.overflow = savedOverflow;
  document.body.style.paddingRight = savedPadding;
}

function pushEntry(entry) {
  const wasEmpty = stack.length === 0;
  stack.push(entry);
  if (wasEmpty) hooks.onFirstOpen?.();
  syncRoot();
  lockScroll();
}

function popEntry(entry) {
  const i = stack.indexOf(entry);
  if (i < 0) return;
  stack.splice(i, 1);
  syncRoot();
  unlockScroll();
}

function focusables(panel) {
  return [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
}

function resolveEl(value) {
  if (!value) return null;
  if (value instanceof Element) return value;
  if (value.current instanceof Element) return value.current;
  return null;
}

function isMobile() {
  return window.matchMedia("(max-width: 760px)").matches;
}

// Engine for SideModal and CenterModal. Renders into the shared
// [data-modal-root] (outside #root), with a scrim and a dialog panel.
export default function Modal({
  open,
  onClose,
  label,
  labelledBy,
  describedBy,
  initialFocus,
  returnFocus,
  dismissible = true,
  onBeforeClose,
  motion = "center",
  side = "right",
  wrapClass = "",
  panelClass = "",
  scrimClass = SCRIM,
  children,
}) {
  const [mounted, setMounted] = useState(false);
  const [refused, setRefused] = useState(false);
  const [discard, setDiscard] = useState(false);

  const panelRef = useRef(null);
  const scrimRef = useRef(null);
  const closeFnRef = useRef(null);
  const entryRef = useRef(null);
  const pushedRef = useRef(false);
  const closingRef = useRef(false);
  const returnRef = useRef(null);
  const downOnScrim = useRef(false);
  const onCloseRef = useRef(onClose);
  const onBeforeRef = useRef(onBeforeClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  onBeforeRef.current = onBeforeClose;
  dismissibleRef.current = dismissible;

  if (!entryRef.current) {
    entryRef.current = {
      close: (reason, bypass) => closeFnRef.current(reason, bypass),
    };
  }

  const finish = () => {
    if (!closingRef.current) return;
    popEntry(entryRef.current);
    pushedRef.current = false;
    closingRef.current = false;
    setDiscard(false);
    setMounted(false);
    const target = returnRef.current;
    if (target && target.isConnected) target.focus({ preventScroll: true });
    else document.querySelector("#root h1")?.focus({ preventScroll: true });
  };

  const runExit = () => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel || prefersReduced()) {
      finish();
      return;
    }
    gsap.killTweensOf([panel, scrim]);
    const mobile = isMobile();
    const dir = side === "left" ? -1 : 1;
    let vars;
    let dur;
    let ease = "power2.in";
    if (motion === "side" && !mobile) {
      vars = { x: dir * 40, opacity: 0 };
      dur = 0.22;
    } else if (motion === "side") {
      vars = { y: 60, opacity: 0 };
      dur = 0.22;
    } else if (mobile) {
      vars = { y: 60, opacity: 0 };
      dur = 0.2;
    } else {
      vars = { opacity: 0, scale: 0.97 };
      dur = 0.2;
    }
    gsap.to(panel, { ...vars, duration: scaled(dur), ease, onComplete: finish });
    gsap.to(scrim, { opacity: 0, duration: scaled(dur), ease });
  };

  const runEnter = () => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!panel) return;
    gsap.killTweensOf([panel, scrim]);
    if (prefersReduced()) {
      gsap.set([panel, scrim], { opacity: 1, x: 0, y: 0, scale: 1 });
      return;
    }
    const mobile = isMobile();
    const dir = side === "left" ? -1 : 1;
    const kids = Array.from(panel.children);
    if (motion === "side" && !mobile) {
      gsap.fromTo(
        panel,
        { opacity: 0, x: dir * 60 },
        { opacity: 1, x: 0, duration: scaled(0.45), ease: "back.out(1.5)", clearProps: "transform" },
      );
      if (kids.length) fadeUp(kids, { y: 14, stagger: 0.05, delay: 0.08 });
    } else if (motion === "side" || mobile) {
      gsap.fromTo(
        panel,
        { opacity: 0, y: 90 },
        { opacity: 1, y: 0, duration: scaled(0.45), ease: "back.out(1.5)", clearProps: "transform" },
      );
    } else {
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.96, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: scaled(0.4), ease: "back.out(1.6)", clearProps: "transform" },
      );
    }
    if (scrim) gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: scaled(0.3) });
  };

  const focusInitial = () => {
    const panel = panelRef.current;
    if (!panel) return;
    let target = null;
    if (typeof initialFocus === "string") target = panel.querySelector(initialFocus);
    else target = resolveEl(initialFocus);
    if (!target) target = panel.querySelector("[data-autofocus]");
    if (!target) {
      target = panel.querySelector(
        "input:not([disabled]):not([type='hidden']), textarea:not([disabled]), select:not([disabled])",
      );
    }
    (target ?? panel).focus({ preventScroll: true });
  };

  closeFnRef.current = (reason, bypass = false) => {
    if (!pushedRef.current || closingRef.current) return;
    if (!bypass) {
      if ((reason === "escape" || reason === "scrim") && !dismissibleRef.current) return;
      if (onBeforeRef.current && onBeforeRef.current() === false) {
        setDiscard(true);
        return;
      }
    }
    onCloseRef.current?.(reason);
  };

  // Open and close lifecycle.
  useLayoutEffect(() => {
    if (open) {
      if (pushedRef.current) {
        closingRef.current = false;
        setMounted(true);
        return;
      }
      if (stack.length >= MAX_DEPTH) {
        if (import.meta.env.DEV) console.warn("Modal depth limit reached. Open refused.");
        setRefused(true);
        return;
      }
      returnRef.current = resolveEl(returnFocus) ?? document.activeElement;
      pushedRef.current = true;
      closingRef.current = false;
      pushEntry(entryRef.current);
      setRefused(false);
      setMounted(true);
      return;
    }
    setRefused(false);
    if (pushedRef.current && !closingRef.current) {
      closingRef.current = true;
      setDiscard(false);
      runExit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    runEnter();
    focusInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(
    () => () => {
      if (pushedRef.current) {
        popEntry(entryRef.current);
        pushedRef.current = false;
      }
    },
    [],
  );

  useEscapeLayer(
    "modal",
    () => closeFnRef.current("escape"),
    open && mounted && !closingRef.current,
  );

  const onPanelKey = (e) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const list = focusables(panel);
    if (!list.length) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const act = document.activeElement;
    if (e.shiftKey) {
      if (act === first || act === panel || !panel.contains(act)) {
        e.preventDefault();
        last.focus();
      }
    } else if (act === last || !panel.contains(act)) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted || refused) return null;

  const idx = Math.max(0, stack.indexOf(entryRef.current));
  const z = { scrim: 70 + 2 * idx, wrap: 71 + 2 * idx };
  const content = typeof children === "function"
    ? children({ close: () => closeFnRef.current("close") })
    : children;

  const discardNode = (
    <Modal
      open={discard}
      onClose={() => setDiscard(false)}
      label="Discard changes?"
      panelClass={cn(PLAIN, "p-0")}
      wrapClass="grid place-items-center p-[12px]"
    >
      <div className="grid gap-[18px] p-[24px]">
        <h2 className="[font:600_20px_var(--display)] tracking-[-0.015em]">Discard changes?</h2>
        <p className="text-muted text-[14px]">Your edits will be lost.</p>
        <div className="flex flex-wrap justify-end gap-[10px]">
          <Button variant="ghost" data-autofocus onClick={() => setDiscard(false)}>
            Keep editing
          </Button>
          <Button
            variant="ink"
            onClick={() => {
              setDiscard(false);
              onCloseRef.current?.("close");
            }}
          >
            Discard
          </Button>
        </div>
      </div>
    </Modal>
  );

  return createPortal(
    <>
      <div
        ref={scrimRef}
        aria-hidden="true"
        className={cn("fixed inset-0", scrimClass)}
        style={{ zIndex: z.scrim }}
        onPointerDown={(e) => {
          downOnScrim.current = e.target === e.currentTarget;
        }}
        onPointerUp={(e) => {
          const hit = downOnScrim.current && e.target === e.currentTarget;
          downOnScrim.current = false;
          if (hit) closeFnRef.current("scrim");
        }}
      />
      <div
        className={cn("fixed inset-0 flex pointer-events-none", wrapClass)}
        style={{ zIndex: z.wrap }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          tabIndex={-1}
          onKeyDown={onPanelKey}
          className={cn("pointer-events-auto outline-none", panelClass)}
        >
          {content}
        </div>
      </div>
      {discardNode}
    </>,
    getModalRoot(),
  );
}
