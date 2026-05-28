import { useCallback, useRef } from "react";
import { cn } from "../../utils/cn.js";
import { press, useMagnetic } from "../../utils/motion.js";
import { Icon } from "./Icon.jsx";
import Spinner from "./Spinner.jsx";

const idle = { current: null };

const VARIANTS = {
  ink: "btn--ink",
  ember: "btn--ember",
  ghost: "btn--ghost",
  soft: "btn--soft",
  danger: "btn--danger",
};

export default function Button({
  variant = "ghost",
  size = "md",
  icon,
  iconOnly = false,
  pressed,
  loading = false,
  magnetic = false,
  type = "button",
  as = "button",
  ref,
  onClick,
  disabled,
  className,
  children,
  ...rest
}) {
  const inner = useRef(null);
  const setRef = useCallback(
    (node) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useMagnetic(magnetic ? inner : idle);

  if (import.meta.env.DEV && iconOnly && !rest["aria-label"]) {
    throw new Error("Button: iconOnly requires an aria-label");
  }

  const handleClick = (e) => {
    press(e.currentTarget);
    onClick?.(e);
  };

  const classes = cn(
    iconOnly
      ? cn("ibtn", variant === "ghost" && "ibtn--ghost", size === "sm" && "ibtn--sm")
      : cn("btn", VARIANTS[variant], size === "sm" && "btn--sm"),
    "pointer-coarse:min-h-[44px]",
    loading && "is-busy [&.is-busy]:bg-[color:var(--ember-soft)] [&.is-busy]:text-[color:var(--ember-t)] [&.is-busy]:opacity-100",
    className,
  );

  const isBusy = Boolean(loading);
  const isDisabled = Boolean(disabled) || isBusy;
  const Comp = as;
  const typeProp = as === "button" ? type : undefined;

  return (
    <Comp
      {...rest}
      type={typeProp}
      ref={setRef}
      className={classes}
      disabled={as === "button" ? isDisabled : undefined}
      aria-busy={isBusy ? "true" : undefined}
      aria-pressed={pressed}
      onClick={handleClick}
    >
      {isBusy ? (
        <span aria-hidden="true" className="inline-flex">
          <Spinner size="sm" tone="current" />
        </span>
      ) : null}
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
