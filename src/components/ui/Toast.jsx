import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReduced, scaled } from "../../utils/motion.js";
import { cn } from "../../utils/cn.js";
import Button from "./Button.jsx";
import { Icon } from "./Icon.jsx";

const CHIP = {
  success: "bg-spruce text-[color:var(--on-spruce)]",
  error: "bg-ember text-[color:var(--on-ember)]",
  warning: "bg-saffron text-[color:var(--on-saffron)]",
  info: "bg-iris text-[color:var(--on-iris)]",
};
const TYPE_ICON = {
  success: "check",
  error: "alert",
  warning: "flag",
  info: "info",
};

const depthOpacity = (depth) => 1 - 0.12 * depth;
const depthScale = (depth) => 1 - 0.03 * depth;

// One toast. Enters with F.6, sits behind newer toasts with a depth scale,
// and leaves with F.6. onGone fires once the exit is done (or at once under
// reduced motion), so the provider can remove it and shift the stack.
export function ToastItem({ item, depth, onDismiss, onGone }) {
  const ref = useRef(null);
  const depthRef = useRef(depth);
  const mountedOnce = useRef(false);
  depthRef.current = depth;

  useLayoutEffect(() => {
  const el = ref.current;
  if (!el) return;
  const d = depthRef.current;
  if (prefersReduced()) {
  gsap.set(el, { opacity: depthOpacity(d), y: 0, scale: depthScale(d) });
  return;
  }
  gsap.fromTo(
  el,
  { opacity: 0, y: 18, scale: 0.96 },
  {
  opacity: depthOpacity(d),
  y: 0,
  scale: depthScale(d),
  duration: scaled(0.45),
  ease: "back.out(1.8)",
  overwrite: "auto",
  },
  );
  }, []);

  useEffect(() => {
  if (!mountedOnce.current) {
  mountedOnce.current = true;
  return;
  }
  const el = ref.current;
  if (!el || item.leaving) return;
  gsap.to(el, {
  opacity: depthOpacity(depth),
  scale: depthScale(depth),
  duration: scaled(0.3),
  overwrite: "auto",
  });
  }, [depth, item.leaving]);

  useEffect(() => {
  if (!item.leaving) return undefined;
  const el = ref.current;
  if (!el || prefersReduced()) {
  const handle = setTimeout(() => onGone(item.id), 0);
  return () => clearTimeout(handle);
  }
  gsap.killTweensOf(el);
  gsap.to(el, {
  opacity: 0,
  y: 10,
  duration: scaled(0.3),
  ease: "power2.in",
  overwrite: "auto",
  onComplete: () => onGone(item.id),
  });
  return () => gsap.killTweensOf(el);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.leaving]);

  return (
  <div
  ref={ref}
  data-key={item.id}
  tabIndex={-1}
  onKeyDown={(e) => {
  if (e.key !== "Escape") return;
  e.stopPropagation();
  onDismiss(item.id, { restore: true });
  }}
  className="pointer-events-auto flex items-center gap-[10px] pt-[10px] pr-[12px] pb-[10px] pl-[14px] rounded-[14px] bg-ink text-on-ink shadow-[var(--shadow-pop)] text-[13.5px] font-semibold  outline-none focus-visible:shadow-[0_0_0_3px_var(--ember-soft)]"
  >
  <span className={cn("grid place-items-center w-[18px] h-[18px] rounded-full shrink-0", CHIP[item.type])}>
  <Icon name={item.icon ?? TYPE_ICON[item.type]} cls="w-[12px] h-[12px]" />
  </span>
  <span className="min-w-0 flex-1">{item.message}</span>
  {item.action ? (
  <button
  type="button"
  className="bg-ember text-on-ember rounded-[9px] py-[6px] px-[12px] font-bold shrink-0"
  onClick={() => {
  onDismiss(item.id);
  item.action.onClick?.();
  }}
  >
  {item.action.label}
  </button>
  ) : null}
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="close"
  aria-label="Dismiss notification"
  className="text-inherit"
  onClick={() => onDismiss(item.id)}
  />
  </div>
  );
}

// Viewport: portal to body, outside #root. Live regions are always mounted.
// The visual stack is aria-hidden. Hover and focus inside the viewport pause
// the timers (the provider decides what to do with those signals).
export function ToastViewport({
  items,
  rootRef,
  politeText,
  alertText,
  onDismiss,
  onGone,
  onHoverChange,
  onFocusChange,
}) {
  const live = items.filter((t) => !t.leaving);
  const newestFirst = live.length;

  return createPortal(
  <>
  <div role="status" aria-live="polite" aria-atomic="true" className="sr">
  {politeText}
  </div>
  <div role="alert" aria-atomic="true" className="sr">
  {alertText}
  </div>
  <div
  ref={rootRef}
  aria-hidden="true"
  onPointerEnter={() => onHoverChange(true)}
  onPointerLeave={() => onHoverChange(false)}
  onFocus={() => onFocusChange(true)}
  onBlur={(e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) onFocusChange(false);
  }}
  className="fixed left-0 right-0 mx-auto bottom-[24px] w760:bottom-[calc(86px_+_env(safe-area-inset-bottom))] z-[95] flex flex-col items-center gap-[8px] pointer-events-none w-fit "
  >
  {items.map((item) => {
  const idx = live.indexOf(item);
  const depth = item.leaving ? 0 : newestFirst - 1 - idx;
  return (
  <ToastItem key={item.id} item={item} depth={depth} onDismiss={onDismiss} onGone={onGone} />
  );
  })}
  </div>
  </>,
  document.body,
  );
}
