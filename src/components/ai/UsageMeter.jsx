import { useLayoutEffect, useRef } from "react";
import { cn } from "../../utils/cn.js";
import { gsap, scaled } from "../../utils/motion.js";

// Daily AI calls used against the server limit, plus this month's count.
export default function UsageMeter({ usage }) {
  const fillRef = useRef(null);
  const limit = Number(usage?.dailyLimit ?? 0);
  const today = Number(usage?.today?.calls ?? 0);
  const month = Number(usage?.month?.calls ?? 0);
  const ratio = limit > 0 ? Math.min(today / limit, 1) : 0;
  const atLimit = limit > 0 && today >= limit;

  useLayoutEffect(() => {
    const fill = fillRef.current;
    if (!fill) return undefined;
    const tween = gsap.fromTo(
      fill,
      { scaleX: 0 },
      { scaleX: ratio, transformOrigin: "left center", duration: scaled(0.9), ease: "power3.out" },
    );
    return () => tween.kill();
  }, [ratio]);

  return (
    <div className="grid gap-[10px]">
      <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
        <span className="text-[14px] font-semibold text-text">Today</span>
        <span className={cn("text-[14px] tabular-nums", atLimit ? "font-semibold text-bad" : "text-muted")}>
          {limit > 0 ? `${today} of ${limit} AI calls` : `${today} AI calls`}
          {atLimit ? " · limit reached" : ""}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Daily AI calls used"
        aria-valuemin={0}
        aria-valuemax={limit > 0 ? limit : today}
        aria-valuenow={today}
        className="meter"
      >
        <span
          ref={fillRef}
          className={cn("meter__fill", atLimit ? "" : "meter__fill--spruce")}
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <p className="text-[13px] text-muted tabular-nums">This month: {month} AI calls</p>
    </div>
  );
}
