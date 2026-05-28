import { useId, useState } from "react";
import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import { createDraft, acceptDraft, discardDraft } from "../../libs/api/ai.js";
import { useMutation } from "../../utils/useMutation.js";
import { useToast } from "../../context/ToastContext.jsx";

// Set when the server answers 503 in this page session. Jerry buttons then hide.
let jerryUnavailable = false;
export const markJerryUnavailable = () => {
  jerryUnavailable = true;
};
export const isJerryUnavailable = () => jerryUnavailable;

const SUGGESTIONS = {
  issue: [
    "Login bug on Safari, high priority",
    "Weekly report task due Friday",
    "Refactor the billing module into smaller parts",
  ],
  search: ["my open bugs", "overdue tasks", "payment issues"],
};

const FIELD_ROWS = [
  ["Title", (o) => o.title],
  ["Priority", (o) => o.priority],
  ["Type", (o) => o.typeName],
  ["Labels", (o) => (Array.isArray(o.labels) ? o.labels.join(", ") : o.labels)],
  ["Due date", (o) => o.dueDate],
  ["Story points", (o) => o.storyPoints],
];

const idOf = (item) => String(item?.id ?? item?._id);

// Asks Jerry for an issue fill or an issue search, shows the reply, and applies it on request.
export default function JerryPanel({ open, onClose, mode, projectId, onApply }) {
  const toast = useToast();
  const promptId = useId();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const text = prompt.trim();
  const isIssue = mode === "issue";
  const output = draft?.output;
  const draftId = draft ? idOf(draft) : null;

  const ask = useMutation(async () => {
    let res;
    try {
      res = await createDraft({
        kind: isIssue ? "issueFill" : "findIssues",
        projectId,
        text,
      });
    } catch (err) {
      if (err.status === 503) {
        markJerryUnavailable();
        setUnavailable(true);
        toast.info("Jerry is not set up on this server.");
        return undefined;
      }
      if (err.status === 429) {
        toast.warning("Daily AI limit reached");
        return undefined;
      }
      throw err;
    }
    if (!res?.data?.output) throw new Error("Jerry could not answer. Try again.");
    return res.data;
  }, {});

  const apply = useMutation(
    async () => {
      await onApply?.(output);
      try {
        await acceptDraft(draftId, {});
      } catch {
        // The form is already filled, so a failed accept stays silent.
      }
      return true;
    },
    { error: (err) => err.message || "Could not use Jerry's answer" },
  );

  const doApply = async () => {
    const done = await apply.run();
    if (!done) return;
    setDraft(null);
    setPrompt("");
    onClose?.();
    toast.success(isIssue ? "Jerry filled the form" : "Jerry set the search");
  };

  const tryAgain = async () => {
    if (draftId) {
      try {
        await discardDraft(draftId);
      } catch {
        // Discarding is best effort; the result is cleared either way.
      }
    }
    setDraft(null);
  };

  const doAsk = async () => {
    setDraft(null);
    const data = await ask.run();
    if (data) setDraft(data);
  };

  const card = draft && output ? (
    <div className="grid gap-[12px] p-[16px] rounded-[15px] bg-well border border-line">
      <p className="text-[15px] leading-[1.6] text-text">{output.reply}</p>
      {isIssue ? (
        <dl className="grid gap-[6px] text-[14px]">
          {FIELD_ROWS.map(([label, read]) => {
            const value = read(output);
            if (value === undefined || value === null || value === "") return null;
            return (
              <div key={label} className="flex gap-[10px]">
                <dt className="text-muted min-w-[104px]">{label}</dt>
                <dd className="text-text font-semibold">{String(value)}</dd>
              </div>
            );
          })}
        </dl>
      ) : output.query ? (
        <div className="flex flex-wrap items-center gap-[8px] text-[14px] text-muted">
          <span>Search for</span>
          <span className="chip">
            <b>{output.query}</b>
          </span>
        </div>
      ) : null}
    </div>
  ) : null;

  const footer =
    draft && output ? (
      <>
        <Button variant="ghost" onClick={tryAgain}>
          Try again
        </Button>
        <Button variant="ember" loading={apply.pending} disabled={apply.pending} onClick={doApply}>
          Use this
        </Button>
      </>
    ) : null;

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Jerry"
      subtitle={isIssue ? "Describe it in your own words and I will fill the form." : "Describe what you are looking for."}
      footer={footer}
    >
      {unavailable ? null : (
        <>
          <div className="grid gap-[10px]">
            <label htmlFor={promptId} className="field">
              <span className="field__label">What should I do?</span>
              <textarea
                id={promptId}
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-[8px]">
              {SUGGESTIONS[isIssue ? "issue" : "search"].map((chip) => (
                <button key={chip} type="button" className="chip" onClick={() => setPrompt(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-[10px] justify-items-start">
            <Button variant="ember" loading={ask.pending} disabled={!text || ask.pending} onClick={doAsk}>
              Ask Jerry
            </Button>
            {ask.pending ? <span className="text-muted text-[14px]">Jerry is thinking...</span> : null}
          </div>

          {ask.error ? (
            <p role="alert" className="text-[14px] text-[color:var(--ember-t)]">
              {ask.error.message || "Jerry could not answer. Try again."}
            </p>
          ) : null}

          {card}
        </>
      )}
    </SideModal>
  );
}
