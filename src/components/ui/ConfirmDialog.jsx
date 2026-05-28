import { useState } from "react";
import { createRoot } from "react-dom/client";
import CenterModal from "./CenterModal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({
  open,
  onClose,
  title,
  text,
  confirmLabel = "Delete",
  tone = "danger",
  onConfirm,
}) {
  const [pending, setPending] = useState(false);

  const runConfirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm?.();
      onClose?.("submit");
    } catch {
      // Stays open so the user can retry. The API layer shows the error toast.
    } finally {
      setPending(false);
    }
  };

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      tone={tone}
      footer={({ close }) => (
        <>
          <Button variant="ghost" data-autofocus onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "ink"}
            loading={pending}
            disabled={pending}
            onClick={runConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {text ? <p className="text-muted text-[14px] leading-[1.5]">{text}</p> : null}
    </CenterModal>
  );
}

// Imperative confirm. Mounts its own React root in a detached host, so it
// works from any component or non-React code without a provider.
function ConfirmRequest({ opts, settle, teardown }) {
  const [open, setOpen] = useState(true);
  const finish = (value) => {
    if (!open) return;
    setOpen(false);
    settle(value);
    teardown();
  };
  return (
    <ConfirmDialog
      open={open}
      onClose={() => finish(false)}
      title={opts.title}
      text={opts.text}
      confirmLabel={opts.confirmLabel}
      tone={opts.tone ?? "danger"}
      onConfirm={async () => finish(true)}
    />
  );
}

export function requestConfirm(opts = {}) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    let torn = false;
    const teardown = () => {
      if (torn) return;
      torn = true;
      setTimeout(() => {
        root.unmount();
        host.remove();
      }, 600);
    };
    root.render(<ConfirmRequest opts={opts} settle={settle} teardown={teardown} />);
  });
}

export function useConfirm() {
  return requestConfirm;
}
