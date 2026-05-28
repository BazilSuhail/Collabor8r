import { cn } from "../../utils/cn.js";
import { Icon } from "./Icon.jsx";

export default function FilterChip({
  pressed = false,
  onClick,
  icon,
  count,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={cn("chip pointer-coarse:min-h-[44px]", className)}
      aria-pressed={pressed ? "true" : "false"}
      onClick={onClick}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
      {count != null ? <b>{count}</b> : null}
    </button>
  );
}
