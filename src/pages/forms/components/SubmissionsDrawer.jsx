// feat(pages/forms/components/SubmissionsDrawer): side panel that lists a form's submissions with their answers and created issues.
import SideModal from "../../../components/ui/SideModal.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import { listSubmissions } from "../../../libs/api/forms.js";
import { formatDateTime } from "../../../utils/format.js";
import { usePaged } from "../../../utils/usePaged.js";
import Button from "../../../components/ui/Button.jsx";

const fetchSubmissions = ({ pid, formId, ...p }) => listSubmissions(pid, formId, p);

const answerText = (value) => (Array.isArray(value) ? value.join(", ") : value === true ? "Yes" : String(value));

function SubmissionsBody({ projectId, form }) {
  const subs = usePaged(fetchSubmissions, { pid: projectId, formId: form.id ?? form._id });
  const fields = form.fields ?? [];

  if (subs.status === "loading") return <Skeleton variant="cards" count={3} />;

  if (subs.status === "error") {
    return (
      <EmptyState tone="error" title="Submissions did not load" text="Try again in a moment." onRetry={subs.reload} />
    );
  }

  if (!subs.items.length) {
    return <EmptyState icon="inbox" title="No submissions yet" text="Answers from the public link appear here." />;
  }

  return (
    <div className="grid gap-[12px]">
      <ul className="grid gap-[10px] list-none p-0 m-0">
        {subs.items.map((s) => {
          const answers = s.answers ?? {};
          return (
            <li key={s.id ?? s._id} className="grid gap-[8px] rounded-[15px] border border-line bg-surface p-[14px]">
              <div className="flex items-center gap-[8px] flex-wrap">
                <span className="font-semibold text-text">{s.submitterName || "Anonymous"}</span>
                <span className="text-muted text-[12.5px]">{formatDateTime(s.submittedAt ?? s.createdAt)}</span>
                <span className="ml-auto">
                  <Badge variant="status" tone={s.itemId ? "spruce" : "plain"}>
                    {s.itemId ? "Issue created" : "No issue"}
                  </Badge>
                </span>
              </div>
              <dl className="grid gap-[6px] m-0">
                {fields
                  .filter((f) => answers[f.id] !== undefined && answers[f.id] !== "")
                  .map((f) => (
                    <div key={f.id} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-[10px] text-[13.5px]">
                      <dt className="text-muted font-semibold">{f.label}</dt>
                      <dd className="m-0 text-text break-words">{answerText(answers[f.id])}</dd>
                    </div>
                  ))}
              </dl>
            </li>
          );
        })}
      </ul>
      {subs.hasMore ? (
        <Button variant="soft" size="sm" onClick={subs.loadMore} loading={subs.loadingMore} disabled={subs.loadingMore}>
          Show more
        </Button>
      ) : null}
    </div>
  );
}

export default function SubmissionsDrawer({ open, onClose, projectId, form }) {
  return (
    <SideModal open={open} onClose={onClose} title="Submissions" subtitle={form?.name}>
      {open && form ? <SubmissionsBody projectId={projectId} form={form} /> : null}
    </SideModal>
  );
}
