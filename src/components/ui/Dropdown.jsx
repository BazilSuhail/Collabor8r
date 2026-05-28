import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReduced, scaled } from "../../utils/motion.js";
import { place, inViewport } from "../../utils/position.js";
import { Icon } from "./Icon.jsx";

// Escape layers. Every open overlay registers one capture-phase listener.
// Only the top layer acts: highest rank wins, then the most recently opened.
// Rank: modal 1, popup 2, tooltip 3 (a tooltip closes before a menu, a menu
// before a modal).
const RANK = { modal: 1, popup: 2, tooltip: 3 };
const escLayers = [];

function topEscLayer() {
  let top = null;
  for (const entry of escLayers) {
  if (!top || entry.rank >= top.rank) top = entry;
  }
  return top;
}

export function useEscapeLayer(kind, onEscape, active) {
  const handlerRef = useRef(onEscape);
  useLayoutEffect(() => {
  handlerRef.current = onEscape;
  });
  useEffect(() => {
  if (!active) return undefined;
  const entry = { rank: RANK[kind] };
  escLayers.push(entry);
  const onKey = (e) => {
  if (e.key !== "Escape" || e.isComposing) return;
  if (topEscLayer() !== entry) return;
  e.stopPropagation();
  handlerRef.current(e);
  };
  document.addEventListener("keydown", onKey, true);
  return () => {
  document.removeEventListener("keydown", onKey, true);
  const i = escLayers.indexOf(entry);
  if (i >= 0) escLayers.splice(i, 1);
  };
  }, [active, kind]);
}

// One popup open at a time. Dropdown and Select claim the slot; opening a
// second popup closes the first.
const activePopup = { current: null };
const popupSlot = {
  claim(id, close) {
  const prev = activePopup.current;
  if (prev && prev.id !== id) prev.close();
  activePopup.current = { id, close };
  },
  release(id) {
  if (activePopup.current && activePopup.current.id === id) activePopup.current = null;
  },
};

const PopoverContext = createContext(popupSlot);

export function PopoverProvider({ children }) {
  return <PopoverContext.Provider value={popupSlot}>{children}</PopoverContext.Provider>;
}

export function usePopoverSlot() {
  return useContext(PopoverContext);
}

export function getPopLayer() {
  let el = document.querySelector(".pop-layer");
  if (!el) {
  el = document.createElement("div");
  el.className = "pop-layer";
  document.body.appendChild(el);
  }
  return el;
}

// Mount/unmount with an entrance (F.4) and exit (F.4). Returns whether the
// popup element should be rendered.
export function useOverlayMotion(open, ref) {
  const [mounted, setMounted] = useState(open);

  useLayoutEffect(() => {
  if (open) {
  setMounted(true);
  return;
  }
  const el = ref.current;
  if (!el || prefersReduced()) {
  setMounted(false);
  return;
  }
  gsap.killTweensOf(el);
  gsap.to(el, {
  opacity: 0,
  scale: 0.96,
  duration: scaled(0.16),
  ease: "power2.in",
  onComplete: () => setMounted(false),
  });
  }, [open]);

  useLayoutEffect(() => {
  if (!open || !mounted) return;
  const el = ref.current;
  if (!el) return;
  gsap.killTweensOf(el);
  if (prefersReduced()) {
  gsap.set(el, { opacity: 1, scale: 1, y: 0 });
  return;
  }
  gsap.fromTo(
  el,
  { opacity: 0, scale: 0.94, y: -4 },
  {
  opacity: 1,
  scale: 1,
  y: 0,
  duration: scaled(0.32),
  ease: "back.out(1.8)",
  clearProps: "transform,opacity",
  },
  );
  }, [open, mounted]);

  return mounted;
}

const TYPE_WINDOW = 500;

export default function Dropdown({ trigger, items, placement = "bottom-end", label, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const pending = useRef("first");
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const itemRefs = useRef([]);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();
  const triggerId = `${id}-t`;
  const menuId = `${id}-m`;
  const slot = usePopoverSlot();
  const mounted = useOverlayMotion(open, popRef);

  const changeOpen = (next) => {
  setOpen(next);
  onOpenChange?.(next);
  };

  const enabled = () => {
  const out = [];
  items.forEach((it, i) => {
  if (it !== "separator" && !it.disabled) out.push(i);
  });
  return out;
  };

  const close = (focusTrigger) => {
  changeOpen(false);
  if (focusTrigger) triggerRef.current?.focus();
  };

  const show = (which) => {
  pending.current = which;
  changeOpen(true);
  };

  useLayoutEffect(() => {
  if (!open || !mounted) return undefined;
  const pop = popRef.current;
  const anchor = triggerRef.current;
  if (!pop || !anchor) return undefined;

  place(anchor, pop, { placement, offset: 8, margin: 12 });
  slot.claim(menuId, () => changeOpen(false));

  const order = items.map((it, i) => (it !== "separator" && !it.disabled ? i : -1)).filter((i) => i >= 0);
  const target = pending.current === "last" ? order[order.length - 1] : order[0];
  if (target !== undefined) itemRefs.current[target]?.focus({ preventScroll: true });

  const reposition = () => {
  if (!inViewport(anchor)) changeOpen(false);
  else place(anchor, pop, { placement, offset: 8, margin: 12 });
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, true);

  let alive = true;
  const onDown = (e) => {
  if (pop.contains(e.target) || anchor.contains(e.target)) return;
  changeOpen(false);
  };
  queueMicrotask(() => {
  if (alive) document.addEventListener("pointerdown", onDown, true);
  });

  return () => {
  alive = false;
  window.removeEventListener("resize", reposition);
  window.removeEventListener("scroll", reposition, true);
  document.removeEventListener("pointerdown", onDown, true);
  slot.release(menuId);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEscapeLayer("popup", () => close(true), open);

  const moveTo = (next) => {
  itemRefs.current[next]?.focus();
  };

  const onMenuKey = (e) => {
  const order = enabled();
  if (!order.length) return;
  const current = itemRefs.current.findIndex((el) => el === document.activeElement);
  const pos = order.indexOf(current);
  switch (e.key) {
  case "ArrowDown":
  e.preventDefault();
  moveTo(order[(pos + 1) % order.length]);
  return;
  case "ArrowUp":
  e.preventDefault();
  moveTo(order[(pos - 1 + order.length) % order.length]);
  return;
  case "Home":
  e.preventDefault();
  moveTo(order[0]);
  return;
  case "End":
  e.preventDefault();
  moveTo(order[order.length - 1]);
  return;
  case "Tab":
  close(true);
  return;
  default:
  break;
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
  const now = Date.now();
  typed.current = {
  text: (now - typed.current.at > TYPE_WINDOW ? "" : typed.current.text) + e.key.toLowerCase(),
  at: now,
  };
  const start = pos < 0 ? 0 : pos + 1;
  for (let k = 0; k < order.length; k += 1) {
  const idx = order[(start + k) % order.length];
  const text = (items[idx].label ?? "").toLowerCase();
  if (text.startsWith(typed.current.text)) {
  moveTo(idx);
  return;
  }
  }
  }
  };

  const triggerProps = {
  ref: triggerRef,
  id: triggerId,
 "aria-haspopup": "menu",
 "aria-expanded": open,
 "aria-controls": open ? menuId : undefined,
  onClick: () => (open ? close(false) : show("first")),
  onKeyDown: (e) => {
  if (e.key === "ArrowDown") {
  e.preventDefault();
  show("first");
  } else if (e.key === "ArrowUp") {
  e.preventDefault();
  show("last");
  }
  },
  };

  let rendered = null;
  if (mounted) {
  rendered = createPortal(
  <div
  ref={popRef}
  id={menuId}
  role="menu"
  aria-labelledby={triggerId}
  aria-label={label}
  onKeyDown={onMenuKey}
  className="pop pointer-events-auto fixed z-[80] rounded-[15px] p-[6px] min-w-[200px]  max-h-[min(70vh,520px)] overflow-auto bg-float border border-line shadow-[var(--shadow-pop)]"
  >
  {items.map((it, i) => {
  if (it === "separator") {
  return <hr key={`sep-${i}`} role="separator" />;
  }
  const itemIndex = i;
  const common = {
  role: "menuitem",
  tabIndex: -1,
 "aria-disabled": it.disabled ? true : undefined,
  className: `menu__item flex ${it.danger ? "is-danger" : ""} ${it.disabled ? "opacity-[0.45] cursor-not-allowed" : ""}`,
  };
  const body = (
  <>
  {it.icon ? <Icon name={it.icon} /> : null}
  <span>{it.label}</span>
  </>
  );
  const select = () => {
  if (it.disabled) return;
  close(true);
  it.onSelect?.();
  };
  return it.href ? (
  <a
  key={it.id ?? itemIndex}
  {...common}
  href={it.disabled ? undefined : it.href}
  ref={(el) => {
  itemRefs.current[itemIndex] = el;
  }}
  onClick={select}
  >
  {body}
  </a>
  ) : (
  <button
  key={it.id ?? itemIndex}
  {...common}
  type="button"
  ref={(el) => {
  itemRefs.current[itemIndex] = el;
  }}
  onClick={select}
  >
  {body}
  </button>
  );
  })}
  </div>,
  getPopLayer(),
  );
  }

  return (
  <>
  {trigger(triggerProps)}
  {rendered}
  </>
  );
}
