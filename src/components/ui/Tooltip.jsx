import { Children, cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReduced, scaled } from "../../utils/motion.js";
import { place } from "../../utils/position.js";
import { getPopLayer, useEscapeLayer } from "./Dropdown.jsx";

function assignRef(ref, el) {
  if (typeof ref === "function") ref(el);
  else if (ref && typeof ref === "object") ref.current = el;
}

// Tooltip for one focusable child. mode "describe" links the text with
// aria-describedby. mode "label" renders the text as aria-hidden, for
// icon-only buttons that already carry aria-label.
export default function Tooltip({ content, placement = "top", delay = 400, mode = "describe", children }) {
  const id = useId();
  const child = Children.only(children);
  const anchorRef = useRef(null);
  const tipRef = useRef(null);
  const timerRef = useRef(null);
  const leaveRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const clearTimers = () => {
  clearTimeout(timerRef.current);
  clearTimeout(leaveRef.current);
  };

  const show = (immediate) => {
  clearTimers();
  if (immediate) setOpen(true);
  else timerRef.current = setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
  clearTimers();
  setOpen(false);
  };

  const leave = () => {
  clearTimeout(timerRef.current);
  leaveRef.current = setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => clearTimers, []);

  useEscapeLayer("tooltip", hide, open);

  useLayoutEffect(() => {
  if (open) {
  setMounted(true);
  return;
  }
  const el = tipRef.current;
  if (!el || prefersReduced()) {
  setMounted(false);
  return;
  }
  gsap.killTweensOf(el);
  gsap.to(el, { opacity: 0, duration: scaled(0.1), onComplete: () => setMounted(false) });
  }, [open]);

  useLayoutEffect(() => {
  if (!open || !mounted) return;
  const tip = tipRef.current;
  const anchor = anchorRef.current;
  if (!tip || !anchor) return;
  const where = placement === "top" || placement === "bottom" ? `${placement}-center` : placement;
  place(anchor, tip, { placement: where, offset: 8, margin: 12 });
  gsap.killTweensOf(tip);
  if (prefersReduced()) gsap.set(tip, { opacity: 1, y: 0 });
  else gsap.fromTo(tip, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: scaled(0.16), ease: "power2.out" });
  }, [open, mounted]);

  const childRef = child.props.ref;
  const anchorProps = {
  ref: (el) => {
  anchorRef.current = el;
  assignRef(childRef, el);
  },
  onPointerEnter: (e) => {
  if (e.pointerType === "mouse") show(false);
  },
  onPointerLeave: leave,
  onFocus: (e) => {
  if (e.currentTarget.matches(":focus-visible")) show(true);
  },
  onBlur: hide,
  };
  if (mode === "describe" && open) anchorProps["aria-describedby"] = id;

  const tip = mounted
  ? createPortal(
  <div
  ref={tipRef}
  id={id}
  role={mode === "describe" ? "tooltip" : undefined}
  aria-hidden={mode === "label" ? true : undefined}
  className="fixed pointer-events-none rounded-[10px] px-[10px] py-[6px] text-[12.5px] text-text  z-[90] bg-float border border-line shadow-[var(--shadow-pop)]"
  >
  {content}
  </div>,
  getPopLayer(),
  )
  : null;

  return (
  <>
  {cloneElement(child, anchorProps)}
  {tip}
  </>
  );
}
