// feat(pages/projectSettings/components/ConfigFormModal): create or edit an issue type, priority, resolution, custom field, label or component.
import { useMemo } from "react";
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { useProject } from "../../../context/ProjectContext.jsx";
import {
  createConfig,
  updateConfig,
  deleteConfig,
  createLabel,
  updateLabel,
  deleteLabel,
  createComponent,
  updateComponent,
  deleteComponent,
} from "../../../libs/api/config.js";

// Each segment has the same create, update and remove shape: (pid, body) and (pid, id, body).
const crud = (seg) => ({
  create: (pid, body) => createConfig(pid, seg, body),
  update: (pid, id, body) => updateConfig(pid, seg, id, body),
  remove: (pid, id) => deleteConfig(pid, seg, id),
});

const API = {
  "issue-types": crud("issue-types"),
  priorities: crud("priorities"),
  resolutions: crud("resolutions"),
  "custom-fields": crud("custom-fields"),
  labels: { create: createLabel, update: updateLabel, remove: deleteLabel },
  components: { create: createComponent, update: updateComponent, remove: deleteComponent },
};

export const configApi = (seg) => API[seg];

export const SEG_SINGULAR = {
  "issue-types": "issue type",
  priorities: "priority",
  resolutions: "resolution",
  "custom-fields": "custom field",
  labels: "label",
  components: "component",
};

const COLOR_OPTIONS = [
  { value: "", label: "No colour" },
  { value: "ember", label: "Ember", tone: "ember" },
  { value: "iris", label: "Iris", tone: "iris" },
  { value: "spruce", label: "Spruce", tone: "spruce" },
  { value: "saffron", label: "Saffron", tone: "saffron" },
  { value: "ink", label: "Ink" },
];

const HIERARCHY_OPTIONS = [
  { value: "epic", label: "Epic" },
  { value: "story", label: "Story" },
  { value: "task", label: "Task" },
  { value: "subtask", label: "Subtask" },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "longText", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "money", label: "Money" },
  { value: "date", label: "Date" },
  { value: "select", label: "Single choice" },
  { value: "multiSelect", label: "Multiple choice" },
  { value: "user", label: "Person" },
  { value: "url", label: "Link" },
  { value: "checkbox", label: "Checkbox" },
  { value: "rating", label: "Rating" },
  { value: "formula", label: "Formula" },
];

const RESOLUTION_BLANK = { name: "", description: "", countsAsDone: false };

const initialFor = (seg, row) => {
  if (!row) {
    if (seg === "issue-types") return { name: "", hierarchy: "task", description: "", color: "", isDefault: false };
    if (seg === "priorities") return { name: "", rank: "1", color: "", isDefault: false };
    if (seg === "resolutions") return { ...RESOLUTION_BLANK };
    if (seg === "custom-fields")
      return { name: "", fieldType: "text", description: "", required: false, options: "", formula: "" };
    if (seg === "labels") return { name: "", color: "", description: "" };
    return { name: "", description: "", leadId: "" };
  }
  if (seg === "issue-types") {
    return {
      name: row.name ?? "",
      hierarchy: row.hierarchy ?? "task",
      description: row.description ?? "",
      color: row.color ?? "",
      isDefault: Boolean(row.isDefault),
    };
  }
  if (seg === "priorities") {
    return { name: row.name ?? "", rank: String(row.rank ?? 1), color: row.color ?? "", isDefault: Boolean(row.isDefault) };
  }
  if (seg === "resolutions") {
    return {
      name: row.name ?? "",
      description: row.description ?? "",
      countsAsDone: Boolean(row.countsAsDone),
    };
  }
  if (seg === "custom-fields") {
    return {
      name: row.name ?? "",
      fieldType: row.fieldType ?? "text",
      description: row.description ?? "",
      required: Boolean(row.required),
      options: (row.options ?? []).map((o) => o.label).join("\n"),
      formula: row.formula ?? "",
    };
  }
  if (seg === "labels") return { name: row.name ?? "", color: row.color ?? "", description: row.description ?? "" };
  return { name: row.name ?? "", description: row.description ?? "", leadId: row.leadId ?? "" };
};

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "option";

const toBody = (seg, v) => {
  if (seg === "issue-types") {
    return { name: v.name.trim(), hierarchy: v.hierarchy, description: v.description, color: v.color, isDefault: v.isDefault };
  }
  if (seg === "priorities") {
    return { name: v.name.trim(), rank: Number(v.rank), color: v.color, isDefault: v.isDefault };
  }
  if (seg === "resolutions") {
    return { name: v.name.trim(), description: v.description, countsAsDone: v.countsAsDone };
  }
  if (seg === "custom-fields") {
    const body = {
      name: v.name.trim(),
      fieldType: v.fieldType,
      description: v.description,
      required: v.required,
    };
    if (v.fieldType === "formula") body.formula = v.formula;
    if (v.fieldType === "select" || v.fieldType === "multiSelect") {
      const seen = new Set();
      body.options = v.options
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((label) => {
          let value = slug(label);
          while (seen.has(value)) value = `${value}_`;
          seen.add(value);
          return { value, label };
        });
    }
    return body;
  }
  if (seg === "labels") return { name: v.name.trim(), color: v.color, description: v.description };
  return { name: v.name.trim(), description: v.description, leadId: v.leadId || null };
};

function ConfigFields({ seg, values, set, errors, members }) {
  const leadOptions = [
    { value: "", label: "No lead" },
    ...members.map((m) => ({ value: m.userId, label: m.userName || "Member" })),
  ];

  if (seg === "issue-types") {
    return (
      <>
        <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Select label="Hierarchy" value={values.hierarchy} options={HIERARCHY_OPTIONS} onChange={(v) => set("hierarchy", v)} error={errors.hierarchy} hint="Where this type sits in the issue tree" />
        <div className="col-span-full">
          <Input label="Description" as="textarea" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        </div>
        <Select label="Colour" value={values.color} options={COLOR_OPTIONS} onChange={(v) => set("color", v)} error={errors.color} hint="Shown on badges and cards" />
        <div className="grid gap-[6px] content-start"><Switch label="Default type" checked={values.isDefault} onChange={(v) => set("isDefault", v)} /><p className="field__hint">New issues start with this type</p></div>
      </>
    );
  }
  if (seg === "priorities") {
    return (
      <>
        <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Input label="Rank" type="number" min={1} value={values.rank} onChange={(e) => set("rank", e.target.value)} hint="Lower rank is more urgent" error={errors.rank} />
        <Select label="Colour" value={values.color} options={COLOR_OPTIONS} onChange={(v) => set("color", v)} error={errors.color} hint="Shown on badges and cards" />
        <div className="grid gap-[6px] content-start"><Switch label="Default priority" checked={values.isDefault} onChange={(v) => set("isDefault", v)} /><p className="field__hint">New issues start with this priority</p></div>
      </>
    );
  }
  if (seg === "resolutions") {
    return (
      <>
        <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <div className="grid gap-[6px] content-start"><Switch label="Counts as done" checked={values.countsAsDone} onChange={(v) => set("countsAsDone", v)} /><p className="field__hint">Issues closed with this resolution count as done</p></div>
        <div className="col-span-full">
          <Input label="Description" as="textarea" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        </div>
      </>
    );
  }
  if (seg === "custom-fields") {
    const choice = values.fieldType === "select" || values.fieldType === "multiSelect";
    return (
      <>
        <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Select label="Field type" value={values.fieldType} options={FIELD_TYPE_OPTIONS} onChange={(v) => set("fieldType", v)} error={errors.fieldType} hint="Sets what kind of value people enter" />
        <div className="col-span-full">
          <Input label="Description" as="textarea" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        </div>
        {choice ? (
          <div className="col-span-full">
            <Input label="Options" as="textarea" hint="One option per line" value={values.options} onChange={(e) => set("options", e.target.value)} error={errors.options} />
          </div>
        ) : null}
        {values.fieldType === "formula" ? (
          <div className="col-span-full">
            <Input label="Formula" value={values.formula} onChange={(e) => set("formula", e.target.value)} error={errors.formula} hint="Calculated from other fields" />
          </div>
        ) : null}
        <div className="grid gap-[6px] content-start"><Switch label="Required" checked={values.required} onChange={(v) => set("required", v)} /><p className="field__hint">People must fill this in before saving</p></div>
      </>
    );
  }
  if (seg === "labels") {
    return (
      <>
        <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <Select label="Colour" value={values.color} options={COLOR_OPTIONS} onChange={(v) => set("color", v)} error={errors.color} hint="Shown on badges and cards" />
        <div className="col-span-full">
          <Input label="Description" as="textarea" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        </div>
      </>
    );
  }
  return (
    <>
      <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
      <Select label="Lead" value={values.leadId} options={leadOptions} onChange={(v) => set("leadId", v)} error={errors.leadId} hint="Leads the work in this component" />
      <div className="col-span-full">
        <Input label="Description" as="textarea" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
      </div>
    </>
  );
}

// row is null for create. onSaved runs after a successful write.
export default function ConfigFormModal({ open, onClose, seg, row = null, members = [], onSaved }) {
  const { projectId } = useProject();
  const toast = useToast();
  const api = configApi(seg);
  const editing = Boolean(row);
  const label = SEG_SINGULAR[seg] ?? "item";
  const initialValues = useMemo(() => initialFor(seg, row), [seg, row]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${label}` : `New ${label}`}
      submitLabel={editing ? "Save" : "Create"}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const body = toBody(seg, values);
        if (editing) await api.update(projectId, row._id, body);
        else await api.create(projectId, body);
        toast.success(editing ? "Saved" : "Created");
        onSaved?.();
      }}
      fields={({ values, set, errors }) => (
        <ConfigFields seg={seg} values={values} set={set} errors={errors} members={members} />
      )}
    />
  );
}
