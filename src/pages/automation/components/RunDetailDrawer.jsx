// feat(pages/automation/components/RunDetailDrawer): show one automation run's result, error and step log in a side panel.
import SideModal from "../../../components/ui/SideModal.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { formatDateTime, formatDuration } from "../../../utils/format.js";

const RESULT = {
  success: { tone: "spruce", label: "Success" },
  failed: { tone: "ember", label: "Failed" },
  skipped: { tone: "plain", label: "Skipped" },
};

// Log entries are free-form. Strings show as they are, objects show their message or JSON.
const describeStep = (entry) => {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") {
    if (typeof entry.message === "string") return entry.message;
    return JSON.stringify(entry);
  }
  return String(entry);
};

export default function RunDetailDrawer({ open, onClose, run, ruleName }) {
  if (!run) return null;
  const meta = RESULT[run.status] ?? RESULT.skipped;
  const log = Array.isArray(run.log) ? run.log : [];

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Run details"
      subtitle={ruleName ?? "Automation rule"}
    >
      <dl className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-x-[16px] gap-y-[10px] text-[13.5px]">
        <dt className="text-muted">Result</dt>
        <dd>
          <Badge tone={meta.tone} variant="status">
            {meta.label}
          </Badge>
        </dd>
        <dt className="text-muted">Started</dt>
        <dd className="text-text">{run.at ? formatDateTime(run.at) : "—"}</dd>
        <dt className="text-muted">Duration</dt>
        <dd className="text-text">
          {run.durationMs != null ? formatDuration(Math.round(run.durationMs / 1000)) : "—"}
        </dd>
        <dt className="text-muted">Triggered by</dt>
        <dd className="text-text">{run.triggeredBy ?? "—"}</dd>
      </dl>

      {run.error ? (
        <p role="alert" className="rounded-ctl bg-[color:var(--ember-soft)] px-[14px] py-[10px] text-[13px] font-semibold text-bad">
          {run.error}
        </p>
      ) : null}

      <section aria-label="Step log" className="grid gap-[8px]">
        <h3 className="text-[13px] font-bold uppercase tracking-[.07em] text-muted">Steps</h3>
        {log.length === 0 ? (
          <p className="text-[13.5px] text-faint">No steps were logged for this run.</p>
        ) : (
          <ol className="grid gap-[6px] list-decimal pl-[20px] text-[13.5px] text-text">
            {log.map((entry, i) => (
              <li key={i} className="break-words">
                {describeStep(entry)}
              </li>
            ))}
          </ol>
        )}
      </section>
    </SideModal>
  );
}
