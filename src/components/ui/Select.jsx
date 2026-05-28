import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { place, inViewport } from "../../utils/position.js";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";
import { Icon } from "./Icon.jsx";
import { useEscapeLayer, useOverlayMotion, usePopoverSlot, getPopLayer } from "./Dropdown.jsx";
import { cn } from "../../utils/cn.js";

const TONE_DOT = {
  ember: "bg-ember",
  iris: "bg-iris",
  spruce: "bg-spruce",
  saffron: "bg-saffron",
  plain: "bg-faint",
};
const TYPE_WINDOW = 500;
const SEARCH_DELAY = 200;

function flatten(groups) {
  return groups.flatMap((g) => g.options);
}

export default function Select({
  value,
  onChange,
  options,
  groups,
  label,
  hideLabel = false,
  placeholder = "Select",
  name,
  disabled = false,
  error,
  hint,
  size = "md",
  variant = "field",
  searchable = false,
  multiple = false,
  loadOptions,
  required = false,
  className,
  ...rest
}) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const triggerId = `${uid}-trigger`;
  const listId = `${uid}-list`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const optId = (i) => `${uid}-o${i}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [asyncOptions, setAsyncOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const searchRef = useRef(null);
  const typed = useRef({ text: "", at: 0 });
  const seen = useRef({});
  const loadRef = useRef(loadOptions);
  const slot = usePopoverSlot();
  const mounted = useOverlayMotion(open, popRef);

  loadRef.current = loadOptions;

  const sourceGroups = loadOptions
  ? [{ label: null, options: asyncOptions }]
  : groups ?? [{ label: null, options: options ?? [] }];
  sourceGroups.forEach((g) => g.options.forEach((o) => {
  seen.current[o.value] = o;
  }));

  const q = query.trim().toLowerCase();
  const visibleGroups = sourceGroups
  .map((g) => ({
  label: g.label,
  options: searchable && !loadOptions && q
  ? g.options.filter((o) => String(o.label).toLowerCase().includes(q))
  : g.options,
  }))
  .filter((g) => g.options.length > 0);
  const flat = flatten(visibleGroups);
  const navigable = flat.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const vals = multiple ? (Array.isArray(value) ? value : []) : null;
  const isSelected = (v) => (multiple ? vals.includes(v) : value === v);
  const chosen = multiple
  ? vals.map((v) => seen.current[v] ?? { value: v, label: String(v) })
  : [seen.current[value]].filter(Boolean);

  const firstNav = () => (navigable.length ? navigable[0] : -1);
  const selectedFlat = () => flat.findIndex((o) => isSelected(o.value) && !o.disabled);

  const openList = () => {
  if (disabled) return;
  setQuery("");
  setActive(selectedFlat() >= 0 ? selectedFlat() : firstNav());
  setOpen(true);
  };

  const closeList = (focusTrigger) => {
  setOpen(false);
  if (focusTrigger) triggerRef.current?.focus();
  };

  const pick = (opt, closeAfter) => {
  if (!opt || opt.disabled) return;
  if (multiple) {
  const next = isSelected(opt.value) ? vals.filter((v) => v !== opt.value) : [...vals, opt.value];
  onChange?.(next);
  return;
  }
  onChange?.(opt.value);
  if (closeAfter) closeList(true);
  };

  const move = (dir, step = 1) => {
  if (!navigable.length) return;
  const pos = navigable.indexOf(active);
  let next;
  if (dir > 0) {
  next = pos < 0 ? navigable[0] : navigable[Math.min(navigable.length - 1, pos + step)];
  } else {
  next = pos < 0 ? navigable[navigable.length - 1] : navigable[Math.max(0, pos - step)];
  }
  setActive(next);
  };

  const typeahead = (ch) => {
  const now = Date.now();
  typed.current = {
  text: (now - typed.current.at > TYPE_WINDOW ? "" : typed.current.text) + ch.toLowerCase(),
  at: now,
  };
  const start = Math.max(0, navigable.indexOf(active) + 1);
  for (let k = 0; k < navigable.length; k += 1) {
  const idx = navigable[(start + k) % navigable.length];
  if (String(flat[idx].label).toLowerCase().startsWith(typed.current.text)) {
  setActive(idx);
  return;
  }
  }
  };

  useEffect(() => {
  if (!open || !loadRef.current) return undefined;
  let alive = true;
  setLoading(true);
  const timer = setTimeout(() => {
  loadRef.current(query.trim())
  .then((opts) => {
  if (alive) setAsyncOptions(opts ?? []);
  })
  .catch(() => {
  if (alive) setAsyncOptions([]);
  })
  .finally(() => {
  if (alive) setLoading(false);
  });
  }, SEARCH_DELAY);
  return () => {
  alive = false;
  clearTimeout(timer);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  useLayoutEffect(() => {
  if (!open || !mounted) return undefined;
  const pop = popRef.current;
  const anchor = triggerRef.current;
  if (!pop || !anchor) return undefined;
  pop.style.minWidth = `${anchor.offsetWidth}px`;
  place(anchor, pop, { placement: "bottom-start", offset: 8, margin: 12 });
  slot.claim(listId, () => setOpen(false));

  if (searchable) searchRef.current?.focus({ preventScroll: true });

  const reposition = () => {
  if (!inViewport(anchor)) setOpen(false);
  else place(anchor, pop, { placement: "bottom-start", offset: 8, margin: 12 });
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, true);

  let alive = true;
  const onDown = (e) => {
  if (pop.contains(e.target) || anchor.contains(e.target)) return;
  setOpen(false);
  };
  queueMicrotask(() => {
  if (alive) document.addEventListener("pointerdown", onDown, true);
  });
  return () => {
  alive = false;
  window.removeEventListener("resize", reposition);
  window.removeEventListener("scroll", reposition, true);
  document.removeEventListener("pointerdown", onDown, true);
  slot.release(listId);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEscapeLayer("popup", () => closeList(true), open);

  const onKey = (e) => {
  if (disabled) return;
  if (!open) {
  if (["Enter", " ", "ArrowUp", "ArrowDown"].includes(e.key) || (e.altKey && e.key === "ArrowDown")) {
  e.preventDefault();
  openList();
  return;
  }
  if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
  openList();
  typeahead(e.key);
  }
  return;
  }
  if (e.key === "Backspace" && multiple && searchable && !query && vals.length) {
  e.preventDefault();
  onChange?.(vals.slice(0, -1));
  return;
  }
  switch (e.key) {
  case "ArrowDown":
  e.preventDefault();
  move(1);
  return;
  case "ArrowUp":
  e.preventDefault();
  if (e.altKey) {
  pick(flat[active], true);
  return;
  }
  move(-1);
  return;
  case "Home":
  if (searchable) return;
  e.preventDefault();
  setActive(firstNav());
  return;
  case "End":
  if (searchable) return;
  e.preventDefault();
  setActive(navigable[navigable.length - 1] ?? -1);
  return;
  case "PageDown":
  e.preventDefault();
  move(1, 10);
  return;
  case "PageUp":
  e.preventDefault();
  move(-1, 10);
  return;
  case " ":
  if (searchable) return;
  e.preventDefault();
  pick(flat[active], false);
  return;
  case "Enter":
  e.preventDefault();
  pick(flat[active], !multiple);
  return;
  case "Tab":
  if (!multiple) pick(flat[active], false);
  setOpen(false);
  return;
  default:
  break;
  }
  if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
  typeahead(e.key);
  }
  };

  const activeFlat = active;
  const hasError = Boolean(error);
  const describedBy = [hint && !hasError ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  const triggerProps = {
  ref: triggerRef,
  id: triggerId,
  role: searchable || variant === "button" ? "button" : "combobox",
  tabIndex: disabled ? -1 : 0,
 "aria-haspopup": "listbox",
 "aria-expanded": open,
 "aria-controls": open ? listId : undefined,
 "aria-labelledby": labelId,
 "aria-activedescendant": !searchable && open && activeFlat >= 0 ? optId(activeFlat) : undefined,
 "aria-required": required || undefined,
 "aria-invalid": hasError || undefined,
 "aria-describedby": describedBy,
 "aria-disabled": disabled || undefined,
  onClick: () => {
  if (disabled) return;
  if (open) closeList(false);
  else openList();
  },
  onKeyDown: onKey,
  };

  const placeholderText = chosen.length ? null : <span className="text-faint">{placeholder}</span>;

  const trigger = variant === "button" ? (
  <Button variant="ghost" size={size === "sm" ? "sm" : "md"} icon="filter" {...triggerProps} disabled={disabled}>
  {chosen.length ? chosen.map((c) => c.label).join(", ") : label}
  </Button>
  ) : (
  <div
  {...triggerProps}
  className={cn(
 "select relative flex items-center bg-none w-full min-w-0 pr-[34px] pl-[14px] rounded-ctl border border-line-2 bg-surface text-text font-semibold outline-none",
  size === "sm" ? "min-h-[36px] text-[13px] py-[4px]" : "min-h-[42px] py-[6px]",
 "focus-visible:border-ember focus-visible:shadow-[0_0_0_3px_var(--ember-soft)]",
  hasError && "border-bad",
  disabled && "opacity-[0.45] cursor-not-allowed",
  multiple ? "flex-wrap gap-[6px]" : "",
  )}
  >
  {multiple ? (
  chosen.length ? (
  chosen.map((c) => (
  <span key={c.value} className="chip h-[26px] px-[8px] gap-[4px]">
  {c.label}
  <button
  type="button"
  tabIndex={-1}
  aria-label={`Remove ${c.label}`}
  className="inline-flex"
  onClick={(e) => {
  e.stopPropagation();
  onChange?.(vals.filter((v) => v !== c.value));
  }}
  >
  <Icon name="close" />
  </button>
  </span>
  ))
  ) : (
  placeholderText
  )
  ) : chosen.length ? (
  <span className="truncate">{chosen[0].label}</span>
  ) : (
  placeholderText
  )}
  <Icon
  name="down"
  cls={cn("absolute right-[12px] top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted transition-transform", open && "rotate-180")}
  />
  </div>
  );

  let popup = null;
  if (mounted) {
  const hasOptions = flat.length > 0;
  popup = createPortal(
  <div
  ref={popRef}
  className="pop pointer-events-auto fixed z-[80] rounded-[15px] p-[6px] min-w-[200px]  max-h-[min(52dvh,420px)] overflow-auto bg-float border border-line shadow-[var(--shadow-pop)] flex flex-col gap-[2px]"
  onKeyDown={searchable ? onKey : undefined}
  >
  {searchable ? (
  <div className="search px-[8px] py-[6px]">
  <Icon name="search" />
  <input
  ref={searchRef}
  type="search"
  role="combobox"
  aria-autocomplete="list"
  aria-expanded="true"
  aria-controls={listId}
  aria-activedescendant={activeFlat >= 0 ? optId(activeFlat) : undefined}
  aria-label={label ?? placeholder}
  value={query}
  placeholder="Search"
  onChange={(e) => {
  setQuery(e.target.value);
  setActive(-1);
  }}
  />
  </div>
  ) : null}
  <div id={listId} role="listbox" aria-labelledby={labelId} aria-multiselectable={multiple || undefined} className="flex flex-col gap-[2px]">
  {visibleGroups.map((g, gi) => {
  const groupId = `${uid}-g${gi}`;
  return (
  <div key={g.label ?? gi} role={g.label ? "group" : undefined} aria-labelledby={g.label ? groupId : undefined}>
  {g.label ? (
  <div id={groupId} className="text-[11px] uppercase tracking-[.07em] text-muted px-[12px] pt-[8px]">
  {g.label}
  </div>
  ) : null}
  {g.options.map((o) => {
  const flatIndex = flat.indexOf(o);
  const selected = isSelected(o.value);
  const isActive = flatIndex === activeFlat;
  return (
  <div
  key={String(o.value)}
  id={optId(flatIndex)}
  role="option"
  aria-selected={selected}
  aria-disabled={o.disabled || undefined}
  onMouseMove={() => {
  if (!o.disabled) setActive(flatIndex);
  }}
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
  if (o.disabled) return;
  pick(o, !multiple);
  if (multiple && searchable) searchRef.current?.focus();
  }}
  className={cn(
 "menu__item flex items-center gap-[10px] cursor-pointer",
  isActive && "bg-well",
  selected && "font-bold",
  o.disabled && "opacity-[0.45] cursor-not-allowed",
  )}
  >
  {o.tone ? <span className={cn("w-[8px] h-[8px] rounded-[3px] shrink-0", TONE_DOT[o.tone] ?? "bg-faint")} /> : null}
  {!o.tone && o.icon ? <Icon name={o.icon} /> : null}
  <span className="flex-1 min-w-0">
  <span className="block truncate">{o.label}</span>
  {o.description ? <span className="block text-[12px] text-muted font-normal">{o.description}</span> : null}
  </span>
  {selected ? <Icon name="check" cls="text-[color:var(--ember-t)]" /> : null}
  </div>
  );
  })}
  </div>
  );
  })}
  </div>
  {loading ? (
  <div className="flex justify-center py-[8px]">
  <Spinner size="sm" />
  </div>
  ) : null}
  {!loading && !hasOptions ? <div className="empty py-[18px]">No matches</div> : null}
  </div>,
  getPopLayer(),
  );
  }

  return (
  <div className={cn("field", className)} {...rest}>
  <span id={labelId} className={cn("field__label", hideLabel && "sr")}>
  {label}
  {required ? <span aria-hidden="true"> *</span> : null}
  </span>
  {trigger}
  {multiple && name
  ? vals.map((v) => <input key={String(v)} type="hidden" name={name} value={String(v)} />)
  : name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
  {hint && !hasError ? <p id={hintId} className="field__hint">{hint}</p> : null}
  {hasError ? (
  <p id={errorId} role="alert" className="text-bad text-[13px] font-semibold">
  {error}
  </p>
  ) : null}
  {popup}
  </div>
  );
}
