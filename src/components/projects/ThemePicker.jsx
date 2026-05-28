import { useId, useState } from "react";
import { cn } from "../../utils/cn.js";
import { THEME_KEYS, themePath } from "../../utils/media.js";
import { Icon, hasGlyph } from "../ui/Icon.jsx";

// Banner picker for a project. value is a THEME_KEYS entry or null (no theme).
// A value outside THEME_KEYS is shown as "No theme".
function ThemeThumb({ themeKey, index, selected, disabled, onPick }) {
  const [broken, setBroken] = useState(false);
  const src = themePath(themeKey);

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Theme ${index + 1}`}
      disabled={disabled}
      onClick={() => onPick(themeKey)}
      className={cn(
        "relative rounded-[12px] p-0 bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        selected && "outline outline-2 outline-offset-2 outline-ember",
      )}
    >
      {broken || !src ? (
        <span
          aria-hidden="true"
          className="flex aspect-[4/1] w-full items-center justify-center rounded-[12px] border border-solid border-line bg-surface-2 text-muted"
        >
          {hasGlyph("image") ? <Icon name="image" /> : null}
        </span>
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          loading="lazy"
          onError={() => setBroken(true)}
          className="aspect-[4/1] w-full object-cover rounded-[12px] border border-solid border-line"
        />
      )}
      {selected ? (
        <span className="absolute right-[10px] top-[10px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ember text-[color:var(--ember-t)]">
          <Icon name="check" cls="size-[16px]" />
        </span>
      ) : null}
    </button>
  );
}

export default function ThemePicker({ value, onChange, disabled = false }) {
  const labelId = useId();
  const hintId = useId();
  const current = THEME_KEYS.includes(value) ? value : null;

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId} className="grid gap-[8px]">
      <div className="grid gap-[4px]">
        <span id={labelId} className="text-text text-[14px] font-semibold">
          Theme
        </span>
        <p id={hintId} className="field__hint">
          Shown as the banner on the project overview.
        </p>
      </div>

      <button
        type="button"
        aria-pressed={current === null}
        disabled={disabled}
        onClick={() => onChange(null)}
        className={cn(
          "justify-self-start rounded-[10px] border border-solid px-[12px] py-[6px] text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
          current === null ? "border-ember text-text" : "border-line-2 text-muted",
        )}
      >
        No theme
      </button>

      <div className="grid grid-cols-2 gap-[12px] w560:grid-cols-1">
        {THEME_KEYS.map((key, index) => (
          <ThemeThumb
            key={key}
            themeKey={key}
            index={index}
            selected={current === key}
            disabled={disabled}
            onPick={onChange}
          />
        ))}
      </div>
    </div>
  );
}
