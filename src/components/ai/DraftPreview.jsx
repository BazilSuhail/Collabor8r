import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Spinner from "../ui/Spinner.jsx";
import MarkdownView from "../wiki/MarkdownView.jsx";
import { useMutation } from "../../utils/useMutation.js";
import { acceptDraft, discardDraft } from "../../libs/api/ai.js";

const idOf = (item) => String(item?.id ?? item?._id);

const KIND_TITLE = {
  issueFromText: "Issue draft",
  subtasks: "Subtasks",
  summarize: "Summary",
  wikiOutline: "Wiki outline",
};

const ACCEPT_LABEL = {
  issueFromText: "Create issue",
  subtasks: "Create subtasks",
  summarize: "Keep summary",
  wikiOutline: "Use outline",
};

function Output({ output }) {
  if (!output) return null;
  if (output.kind === "issueFromText") {
    return (
      <div className="grid gap-[10px]">
        <h3 className="[font:700_20px_var(--display)] tracking-[-0.02em]">{output.title}</h3>
        <MarkdownView text={output.description ?? ""} />
      </div>
    );
  }
  if (output.kind === "subtasks") {
    return (
      <ol className="grid list-decimal gap-[12px] pl-[22px]">
        {(output.items ?? []).map((item, index) => (
          <li key={index}>
            <p className="font-semibold text-text">{item.title}</p>
            {item.description ? <p className="text-[14px] text-muted">{item.description}</p> : null}
          </li>
        ))}
      </ol>
    );
  }
  if (output.kind === "summarize") {
    return (
      <div className="grid gap-[12px]">
        <p className="text-[15px] leading-[1.6] text-text">{output.summary}</p>
        {output.highlights?.length ? (
          <ul className="grid list-disc gap-[6px] pl-[22px] text-[14px] text-muted">
            {output.highlights.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (output.kind === "wikiOutline") {
    return (
      <div className="grid gap-[16px]">
        <h3 className="[font:700_20px_var(--display)] tracking-[-0.02em]">{output.title}</h3>
        {(output.sections ?? []).map((section, index) => (
          <section key={index} className="grid gap-[6px]">
            <h4 className="font-bold text-text">{section.heading}</h4>
            <ul className="grid list-disc gap-[4px] pl-[22px] text-[14px] text-muted">
              {(section.points ?? []).map((point, n) => (
                <li key={n}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return <p className="text-muted">This draft has no preview.</p>;
}

// Shows one AI draft. Accept calls the server (issue drafts create the issue); Discard drops it.
export default function DraftPreview({ open, onClose, draft, onAccepted, onDiscarded }) {
  const draftId = draft ? idOf(draft) : null;
  const status = draft?.status;

  const accept = useMutation(() => acceptDraft(draftId, {}), {
    success: (res) => {
      const c = res?.data?.created;
      const keys = (Array.isArray(c) ? c : c ? [c] : []).map((k) => (typeof k === "string" ? k : k?.key)).filter(Boolean);
      return keys.length ? `Created ${keys.join(", ")}` : "Draft accepted";
    },
    error: (err) => err.message || "Could not accept this draft",
  });
  const discard = useMutation(
    async () => {
      await discardDraft(draftId);
      return true;
    },
    { success: "Draft discarded", error: (err) => err.message || "Could not discard this draft" },
  );

  const doAccept = async () => {
    const res = await accept.run();
    if (res) onAccepted?.(res.data);
  };
  const doDiscard = async () => {
    const done = await discard.run();
    if (done) onDiscarded?.();
  };

  let body;
  if (!draft) {
    body = null;
  } else if (status === "pending") {
    body = (
      <div className="flex items-center gap-[10px] text-muted">
        <Spinner size="sm" />
        <span>Still drafting. This can take a few seconds.</span>
      </div>
    );
  } else if (status === "failed") {
    body = <EmptyState tone="error" title="This draft failed" text={draft.error ?? "Try again in a moment."} />;
  } else if (status === "ready") {
    body = <Output output={draft.output} />;
  } else {
    body = <EmptyState icon="aiDraft" title="This draft is closed" text={`It was already ${status}.`} />;
  }

  const footer =
    status === "ready" ? (
      <>
        <Button variant="ghost" loading={discard.pending} disabled={accept.pending} onClick={doDiscard}>
          Discard
        </Button>
        <Button variant="ember" loading={accept.pending} disabled={discard.pending} onClick={doAccept}>
          {ACCEPT_LABEL[draft.output?.kind] ?? "Accept"}
        </Button>
      </>
    ) : null;

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="AI draft"
      subtitle={draft ? (KIND_TITLE[draft.output?.kind] ?? "Draft") : undefined}
      footer={footer}
    >
      {body}
    </SideModal>
  );
}
