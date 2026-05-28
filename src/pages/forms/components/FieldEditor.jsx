// feat(pages/forms/components/FieldEditor): edit one intake form field (label, type, required, options) and reorder or remove it.
import { useState } from "react";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";

export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "longText", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "select", label: "Single choice" },
  { value: "multiSelect", label: "Multiple choice" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
];

const needsOptions = (type) => type === "select" || type === "multiSelect";

export default function FieldEditor({ field, index, count, disabled = false, onPatch, onMove, onRemove }) {
  const [optionsText, setOptionsText] = useState((field.options ?? []).join("\n"));

  const onOptionsChange = (text) => {
    setOptionsText(text);
    onPatch({ options: text.split("\n").map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div className="grid gap-[12px] rounded-[15px] border border-line bg-surface p-[20px]">
      <div className="flex items-center gap-[8px] flex-wrap">
        <Icon name="field" cls="text-muted" />
        <span className="text-muted text-[12px] font-semibold tnum">Field {index + 1}</span>
        {field.required ? <Badge tone="ember">Required</Badge> : null}
        <span className="ml-auto flex items-center gap-[4px]">
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="up"
            aria-label={`Move field ${index + 1} up`}
            disabled={disabled || index === 0}
            onClick={() => onMove("up")}
          />
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="down"
            aria-label={`Move field ${index + 1} down`}
            disabled={disabled || index === count - 1}
            onClick={() => onMove("down")}
          />
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="trash"
            aria-label={`Remove field ${index + 1}`}
            disabled={disabled}
            onClick={onRemove}
          />
        </span>
      </div>
      <Input
        label="Field label"
        hint="The question people see above the answer box."
        value={field.label}
        maxLength={200}
        onChange={(e) => onPatch({ label: e.target.value })}
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
        <Select
          label="Type"
          hint="How people answer this question."
          value={field.type}
          options={FIELD_TYPES}
          onChange={(type) => onPatch({ type, options: needsOptions(type) ? (field.options ?? []) : undefined })}
          disabled={disabled}
        />
        <div className="flex items-end pb-[6px]">
          <Switch checked={!!field.required} onChange={(v) => onPatch({ required: v })} label="Required" disabled={disabled} />
        </div>
      </div>
      {needsOptions(field.type) ? (
        <Input
          as="textarea"
          label="Options"
          hint="One option per line."
          value={optionsText}
          onChange={(e) => onOptionsChange(e.target.value)}
          disabled={disabled}
        />
      ) : null}
      <Input
        label="Help text"
        hint="Optional. Shown under the question on the public form."
        value={field.helpText ?? ""}
        maxLength={500}
        onChange={(e) => onPatch({ helpText: e.target.value })}
        disabled={disabled}
      />
    </div>
  );
}
