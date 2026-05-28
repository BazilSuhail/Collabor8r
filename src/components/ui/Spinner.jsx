import { cn } from "../../utils/cn.js";

const PX = { sm: 16, md: 20, lg: 28 };

export default function Spinner({
  size = "md",
  tone = "ember",
  label = "Loading",
  variant = "ring",
  className,
  ...rest
}) {
  if (variant === "dots") {
    return (
      <span role="status" className={cn("inline-flex gap-[4px] items-center", className)} {...rest}>
        <i className="rounded-[50%] bg-faint w-[6px] h-[6px]" aria-hidden="true" />
        <i className="rounded-[50%] bg-faint w-[6px] h-[6px]" aria-hidden="true" />
        <i className="rounded-[50%] bg-faint w-[6px] h-[6px]" aria-hidden="true" />
        <span className="sr">{label}</span>
      </span>
    );
  }
  const px = PX[size] ?? PX.md;
  const arc = tone === "current" ? "stroke-current" : "stroke-ember";
  return (
    <span role="status" className={cn("inline-flex shrink-0", className)} {...rest}>
      <svg
        viewBox="0 0 24 24"
        width={px}
        height={px}
        aria-hidden="true"
        focusable="false"
        className="animate-[spin_.8s_linear_infinite] motion-reduce:animate-none"
      >
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="3.5" className="stroke-[color:var(--line-2)]" />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="14 60"
          className={arc}
        />
      </svg>
      <span className="sr">{label}</span>
    </span>
  );
}
