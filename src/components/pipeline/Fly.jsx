import { useLayoutEffect, useRef } from "react";
import { gsap } from "../../utils/motion.js";

export default function Fly({ fly, onDone }) {
  const ref = useRef(null);
  const started = useRef(false);
  useLayoutEffect(() => {
    if (started.current) return;
    started.current = true;
    const el = ref.current;
    el.append(fly.face);
    gsap.set(el, { x: fly.rect.left, y: fly.rect.top });
    fly.run(el, () => onDone(fly.id));
  }, []);
  return <div
    className={`${fly.cls} z-[85] pointer-events-none fixed top-0 left-0`}
    aria-hidden="true"
    style={{ width: `${fly.rect.width}px`, height: `${fly.rect.height}px` }}
    ref={ref}
  />;
}
