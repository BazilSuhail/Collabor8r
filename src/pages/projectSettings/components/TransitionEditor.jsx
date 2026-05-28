// feat(pages/projectSettings/components/TransitionEditor): edit a transition's required fields, validators and post-actions in a side panel.
import { useState } from "react";
import SideModal from "../../../components/ui/SideModal.jsx";
import Button from "../../../components/ui/Button.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";

export const VALIDATOR_TYPES = [
  { value: "requiredField", label: "Field is required" },
  { value: "assigneeRequired", label: "Assignee is required" },
  { value: "resolutionRequired", label: "Resolution is required" },
  { value: "onlyRoles", label: "Only some roles" },
  { value: "subtasksDone", label: "Subtasks are done" },
];

export const POST_ACTION_TYPES = [
  { value: "setResolution", label: "Set resolution" },
  { value: "clearResolution", label: "Clear resolution" },
  { value: "assignToReporter", label: "Assign to reporter" },
];

export const PROJECT_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "lead", label: "Lead" },
  { value: "developer", label: "Developer" },
  { value: "reporter", label: "Reporter" },
  { value: "viewer", label: "Viewer" },
  { value: "guest", label: "Guest" },
];

// Keeps only the keys the server accepts. Null and empty extras are dropped.
export const cleanRule = (rule) => ({
  type: rule.type,
  ...(rule.field ? { field: rule.field } : {}),
  ...(rule.roles?.length ? { roles: rule.roles } : {}),
  ...(rule.resolutionId ? { resolutionId: rule.resolutionId } : {}),
});

export const cleanTransitions = (transitions) =>
  transitions.map((t) => ({
    id: t.id,
    name: String(t.name ?? "").trim(),
    from: t.from ?? [],
    to: t.to,
    requiredFields: t.requiredFields ?? [],
    screenFields: t.screenFields ?? [],
    conditions: (t.conditions ?? []).map(cleanRule),
    validators: (t.validators ?? []).map(cleanRule),
    postActions: (t.postActions ?? []).map(cleanRule),
  }));

function RuleList({ title, icon, rules, onChange, types, readOnly, resolutions }) {
  const patch = (index, next) => onChange(rules.map((r, i) => (i === index ? next : r)));

  return (
    <section className="grid gap-[10px]">
      <h3 className="flex items-center gap-[8px] text-[14px] font-bold text-text">
        <Icon name={icon} cls="text-muted" />
        {title}
      </h3>
      <div className="grid gap-[10px]">
        {rules.length === 0 ? <p className="col-span-full text-muted text-[13px]">None.</p> : null}
        {rules.map((rule, index) => (
        <div key={index} className="grid content-start gap-[8px] rounded-ctl border border-line p-[12px]">
          <div className="flex items-end gap-[8px]">
            <div className="min-w-0 flex-1">
              <Select
                label={`${title} type`}
                value={rule.type}
                options={types}
                disabled={readOnly}
                onChange={(type) => patch(index, { type })}
              />
            </div>
            {readOnly ? null : (
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon="trash"
                aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
                onClick={() => onChange(rules.filter((_, i) => i !== index))}
              />
            )}
          </div>
          {rule.type === "requiredField" ? (
            <Input
              label="Field name"
              value={rule.field ?? ""}
              disabled={readOnly}
              onChange={(e) => patch(index, { ...rule, field: e.target.value })}
              hint="The issue field key, for example dueDate."
            />
          ) : null}
          {rule.type === "onlyRoles" ? (
            <Select
              label="Roles"
              multiple
              value={rule.roles ?? []}
              options={PROJECT_ROLE_OPTIONS}
              disabled={readOnly}
              onChange={(roles) => patch(index, { ...rule, roles })}
            />
          ) : null}
          {rule.type === "setResolution" ? (
            <Select
              label="Resolution"
              value={rule.resolutionId ?? ""}
              options={resolutions}
              placeholder="Pick a resolution"
              disabled={readOnly}
              onChange={(resolutionId) => patch(index, { ...rule, resolutionId })}
            />
          ) : null}
        </div>
        ))}
        {readOnly ? null : (
          <div className="col-span-full">
            <Button
              variant="soft"
              size="sm"
              icon="plus"
              onClick={() => onChange([...rules, { type: types[0].value }])}
            >
              Add {title.toLowerCase().replace(/s$/, "")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Mounted once per transition. The parent passes a key so the local draft starts from the saved rules.
export default function TransitionEditor({ open, onClose, transition, resolutions = [], readOnly = false, onSave }) {
  const [requiredText, setRequiredText] = useState(() => (transition?.requiredFields ?? []).join(", "));
  const [validators, setValidators] = useState(() => (transition?.validators ?? []).map(cleanRule));
  const [postActions, setPostActions] = useState(() => (transition?.postActions ?? []).map(cleanRule));

  const save = () => {
    const requiredFields = requiredText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave?.({ requiredFields, validators, postActions });
    onClose?.();
  };

  const resolutionOptions = resolutions.map((r) => ({ value: r._id, label: r.name }));

  return (
    <SideModal
      open={open}
      onClose={() => onClose?.()}
      title={transition?.name ? `Rules for ${transition.name}` : "Transition rules"}
      subtitle="Checks run before the move. Actions run after it."
      footer={
        readOnly ? (
          <Button variant="ghost" onClick={() => onClose?.()} className="w760:flex-1">
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => onClose?.()} className="w760:flex-1">
              Cancel
            </Button>
            <Button variant="ember" onClick={save} className="w760:flex-1">
              Apply rules
            </Button>
          </>
        )
      }
    >
      <div className="grid gap-[18px]">
        <Input
          label="Required fields"
          hint="Comma separated issue fields, for example dueDate, estimate"
          value={requiredText}
          disabled={readOnly}
          onChange={(e) => setRequiredText(e.target.value)}
        />
        <RuleList
          title="Validators"
          icon="check"
          rules={validators}
          onChange={setValidators}
          types={VALIDATOR_TYPES}
          readOnly={readOnly}
          resolutions={resolutionOptions}
        />
        <RuleList
          title="Post-actions"
          icon="bolt"
          rules={postActions}
          onChange={setPostActions}
          types={POST_ACTION_TYPES}
          readOnly={readOnly}
          resolutions={resolutionOptions}
        />
      </div>
    </SideModal>
  );
}
