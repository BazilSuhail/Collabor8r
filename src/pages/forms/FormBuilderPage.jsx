// feat(pages/forms/FormBuilderPage): build an intake form field by field with a live preview of the public page.
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Switch from "../../components/ui/Switch.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { createForm, getForm, updateForm } from "../../libs/api/forms.js";
import { paths } from "../../routes/paths.js";
import { bindLift, fadeUp, flip, useViewEntry } from "../../utils/motion.js";
import { useMutation } from "../../utils/useMutation.js";
import { useResource } from "../../utils/useResource.js";
import FieldEditor from "./components/FieldEditor.jsx";
import FormRenderer from "./components/FormRenderer.jsx";

const MAX_FIELDS = 40;

const newField = () => ({
  id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  label: "",
  type: "text",
  required: false,
});

const toDraft = (form) => ({
  name: form?.name ?? "",
  description: form?.description ?? "",
  issueTypeId: form?.issueTypeId ?? "",
  defaultPriorityId: form?.defaultPriorityId ?? "",
  isPublic: form?.isPublic ?? false,
  fields: (form?.fields ?? []).map((f) => ({ ...f })),
});

const toBody = (d) => ({
  name: d.name.trim(),
  description: d.description.trim(),
  issueTypeId: d.issueTypeId,
  defaultPriorityId: d.defaultPriorityId || null,
  isPublic: d.isPublic,
  fields: d.fields.map((f) => {
  const out = { id: f.id, label: f.label.trim(), type: f.type, required: !!f.required };
  if (f.helpText?.trim()) out.helpText = f.helpText.trim();
  if (f.type === "select" || f.type === "multiSelect") out.options = f.options ?? [];
  return out;
  }),
});

// Server paths arrive as "body.<key>". Accept either spelling.
const errorFor = (map, key) => map[`body.${key}`] ?? map[key];

export default function FormBuilderPage() {
  const { formId } = useParams();
  const isNew = !formId;
  const navigate = useNavigate();
  const { projectId, can, types, priorities } = useProject();
  const canEdit = can("form.manage");
  const res = useResource(
  () => (isNew ? Promise.resolve({ data: null, meta: null }) : getForm(projectId, formId)),
  [projectId, formId],
  );
  const [draft, setDraft] = useState(() => toDraft(null));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toDraft(null)));
  const [previewValues, setPreviewValues] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const listRef = useRef(null);
  const ready = res.status === "success";
  const dirty = JSON.stringify(draft) !== baseline;

  const save = useMutation(
  (body) => (isNew ? createForm(projectId, body) : updateForm(projectId, formId, body)),
  { success: "Form saved" },
  );

  useViewEntry(
 "form-builder",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  fadeUp(q(".card > *"), { y: 12, stagger: 0.04 });
  return bindLift(root);
  },
  [ready],
  );

  useEffect(() => {
  if (res.status !== "success") return;
  const next = toDraft(res.data);
  setDraft(next);
  setBaseline(JSON.stringify(next));
  setPreviewValues({});
  }, [res.status, res.data]);

  useEffect(() => {
  if (!dirty) return undefined;
  const onBeforeUnload = (e) => {
  e.preventDefault();
  e.returnValue = "";
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const patchField = (id, p) =>
  setDraft((d) => ({ ...d, fields: d.fields.map((f) => (f.id === id ? { ...f, ...p } : f)) }));
  const addField = () => setDraft((d) => ({ ...d, fields: [...d.fields, newField()] }));
  const removeField = (id) => setDraft((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) }));
  const moveField = (index, dir) => {
  const to = dir === "up" ? index - 1 : index + 1;
  flip(listRef.current, () =>
  flushSync(() =>
  setDraft((d) => {
  const fields = [...d.fields];
  [fields[index], fields[to]] = [fields[to], fields[index]];
  return { ...d, fields };
  }),
  ),
  );
  };

  const onSave = async () => {
  const errs = {};
  if (!draft.name.trim()) errs.name = "Give the form a name";
  if (!draft.issueTypeId) errs.issueTypeId = "Pick the issue type this form creates";
  if (draft.fields.some((f) => !f.label.trim())) errs.fields = "Every field needs a label";
  setLocalErrors(errs);
  if (Object.keys(errs).length) return;
  const body = toBody(draft);
  const saved = await save.run(body);
  if (!saved) return;
  setBaseline(JSON.stringify(draft));
  if (isNew) navigate(paths.form(projectId, saved.data?.id ?? saved.data?._id), { replace: true });
  };

  const typeOptions = (types ?? []).map((t) => ({ value: t.id ?? t._id, label: t.name }));
  const priorityOptions = [
  { value: "", label: "No default" },
  ...(priorities ?? []).map((p) => ({ value: p.id ?? p._id, label: p.name })),
  ];
  const serverErrors = save.fieldErrors ?? {};
  const nameError = localErrors.name ?? errorFor(serverErrors, "name");
  const typeError = localErrors.issueTypeId ?? errorFor(serverErrors, "issueTypeId");
  const fieldsError = localErrors.fields ?? (Object.keys(serverErrors).length ? "Check the fields and try again." : null);

  if (res.status === "loading") {
  return (
  <>
  <PageHead title="Form builder" sub="Loading the form." />
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1 " aria-busy="true">
  <Skeleton variant="cards" count={2} />
  </div>
  </>
  );
  }

  if (res.status === "error") {
  return (
  <>
  <PageHead title="Form builder" sub="The form did not load." />
  <section className="card p-[22px]">
  <EmptyState tone="error" title="This form did not load" text="Check the link and try again." onRetry={res.reload} />
  </section>
  </>
  );
  }

  if (!canEdit) {
  return (
  <>
  <PageHead title="Form builder" sub="Forms are read only for your role." />
  <section className="card p-[22px]">
  <EmptyState icon="lock" title="Read only" text="Only project leads can change forms." />
  </section>
  </>
  );
  }

  return (
  <>
  <PageHead
  title={isNew ? "New form" : draft.name || "Form"}
  sub="Build the fields people fill in. The preview shows the public page."
  actions={
  <>
  <Button as={Link} to={paths.forms(projectId)} variant="ghost" icon="chevL">
  Forms
  </Button>
  {dirty ? <Badge tone="saffron">Unsaved changes</Badge> : null}
  <Button variant="ember" icon="check" loading={save.pending} disabled={save.pending} onClick={onSave}>
  Save form
  </Button>
  </>
  }
  />
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1 ">
  <section className="card p-[20px] grid gap-[16px] content-start">
  <h2 className="flex items-center gap-[8px] [font:600_17px_var(--display)] tracking-[-0.015em] text-text">
  <Icon name="form" cls="text-muted" />
  Details
  </h2>
  <Input
  label="Name"
  hint="Required. Shown as the title of the public form."
  value={draft.name}
  maxLength={120}
  onChange={(e) => patch({ name: e.target.value })}
  error={nameError}
  disabled={save.pending}
  />
  <Input
  as="textarea"
  label="Description"
  hint="Shown above the form on the public page."
  value={draft.description}
  maxLength={1000}
  onChange={(e) => patch({ description: e.target.value })}
  disabled={save.pending}
  />
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[12px] w760:grid-cols-[minmax(0,1fr)]">
  <Select
  label="Issue type"
  hint="Required. The kind of issue each submission creates."
  value={draft.issueTypeId}
  options={typeOptions}
  onChange={(v) => patch({ issueTypeId: v })}
  placeholder="Pick a type"
  error={typeError}
  disabled={save.pending}
  />
  <Select
  label="Default priority"
  hint="Optional. Used when a submission has no priority."
  value={draft.defaultPriorityId}
  options={priorityOptions}
  onChange={(v) => patch({ defaultPriorityId: v })}
  disabled={save.pending}
  />
  </div>
  <div className="flex items-center justify-between gap-[12px] rounded-[14px] border border-line bg-surface-2 p-[12px]">
  <span className="grid gap-[2px]">
  <span className="font-semibold text-text">Accept submissions</span>
  <span className="text-muted text-[13px]">Off means the public link shows that the form is not available.</span>
  </span>
  <Switch checked={draft.isPublic} onChange={(v) => patch({ isPublic: v })} label="Accept submissions" hideLabel disabled={save.pending} />
  </div>
  <div className="flex items-center gap-[10px] flex-wrap">
  <h2 className="flex items-center gap-[8px] [font:600_17px_var(--display)] tracking-[-0.015em] text-text">
  <Icon name="list" cls="text-muted" />
  Fields
  </h2>
  <Badge tone={draft.fields.length >= MAX_FIELDS ? "saffron" : "plain"} className="tnum">
  {draft.fields.length} of {MAX_FIELDS}
  </Badge>
  <Button
  variant="soft"
  size="sm"
  icon="plus"
  className="ml-auto"
  disabled={save.pending || draft.fields.length >= MAX_FIELDS}
  onClick={addField}
  >
  Add field
  </Button>
  </div>
  {fieldsError ? <p role="alert" className="text-bad text-[13px] font-semibold">{fieldsError}</p> : null}
  <div ref={listRef} className="grid gap-[10px]">
  {draft.fields.map((f, i) => (
  <div key={f.id} data-key={f.id}>
  <FieldEditor
  field={f}
  index={i}
  count={draft.fields.length}
  disabled={save.pending}
  onPatch={(p) => patchField(f.id, p)}
  onMove={(dir) => moveField(i, dir)}
  onRemove={() => removeField(f.id)}
  />
  </div>
  ))}
  {draft.fields.length === 0 ? (
  <div className="grid justify-items-center gap-[8px]">
  <Illustration name="forms" alt="" className="w-[180px] w1000:hidden" />
  <EmptyState
  icon="form"
  title="No fields yet"
  text="Add a field to start the form."
  action={
  <Button variant="soft" size="sm" icon="plus" disabled={save.pending} onClick={addField}>
  Add field
  </Button>
  }
  />
  </div>
  ) : null}
  </div>
  {save.error ? (
  <p role="alert" className="text-bad text-[13px] font-semibold">
  {save.error.message ?? "The form could not be saved. Try again."}
  </p>
  ) : null}
  </section>
  <section className="card p-[20px] grid gap-[16px] content-start" aria-label="Preview">
  <span className="flex items-center gap-[8px] text-muted text-[12px] font-semibold uppercase tracking-[.07em]">
  <Icon name="eye" />
  Preview
  </span>
  <h2 className="[font:700_22px_var(--display)] tracking-[-0.02em] text-text truncate">{draft.name || "Untitled form"}</h2>
  {draft.description ? <p className="card__sub">{draft.description}</p> : null}
  <FormRenderer
  fields={draft.fields}
  values={previewValues}
  onChange={(id, v) => setPreviewValues((prev) => ({ ...prev, [id]: v }))}
  idPrefix="prev"
  columns={1}
  />
  <Button variant="ember" disabled className="w-full">
  Submit
  </Button>
  </section>
  </div>
  </>
  );
}
