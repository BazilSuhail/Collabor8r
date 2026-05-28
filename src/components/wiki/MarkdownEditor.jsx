import { useLayoutEffect, useRef, useState } from "react";
import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";
import Input from "../ui/Input.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import MarkdownView from "./MarkdownView.jsx";

// Each action wraps the selection (or inserts the placeholder), or prefixes the line when linePrefix is set.
const ACTIONS = [
  { id: "bold", label: "Bold", text: "B", before: "**", after: "**", placeholder: "bold text" },
  { id: "italic", label: "Italic", text: "I", before: "_", after: "_", placeholder: "italic text" },
  { id: "heading", label: "Heading", text: "H", before: "## ", placeholder: "Heading", linePrefix: true },
  { id: "list", label: "Bulleted list", text: "List", before: "- ", placeholder: "Item", linePrefix: true },
  { id: "link", label: "Link", text: "Link", before: "[", after: "](https://)", placeholder: "link text" },
  { id: "code", label: "Code", text: "Code", before: "`", after: "`", placeholder: "code" },
];

// Markdown source editor: toolbar buttons insert syntax, Preview renders it with MarkdownView.
export default function MarkdownEditor({ id, label = "Content", value = "", onChange, rows = 14, error, hint }) {
  const areaRef = useRef(null);
  const selectionRef = useRef(null);
  const [mode, setMode] = useState("write");

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (area && selectionRef.current) {
      const [start, end] = selectionRef.current;
      area.focus();
      area.setSelectionRange(start, end);
      selectionRef.current = null;
    }
  });

  const apply = (action) => {
    const area = areaRef.current;
    const start = area?.selectionStart ?? value.length;
    const end = area?.selectionEnd ?? value.length;
    if (action.linePrefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = `${value.slice(0, lineStart)}${action.before}${value.slice(lineStart)}`;
      const caret = start + action.before.length;
      selectionRef.current = [caret, caret];
      onChange(next);
      return;
    }
    const selected = value.slice(start, end) || action.placeholder;
    const next = `${value.slice(0, start)}${action.before}${selected}${action.after ?? ""}${value.slice(end)}`;
    const from = start + action.before.length;
    selectionRef.current = [from, from + selected.length];
    onChange(next);
  };

  return (
    <div className="grid gap-[8px]">
      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap gap-[4px]">
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              aria-label={action.label}
              disabled={mode === "preview"}
              onClick={() => apply(action)}
            >
              {action.text}
            </Button>
          ))}
        </div>
        <SegmentedControl
          label={`${label} view`}
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>
      {mode === "write" ? (
        <Input
          as="textarea"
          id={id}
          ref={areaRef}
          label={label}
          hideLabel
          value={value}
          rows={rows}
          error={error}
          hint={hint}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="min-h-[96px] rounded-[12px] border border-line-2 bg-surface px-[14px] py-[10px]">
          {value.trim() ? (
            <MarkdownView text={value} />
          ) : (
            <p className="flex items-center gap-[8px] text-muted">
              <Icon name="eye" />
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
