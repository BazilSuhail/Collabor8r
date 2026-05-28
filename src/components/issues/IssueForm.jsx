import { listIssues } from "../../libs/api/issues.js";
import { formatDuration, parseDuration } from "../../utils/format.js";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import {
  AssigneeSelect,
  LabelSelect,
  PrioritySelect,
  ReleaseSelect,
  SprintSelect,
  TypeSelect,
  idOf,
} from "./IssueSelects.jsx";

// Field values for the create and edit forms. Keys match the form, toIssueBody maps them to the API.
export function defaultValues(defaults = {}) {
  return {
    typeId: defaults.typeId ?? "",
    title: "",
    description: "",
    priorityId: defaults.priorityId ?? "",
    assigneeId: "",
    sprintId: defaults.sprintId ?? "",
    releaseIds: [],
    labels: [],
    storyPoints: "",
    estimate: "",
    dueDate: "",
    parentId: defaults.parentId ?? "",
  };
}

export function issueToValues(issue) {
  return {
    title: issue.title ?? "",
    description: typeof issue.description === "string" ? issue.description : (issue.description?.text ?? ""),
    priorityId: issue.priorityId ?? "",
    assigneeId: issue.assigneeId ?? "",
    sprintId: issue.sprintId ?? "",
    releaseIds: issue.releaseIds ?? [],
    labels: issue.labels ?? [],
    storyPoints: issue.storyPoints ?? "",
    estimate: issue.estimateSec ? formatDuration(issue.estimateSec) : "",
    dueDate: issue.dueDate ? String(issue.dueDate).slice(0, 10) : "",
    parentId: issue.parentId ?? "",
  };
}

// Builds the POST or PATCH body. Status is never sent (server rejects it). Type is create-only.
export function toIssueBody(values, edit) {
  const estimate = String(values.estimate ?? "").trim();
  const estimateSec = estimate ? parseDuration(estimate) : null;
  if (estimate && estimateSec == null) throw new Error("Estimate must look like 1h 30m or 2d.");
  const body = {
    title: String(values.title ?? "").trim(),
    description: values.description ?? "",
    priorityId: values.priorityId || null,
    assigneeId: values.assigneeId || null,
    sprintId: values.sprintId || null,
    releaseIds: values.releaseIds ?? [],
    labels: values.labels ?? [],
    storyPoints: values.storyPoints === "" || values.storyPoints == null ? null : Number(values.storyPoints),
    estimateSec,
    dueDate: values.dueDate || null,
    parentId: values.parentId || null,
  };
  if (!edit) body.typeId = values.typeId;
  return body;
}

function ParentSelect({ projectId, value, onChange, error }) {
  return (
    <Select
      label="Parent issue"
      searchable
      placeholder="No parent"
      value={value ?? ""}
      onChange={(next) => onChange(next || "")}
      error={error}
      hint="Optional. Search by key or title."
      options={[{ value: "", label: "No parent" }]}
      loadOptions={(q) =>
        listIssues(projectId, { q, limit: 10 }).then((res) => [
          { value: "", label: "No parent" },
          ...(res.data ?? []).map((item) => ({ value: idOf(item), label: `${item.key} ${item.title}` })),
        ])
      }
    />
  );
}

// Fields for IssueFormModal. Renders inside FormModal's grid: pairs in two columns on desktop,
// Summary and Description span both columns.
export default function IssueForm({ values, set, errors = {}, options, projectId, edit = false }) {
  const span = "col-span-full";
  return (
    <>
      <Input
        label="Summary"
        required
        maxLength={255}
        className={span}
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        error={errors.title}
        hint="Required. Keep it short and specific."
      />
      <Input
        as="textarea"
        label="Description"
        className={span}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        error={errors.description}
        hint="Plain text or Markdown."
      />
      {!edit ? (
        <TypeSelect
          value={values.typeId}
          onChange={(v) => set("typeId", v)}
          types={options.types}
          label="Type"
          hint="Sets the kind of work. Cannot change after create."
        />
      ) : null}
      <PrioritySelect
        value={values.priorityId}
        onChange={(v) => set("priorityId", v)}
        priorities={options.priorities}
        hint="Optional. How urgent this work is."
      />
      <AssigneeSelect
        value={values.assigneeId}
        onChange={(v) => set("assigneeId", v)}
        hint="Search by name. Leave empty to keep it unassigned."
      />
      <SprintSelect
        projectId={projectId}
        value={values.sprintId}
        onChange={(v) => set("sprintId", v)}
        hint="Optional. The sprint this work belongs to."
      />
      <ReleaseSelect
        projectId={projectId}
        value={values.releaseIds}
        onChange={(v) => set("releaseIds", v)}
        hint="Optional. Every release this work ships in."
      />
      <LabelSelect
        value={values.labels}
        onChange={(v) => set("labels", v)}
        labels={options.labels}
        hint="Optional. Type to search existing labels."
      />
      <Input
        type="date"
        label="Due date"
        value={values.dueDate}
        onChange={(e) => set("dueDate", e.target.value)}
        error={errors.dueDate}
        hint="Optional."
      />
      <Input
        label="Estimate"
        hint="For example 1h 30m or 2d."
        value={values.estimate}
        onChange={(e) => set("estimate", e.target.value)}
        error={errors.estimateSec}
      />
      <Input
        type="number"
        min="0"
        step="0.5"
        label="Story points"
        hint="Optional. Half steps such as 0.5 are fine."
        value={values.storyPoints}
        onChange={(e) => set("storyPoints", e.target.value)}
        error={errors.storyPoints}
      />
      <ParentSelect
        projectId={projectId}
        value={values.parentId}
        onChange={(v) => set("parentId", v)}
        error={errors.parentId}
      />
    </>
  );
}
