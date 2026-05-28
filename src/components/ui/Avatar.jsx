import { cn } from "../../utils/cn.js";
import Tooltip from "./Tooltip.jsx";

const SIZES = {
  xs: "av--xs",
  sm: "av--sm",
  md: "av--md",
  lg: "av--lg",
  xl: "av--xl",
};

function hashTone(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

function initials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = "sm",
  tone,
  id,
  ring = "none",
  decorative = true,
  tooltip = false,
  className,
  ...rest
}) {
  const t = tone ?? hashTone(id ?? name);
  const avatar = (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? "true" : undefined}
      className={cn(
        "av",
        SIZES[size] ?? SIZES.sm,
        src ? undefined : `av--t${t}`,
        ring === "surface" && "shadow-[0_0_0_2px_var(--surface)]",
        className,
      )}
      {...rest}
    >
      {src ? <img src={src} alt="" className="size-full rounded-[50%] object-cover" /> : initials(name)}
    </span>
  );

  if (!tooltip) return avatar;

  return (
    <Tooltip content={name} mode="label">
      <span tabIndex={0} role="img" aria-label={name} className="inline-flex rounded-[50%]">
        {avatar}
      </span>
    </Tooltip>
  );
}
