import { useEffect, useState } from "react";
import CenterModal from "../ui/CenterModal.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import { createLink, listIssues } from "../../libs/api/issues.js";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { cn } from "../../utils/cn.js";

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: [], meta: null });

const LINK_TYPES = [
  { value: "relates", label: "Relates to" },
  { value: "blocks", label: "Blocks" },
  { value: "duplicates", label: "Duplicates" },
  { value: "clones", label: "Clones" },
];

// Pick another issue in this project and a link type. Search runs 250ms after typing stops.
export default function LinkPickerModal({ open, onClose, pid, issueId, onLinked }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [target, setTarget] = useState(null);
  const [type, setType] = useState("relates");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useResource(
    () => (open && debounced ? listIssues(pid, { q: debounced, limit: 10 }) : NONE),
    [open, pid, debounced],
  );
  const candidates = (Array.isArray(results.data) ? results.data : []).filter((issue) => idOf(issue) !== issueId);

  const submit = useMutation(() => createLink(pid, issueId, { targetIssueId: idOf(target), type }), {
    success: "Linked",
    error: (err) => err.message || "Could not link this issue",
  });

  const link = async () => {
    if (!target) return;
    const res = await submit.run();
    if (res) {
      setTarget(null);
      setQuery("");
      onLinked?.();
      onClose();
    }
  };

  let found;
  if (!debounced) {
    found = <p className="text-[14px] text-muted">Type a key or part of a title to find an issue.</p>;
  } else if (results.status === "loading") {
    found = (
      <div className="grid gap-[8px]" aria-busy="true">
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-[40px] animate-pulse rounded-[12px] bg-well motion-reduce:animate-none" />
        ))}
      </div>
    );
  } else if (results.status === "error") {
    found = (
      <EmptyState tone="error" title="Search did not work" text={results.error?.message} onRetry={results.reload} />
    );
  } else if (!candidates.length) {
    found = <EmptyState icon="search" title="No issues match" text="Try another key or word." />;
  } else {
    found = (
      <ul aria-label="Matching issues" className="grid max-h-[240px] gap-[6px] overflow-y-auto">
        {candidates.map((issue) => {
          const id = idOf(issue);
          const selected = target && idOf(target) === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={Boolean(selected)}
                onClick={() => setTarget(issue)}
                className={cn(
                  "flex w-full items-center gap-[10px] rounded-[12px] border border-line px-[12px] py-[8px] text-left",
                  "aria-[pressed=true]:border-line-2 aria-[pressed=true]:bg-well",
                )}
              >
                <span className="flex-none text-[12.5px] font-bold text-muted tabular-nums">{issue.key}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text">{issue.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title="Link an issue"
      description="Pick an issue in this project and say how it relates."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ember" loading={submit.pending} disabled={!target} onClick={link}>
            Link issue
          </Button>
        </>
      }
    >
      <div className="grid gap-[16px]">
        <Input
          variant="search"
          label="Search issues"
          hideLabel
          placeholder="Search by key or title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {target ? (
          <p className="flex items-center gap-[8px] text-[13px] font-semibold text-muted min-w-0">
            <span className="shrink-0">Selected</span>
            <span className="min-w-0 truncate text-text">
              {target.key} {target.title}
            </span>
          </p>
        ) : null}
        {found}
        <Select
          label="Link type"
          hint="Describes how this issue relates to the one you pick."
          value={type}
          options={LINK_TYPES}
          onChange={setType}
        />
        {submit.fieldErrors.targetIssueId ? (
          <p role="alert" className="text-[13px] font-semibold text-bad">
            {submit.fieldErrors.targetIssueId}
          </p>
        ) : null}
      </div>
    </CenterModal>
  );
}
