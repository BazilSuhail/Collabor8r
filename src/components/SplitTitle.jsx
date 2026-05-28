import { Fragment, useLayoutEffect, useRef } from "react";
import { gsap, prefersReduced } from "../utils/motion.js";
export const SPLIT = {
  from: { yPercent: 115, rotation: 6 },
  to: { yPercent: 0, rotation: 0, duration: 0.85, ease: "power4.out", stagger: 0.022, clearProps: "transform" }
};
export function revealChars(el, delay = 0) {
  if (!el) return null;
  const chars = el.querySelectorAll(".ch");
  if (!chars.length) return null;
  if (prefersReduced()) {
    gsap.set(chars, { yPercent: 0, rotation: 0, clearProps: "transform" });
    return null;
  }
  return gsap.fromTo(chars, SPLIT.from, { ...SPLIT.to, delay });
}
export default function SplitTitle({ text, as: Tag = "h1", className = "head__title", delay = 0, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const tween = revealChars(ref.current, delay);
    return () => tween?.kill();
  }, [text, delay]);
  const lines = String(text).split("\n");
  return <Tag
    className={className}
    tabIndex={-1}
    aria-label={text}
    data-split={text}
    ref={ref}
    {...rest}
  >
      {lines.map((line, li) => <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(" ").map((word, wi) => <Fragment key={wi}>
              {wi > 0 && " "}
              <span className="word" aria-hidden="true">
                {[...word].map((ch, ci) => <span className="ch" key={ci}>{ch}</span>)}
              </span>
            </Fragment>)}
        </Fragment>)}
    </Tag>;
}
