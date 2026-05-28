import { useEffect, useState } from "react";
import CenterModal from "../ui/CenterModal.jsx";
import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";

// Shows a secret once (invite token, API token). Escape, scrim and the
// close button do nothing, so the user must press Done after copying.
export default function SecretRevealModal({
  open,
  onClose,
  title,
  description,
  value,
  label = "Secret",
  doneLabel = "Done",
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? "");
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      dismissible={false}
      footer={({ close }) => (
        <>
          <Button variant="ghost" onClick={copy} icon="copy">
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ember" onClick={() => close()}>
            {doneLabel}
          </Button>
        </>
      )}
    >
      <div className="grid gap-[8px]">
        <span className="field__label">{label}</span>
        <div className="flex items-center gap-[10px] rounded-ctl border border-line-2 bg-surface px-[14px] py-[10px]">
          <Icon name="key" cls="text-muted shrink-0" />
          <code className="min-w-0 flex-1 break-all font-mono text-[13.5px] text-text select-all">{value}</code>
        </div>
      </div>
    </CenterModal>
  );
}
