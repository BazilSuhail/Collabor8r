import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReduced()) gsap.globalTimeline.timeScale(200);
export { gsap, ScrollTrigger };
export const scaled = (n) => (prefersReduced() ? 0 : n);
export function cardRise(els, { y = 34, stagger = 0.07, delay = 0 } = {}) {
  if (!els || !els.length) return gsap.timeline();
  return gsap.fromTo(
    els,
    { opacity: 0, y, scale: 0.985 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: scaled(0.9),
      ease: "power3.out",
      stagger: scaled(stagger),
      delay: scaled(delay),
      clearProps: "transform,opacity",
    },
  );
}
export function fadeUp(
  els,
  { x = 0, y = 12, stagger = 0.045, delay = 0 } = {},
) {
  if (!els || !els.length) return gsap.timeline();
  return gsap.fromTo(
    els,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: scaled(0.55),
      ease: "power3.out",
      stagger: scaled(stagger),
      delay: scaled(delay),
      clearProps: "transform,opacity",
    },
  );
}
export function popIn(els, { from = 0.6, delay = 0, stagger = 0.05 } = {}) {
  if (!els || !els.length || prefersReduced()) return;
  gsap.fromTo(
    els,
    { scale: from, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: "back.out(3)",
      delay,
      stagger,
      overwrite: "auto",
      clearProps: "transform,opacity",
    },
  );
}
export function flash(el) {
  if (!el) return;
  el.classList.remove("is-flash");
  void el.offsetWidth;
  el.classList.add("is-flash");
  if (prefersReduced()) return;
  gsap.fromTo(
    el,
    { y: -4, scale: 1.06 },
    {
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: "back.out(2.4)",
      overwrite: "auto",
      clearProps: "transform",
    },
  );
}
const counters = new WeakMap();
export function countUp(
  el,
  value,
  fmt = (n) => Math.round(n).toLocaleString(),
  { duration = 1.2, delay = 0, from } = {},
) {
  if (!el) return;
  let state = counters.get(el);
  if (!state) counters.set(el, (state = { v: from ?? 0 }));
  if (from !== void 0) state.v = from;
  gsap.killTweensOf(state);
  if (prefersReduced() || !duration || state.v === value) {
    state.v = value;
    el.textContent = fmt(value);
    return;
  }
  el.textContent = fmt(state.v);
  gsap.to(state, {
    v: value,
    duration,
    delay,
    ease: "power3.out",
    onUpdate: () => {
      el.textContent = fmt(state.v);
    },
    onComplete: () => {
      el.textContent = fmt(value);
    },
  });
}
export function placePill(pill, track, active, animate = true, radius = 999) {
  if (!pill) return;
  if (!track || !active || !active.offsetWidth) {
    gsap.set(pill, { opacity: 0 });
    return;
  }
  const w = track.scrollWidth;
  const h = track.offsetHeight;
  const left = active.offsetLeft;
  const right = w - (active.offsetLeft + active.offsetWidth);
  const top = active.offsetTop;
  const bottom = h - (active.offsetTop + active.offsetHeight);
  const inset = (l, r) =>
    `inset(${top}px ${r}px ${bottom}px ${l}px round ${radius}px)`;
  const prev = pill.__lr;
  pill.__lr = [left, right];
  if (
    !animate ||
    prefersReduced() ||
    !prev ||
    Number(gsap.getProperty(pill, "opacity")) === 0
  ) {
    gsap.set(pill, { clipPath: inset(left, right), opacity: 1 });
    return;
  }
  const f = pill.__lrProxy || (pill.__lrProxy = { l: prev[0], r: prev[1] });
  f.l = prev[0];
  f.r = prev[1];
  const forward = left > prev[0];
  gsap.killTweensOf(f);
  const paint = () => gsap.set(pill, { clipPath: inset(f.l, f.r) });
  gsap.to(f, {
    l: left,
    duration: forward ? 0.55 : 0.36,
    ease: forward ? "power3.inOut" : "power3.out",
    onUpdate: paint,
  });
  gsap.to(f, {
    r: right,
    duration: forward ? 0.36 : 0.55,
    ease: forward ? "power3.out" : "power3.inOut",
    onUpdate: paint,
  });
}
export function tileRise(els, { stagger = 0.06, delay = 0 } = {}) {
  if (!els || !els.length) return gsap.timeline();
  return gsap.fromTo(
    els,
    { opacity: 0, y: 40, rotation: (i) => (i % 2 ? 3 : -3), scale: 0.94 },
    {
      opacity: 1,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: scaled(0.8),
      ease: "back.out(1.4)",
      stagger: scaled(stagger),
      delay: scaled(delay),
      clearProps: "transform,opacity",
    },
  );
}
export function lift(el) {
  if (!el || prefersReduced()) return () => {};
  const enter = () =>
    gsap.to(el, { y: -4, duration: 0.45, ease: "power3.out" });
  const leave = () =>
    gsap.to(el, {
      y: 0,
      duration: 0.5,
      ease: "power3.out",
      clearProps: "transform",
    });
  el.addEventListener("pointerenter", enter);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointerenter", enter);
    el.removeEventListener("pointerleave", leave);
    gsap.killTweensOf(el);
  };
}
export function press(el) {
  if (!el || prefersReduced()) return;
  const target = el.querySelector("svg") ?? el;
  gsap.fromTo(
    target,
    { scale: 0.72 },
    { scale: 1, duration: 0.55, ease: "back.out(3)", overwrite: true },
  );
}
export function settle(el) {
  if (!el) return;
  gsap.set([el, ...el.querySelectorAll("*")], { clearProps: "all" });
}
export function flip(root, mutate) {
  if (!root) return mutate();
  const before = new Map();
  root
    .querySelectorAll("[data-key]")
    .forEach((el) => before.set(el.dataset.key, el.getBoundingClientRect()));
  mutate();
  root.querySelectorAll("[data-key]").forEach((el) => {
    const prev = before.get(el.dataset.key);
    const now = el.getBoundingClientRect();
    if (!prev) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: scaled(0.45),
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      );
      return;
    }
    const dx = prev.left - now.left;
    const dy = prev.top - now.top;
    if (!dx && !dy) return;
    gsap.fromTo(
      el,
      { x: dx, y: dy },
      {
        x: 0,
        y: 0,
        duration: scaled(0.55),
        ease: "power3.inOut",
        clearProps: "transform",
      },
    );
  });
}
export function useEntry(ref, build, deps = []) {
  const built = useRef(build);
  built.current = build;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    // A function returned by build runs on ctx.revert() (for example bindLift's cleanup).
    const ctx = gsap.context((self) =>
      built.current({
        gsap,
        q: (sel) => self.selector(sel),
        root,
        reduced: prefersReduced(),
      }),
    ref);
    return () => ctx.revert();
  }, deps);
}
export function useViewEntry(route, build, deps = []) {
  const built = useRef(build);
  built.current = build;
  useLayoutEffect(() => {
    const root = document.querySelector(`[data-view="${route}"]`);
    if (!root) return;
    // A function returned by build runs on ctx.revert() (F.1 returns bindLift(root)).
    const ctx = gsap.context((self) =>
      built.current({
        gsap,
        q: (sel) => self.selector(sel),
        root,
        reduced: prefersReduced(),
      }),
    root);
    return () => ctx.revert();
  }, deps);
}
export function useMagnetic(ref, strength = 0.35) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength,
        duration: 0.4,
        ease: "power3.out",
      });
    };
    const reset = () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "back.out(2)" });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
      gsap.killTweensOf(el);
    };
  }, [ref, strength]);
}

export function bindLift(root) {
  if (!root) return () => {};
  const offs = [...root.querySelectorAll("[data-lift]")].map(lift);
  return () => offs.forEach((f) => f && f());
}
