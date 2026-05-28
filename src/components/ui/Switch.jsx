import { useId } from "react";
import { cn } from "../../utils/cn.js";

export default function Switch({
  checked = false,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
  ...rest
}) {
  const id = useId();
  return (
    <span className={cn("inline-flex items-center gap-[10px]", className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked ? "true" : "false"}
        aria-label={hideLabel ? label : undefined}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn("switch", "disabled:opacity-[0.45] disabled:cursor-not-allowed")}
        {...rest}
      />
      {label ? (
        <label
          htmlFor={id}
          className={hideLabel ? "sr" : "text-[13.5px] font-semibold text-text cursor-pointer"}
        >
          {label}
        </label>
      ) : null}
    </span>
  );
}
