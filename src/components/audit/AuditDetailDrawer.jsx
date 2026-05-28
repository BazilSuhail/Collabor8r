import SideModal from "../ui/SideModal.jsx";
import Badge from "../ui/Badge.jsx";
import { formatDateTime } from "../../utils/format.js";

// Side drawer with the before and after state of one audit entry. JSON is rendered as text, never as HTML.
const block = (value) => (value === null || value === undefined ? "null" : JSON.stringify(value, null, 2));

export default function AuditDetailDrawer({ open, onClose, entry }) {
  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Audit entry"
      subtitle={entry ? `${entry.actorName || "System"} · ${formatDateTime(entry.at)}` : undefined}
    >
      {entry ? (
        <div className="grid gap-[16px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <Badge tone="plain">{entry.action}</Badge>
            {entry.targetType ? <span className="text-muted">{entry.targetType}</span> : null}
            {entry.targetName ? <span className="font-semibold text-text">{entry.targetName}</span> : null}
          </div>
          <div className="grid gap-[8px]">
            <span className="field__label">Before</span>
            <pre className="overflow-auto rounded-[14px] bg-surface-2 p-[12px] font-mono text-[12.5px] text-text">{block(entry.before)}</pre>
          </div>
          <div className="grid gap-[8px]">
            <span className="field__label">After</span>
            <pre className="overflow-auto rounded-[14px] bg-surface-2 p-[12px] font-mono text-[12.5px] text-text">{block(entry.after)}</pre>
          </div>
        </div>
      ) : null}
    </SideModal>
  );
}
