import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "../../utils/cn.js";
import { placePill } from "../../utils/motion.js";
import { Icon } from "./Icon.jsx";

export default function SegmentedControl({
  value,
  onChange,
  options = [],
  label,
  size = "md",
  as = "buttons",
  className,
  ...rest
}) {
  const trackRef = useRef(null);
  const pillRef = useRef(null);
  const btnRefs = useRef([]);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const isTabs = as === "tabs";

  useLayoutEffect(() => {
    placePill(pillRef.current, trackRef.current, btnRefs.current[activeIndex], true);
  }, [value, activeIndex, options.length]);

  useEffect(() => {
    const onResize = () =>
      placePill(pillRef.current, trackRef.current, btnRefs.current[activeIndex], false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  const select = (i) => {
    const next = options[i];
    if (!next) return;
    onChange?.(next.value);
    btnRefs.current[i]?.focus();
  };

  const onKeyDown = (e) => {
    if (!isTabs) return;
    const last = options.length - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = activeIndex + dir > last ? 0 : activeIndex + dir < 0 ? last : activeIndex + dir;
      select(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(0);
    } else if (e.key === "End") {
      e.preventDefault();
      select(last);
    }
  };

  return (
    <div
      ref={trackRef}
      role={isTabs ? "tablist" : "group"}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("seg", className)}
      {...rest}
    >
      <span ref={pillRef} className="seg__pill" aria-hidden="true" />
      {options.map((o, i) => {
        const active = o.value === value;
        const common = cn(
          "seg__btn pointer-coarse:min-h-[44px]",
          size === "sm" && "px-[10px] py-[5px] text-[12px]",
          active ? "text-text" : "text-muted",
        );
        const content = (
          <>
            {o.icon ? <Icon name={o.icon} /> : null}
            <span>{o.label}</span>
            {o.count != null ? (
              <span className="tabular-nums text-faint">{o.count}</span>
            ) : null}
          </>
        );
        if (isTabs) {
          return (
            <button
              key={String(o.value)}
              ref={(node) => {
                btnRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active ? "true" : "false"}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange?.(o.value)}
              className={cn(common, "inline-flex items-center gap-[6px]")}
            >
              {content}
            </button>
          );
        }
        return (
          <button
            key={String(o.value)}
            ref={(node) => {
              btnRefs.current[i] = node;
            }}
            type="button"
            aria-pressed={active ? "true" : "false"}
            onClick={() => onChange?.(o.value)}
            className={cn(common, "inline-flex items-center gap-[6px]")}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
