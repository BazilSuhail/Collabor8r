import { useState } from "react";
import Button from "../ui/Button.jsx";
import DraftPreview from "./DraftPreview.jsx";
import { createDraft } from "../../libs/api/ai.js";
import { useMutation } from "../../utils/useMutation.js";
import { useToast } from "../../context/ToastContext.jsx";

// Set when the server answers 503 in this page session. Every AI button then hides.
let aiUnavailable = false;

// Asks the AI for a draft from text, then opens DraftPreview. onInsert(output, created) runs after accept.
export default function AiButton({
  kind,
  projectId,
  text,
  contextIds,
  label = "AI draft",
  onInsert,
  disabled = false,
  variant = "soft",
}) {
  const toast = useToast();
  const [hidden, setHidden] = useState(aiUnavailable);
  const [draft, setDraft] = useState(null);
  const source = String(text ?? "").trim();

  const generate = useMutation(
    async () => {
      try {
        return await createDraft({
          kind,
          projectId,
          text: source,
          ...(contextIds?.length ? { contextIds } : {}),
        });
      } catch (err) {
        if (err.status === 503) {
          if (!aiUnavailable) toast.info("AI is not configured on this server.");
          aiUnavailable = true;
          setHidden(true);
          return undefined;
        }
        if (err.status === 429) {
          toast.warning("Daily AI limit reached");
          return undefined;
        }
        throw err;
      }
    },
    {
      success: (res) => {
        if (res) setDraft(res.data);
        return null;
      },
      error: (err) => err.message || "The AI draft failed",
    },
  );

  if (hidden) return null;

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        icon="sparkle"
        loading={generate.pending}
        disabled={disabled || generate.pending || !source}
        onClick={() => generate.run()}
      >
        {label}
      </Button>
      <DraftPreview
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        draft={draft}
        onAccepted={(data) => {
          setDraft(null);
          onInsert?.(data.draft?.output, data.created);
        }}
        onDiscarded={() => setDraft(null)}
      />
    </>
  );
}
