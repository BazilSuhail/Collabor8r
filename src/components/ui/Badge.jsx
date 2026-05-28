import { cn } from "../../utils/cn.js";
import { Icon } from "./Icon.jsx";

const SOFT = {
  ember: "bg-[color:var(--ember-soft)] text-[color:var(--ember-t)]",
  iris: "bg-[color:var(--iris-soft)] text-[color:var(--iris-t)]",
  spruce: "bg-[color:var(--spruce-soft)] text-[color:var(--spruce-t)]",
  saffron: "bg-[color:var(--saffron-soft)] text-[color:var(--saffron-t)]",
  plain: "bg-well text-muted",
  up: "bg-[color:var(--spruce-soft)] text-[color:var(--spruce-t)]",
  down: "bg-[color:var(--ember-soft)] text-[color:var(--ember-t)]",
};

const DOT = {
  ember: "bg-ember",
  iris: "bg-iris",
  spruce: "bg-spruce",
  saffron: "bg-saffron",
  plain: "bg-faint",
  up: "bg-spruce",
  down: "bg-ember",
};

export default function Badge({
  variant = "badge",
  tone = "plain",
  icon,
  hot = false,
  label,
  className,
  children,
  ...rest
}) {
  if (variant === "dot") {
    return (
      <span
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : "true"}
        className={cn("inline-block w-[8px] h-[8px] rounded-[50%] shrink-0", DOT[tone] ?? DOT.plain, className)}
        {...rest}
      />
    );
  }

  if (variant === "count") {
    return (
      <span
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px] rounded-full text-[11.5px] font-bold tabular-nums",
          hot ? "bg-ember text-on-ember" : SOFT[tone] ?? SOFT.plain,
          className,
        )}
        {...rest}
      >
        {children}
      </span>
    );
  }

  if (variant === "status") {
    return (
      <span
        aria-label={label}
        className={cn(
          "status",
          hot ? "bg-ember text-on-ember" : SOFT[tone] ?? SOFT.plain,
          className,
        )}
        {...rest}
      >
        {icon ? <Icon name={icon} /> : null}
        {children}
      </span>
    );
  }

  return (
    <span
      aria-label={label}
      className={cn(
        "badge",
        hot ? "bg-ember text-on-ember" : `badge--${SOFT[tone] ? tone : "plain"}`,
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}
