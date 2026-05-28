import { useEffect, useRef, useState } from "react";
import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";
import { updateMe } from "../../libs/api/users.js";
import { useMutation } from "../../utils/useMutation.js";
import { AVATAR_KEYS, avatarPath } from "../../utils/media.js";

const saveAvatar = (body) => updateMe(body).then(() => true);

// Picks one of the preset avatars and saves it as avatarKey. onSaved receives the new key (or null).
export default function AvatarPickerModal({ open, onClose, currentKey, onSaved }) {
  const initial = currentKey ?? null;
  const [selected, setSelected] = useState(initial);
  const [broken, setBroken] = useState(() => new Set());
  const refs = useRef([]);
  const save = useMutation(saveAvatar, {
    success: "Avatar updated",
    error: (err) => err?.message || "Could not update your avatar.",
  });

  useEffect(() => {
    if (!open) return;
    setSelected(initial);
    setBroken(new Set());
  }, [open, initial]);

  const dirty = selected !== initial;
  const activeIndex = Math.max(0, AVATAR_KEYS.indexOf(selected));

  const columnCount = () => {
    const first = refs.current[0];
    if (!first) return 4;
    let count = 0;
    for (const el of refs.current) {
      if (!el || el.offsetTop !== first.offsetTop) break;
      count += 1;
    }
    return count || 4;
  };

  const onGridKeyDown = (e, index) => {
    const step = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columnCount(),
      ArrowUp: -columnCount(),
    }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = index + step;
    if (next < 0 || next >= AVATAR_KEYS.length) return;
    refs.current[next]?.focus();
  };

  const markBroken = (key) => setBroken((prev) => new Set(prev).add(key));

  const onSave = async () => {
    if (!dirty || save.pending) return;
    const ok = await save.run({ avatarKey: selected ?? null });
    if (!ok) return;
    onSaved?.(selected ?? null);
    onClose?.();
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={() => onClose?.()} className="w760:flex-1">
        Cancel
      </Button>
      <Button
        variant="ember"
        onClick={onSave}
        loading={save.pending}
        disabled={!dirty || save.pending}
        className="w760:flex-1"
      >
        Save
      </Button>
    </>
  );

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Choose your avatar"
      subtitle="Pick a preset. It appears next to your name and in lists."
      footer={footer}
    >
      <div role="group" aria-label="Preset avatars" className="grid grid-cols-4 gap-[12px] w560:grid-cols-3">
        {AVATAR_KEYS.map((key, index) => {
          const isSelected = selected === key;
          const isBroken = broken.has(key);
          return (
            <button
              key={key}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Avatar ${index + 1}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setSelected(key)}
              onKeyDown={(e) => onGridKeyDown(e, index)}
              className={[
                "relative grid place-items-center w-[64px] h-[64px] rounded-full p-0 overflow-hidden bg-well cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-[var(--ember)] focus-visible:outline-offset-2",
                isSelected ? "ring-2 ring-[var(--ember)] ring-offset-2 ring-offset-[var(--float)]" : "",
              ].join(" ")}
            >
              {isBroken ? (
                <span className="grid place-items-center w-full h-full text-muted">
                  <Icon name="user" />
                </span>
              ) : (
                <img
                  src={avatarPath(key)}
                  alt=""
                  width="64"
                  height="64"
                  draggable={false}
                  onError={() => markBroken(key)}
                  className="w-full h-full object-cover"
                />
              )}
              {isSelected ? (
                <span className="absolute right-[-2px] bottom-[-2px] grid place-items-center w-[22px] h-[22px] rounded-full bg-[var(--ember)] text-[var(--float)]">
                  <Icon name="check" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} disabled={selected === null}>
          Remove
        </Button>
      </div>
    </SideModal>
  );
}
