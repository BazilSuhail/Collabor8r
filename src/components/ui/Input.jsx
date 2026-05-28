import { useId } from "react";
import { cn } from "../../utils/cn.js";
import { Icon } from "./Icon.jsx";

export default function Input({
  label,
  hideLabel = false,
  hint,
  error,
  as = "input",
  variant = "field",
  size = "md",
  wide = false,
  id,
  ref,
  className,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy =
    [rest["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;
  const isTextarea = as === "textarea";
  const Control = isTextarea ? "textarea" : "input";

  const controlClass = isTextarea
    ? cn(
        "w-full min-h-[96px] py-[10px] px-[14px] rounded-[12px] border border-solid border-line-2 bg-surface text-text resize-y outline-none focus:border-ember focus:shadow-[0_0_0_3px_var(--ember-soft)]",
        error && "border-bad",
      )
    : cn("input", size === "sm" && "h-[36px] text-[13px]", error && "border-bad");

  const control = (
    <Control
      ref={ref}
      id={fieldId}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy}
      className={controlClass}
      {...rest}
    />
  );

  if (variant === "bare") {
    return (
      <Control
        ref={ref}
        id={fieldId}
        aria-label={label}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(controlClass, className)}
        {...rest}
      />
    );
  }

  const labelEl = label ? (
    <label htmlFor={fieldId} className={hideLabel ? "sr" : "field__label"}>
      {label}
    </label>
  ) : null;

  const body =
    variant === "search" ? (
      <div className={cn("search", size === "sm" && "h-[36px]", error && "border-bad")}>
        <Icon name="search" />
        <input
          ref={ref}
          id={fieldId}
          type="search"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className="w-full h-full min-w-0 bg-transparent border-0 outline-none text-text"
          {...rest}
        />
      </div>
    ) : (
      control
    );

  return (
    <div className={cn("field", wide && "field--wide", className)}>
      {labelEl}
      {body}
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-bad text-[13px] font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
