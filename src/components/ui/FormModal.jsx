import { useEffect, useId, useRef, useState } from "react";
import SideModal from "./SideModal.jsx";
import Button from "./Button.jsx";
import { cn } from "../../utils/cn.js";

// Form dialog built on SideModal (side panel on desktop, bottom sheet on mobile).
// onSubmit(values) returns a promise.
// A 422 fills field errors from err.errors[].path. A 409 shows the
// "Changed by someone else" footer with a Reload action. Other errors show
// in the footer. Success calls onClose("submit").
export default function FormModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  submitLabel = "Save",
  onSubmit,
  initialValues,
  fields,
  dirtyGuard = true,
  onReload,
}) {
  const formId = useId();
  const formRef = useRef(null);
  const [values, setValues] = useState(initialValues ?? {});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const baseline = useRef(JSON.stringify(initialValues ?? {}));

  useEffect(() => {
    if (!open) return;
    const next = initialValues ?? {};
    setValues(next);
    baseline.current = JSON.stringify(next);
    setErrors({});
    setFormError(null);
    setConflict(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = JSON.stringify(values) !== baseline.current;

  const set = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors({});
    setFormError(null);
    setConflict(false);
    try {
      await onSubmit(values);
      onClose?.("submit");
    } catch (err) {
      if (err?.status === 422) {
        const map = {};
        (err.errors ?? []).forEach((item) => {
          const key = String(item.path ?? "").replace(/^body\./, "");
          if (key && !map[key]) map[key] = item.message;
        });
        setErrors(map);
        if (!Object.keys(map).some((k) => k in values)) setFormError(err.message ?? "Check the highlighted fields.");
        setTimeout(() => {
          formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
        }, 0);
      } else if (err?.status === 409) {
        setConflict(true);
        setFormError("Changed by someone else.");
      } else {
        setFormError(err?.message ?? "Something went wrong. Try again.");
      }
    } finally {
      setPending(false);
    }
  };

  // SideModal passes no close() to its footer, so Cancel presses the panel's
  // own Close button. That runs the same dirty guard and discard prompt.
  const cancel = (e) => {
    e.currentTarget.closest('[role="dialog"]')?.querySelector('button[aria-label="Close"]')?.click();
  };

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      size={size === "lg" ? "lg" : "md"}
      onBeforeClose={dirtyGuard ? () => !dirty : undefined}
      footer={
        <>
          {formError ? (
            <p role="alert" className="order-[-1] basis-full flex flex-wrap items-center gap-[10px] text-bad text-[13px] font-semibold">
              {formError}
              {conflict && onReload ? (
                <Button variant="ghost" size="sm" icon="refresh" onClick={onReload}>
                  Reload latest
                </Button>
              ) : null}
            </p>
          ) : null}
          <Button variant="ghost" onClick={cancel} className="w760:flex-1">
            Cancel
          </Button>
          <Button
            variant="ember"
            type="submit"
            form={formId}
            loading={pending}
            disabled={pending}
            className="w760:flex-1"
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={submit}
        className={cn(
          "col-span-full grid gap-[16px]",
          size === "lg" ? "grid-cols-2 w1000:grid-cols-1" : "grid-cols-1",
        )}
      >
        {fields({ values, set, errors })}
      </form>
    </SideModal>
  );
}
