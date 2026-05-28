// feat(pages/projectSettings/WorkflowEditorPage): edit a workflow's statuses and transitions and publish it.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getWorkflow, publishWorkflow, updateWorkflow } from "../../libs/api/config.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";
import StatusList, { CATEGORY_OPTIONS, cleanStatuses, newId } from "./components/StatusList.jsx";
import TransitionEditor, { cleanTransitions } from "./components/TransitionEditor.jsx";

const CATEGORY_TONE = { todo: "plain", inprogress: "iris", done: "spruce" };
const NO_ERRORS = { message: null, name: null, statuses: {}, transitions: {}, list: [] };

// Turns a stored workflow into the editable draft. Ids are strings, rules keep their saved shape.
const fromWorkflow = (w) => ({
  name: w.name ?? "",
  description: w.description ?? "",
  statuses: [...(w.statuses ?? [])]
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  .map((s) => ({
  id: String(s.id),
  name: s.name ?? "",
  category: s.category ?? "todo",
  color: s.color ?? "",
  icon: s.icon ?? "",
  description: s.description ?? "",
  })),
  transitions: (w.transitions ?? []).map((t) => ({
  id: String(t.id),
  name: t.name ?? "",
  from: (t.from ?? []).map(String),
  to: t.to ? String(t.to) : "",
  requiredFields: t.requiredFields ?? [],
  screenFields: t.screenFields ?? [],
  conditions: t.conditions ?? [],
  validators: t.validators ?? [],
  postActions: t.postActions ?? [],
  })),
});

// Splits a 422 into field, status, transition and footer messages. Paths look like statuses.0.name.
const mapErrors = (err) => {
  const out = { ...NO_ERRORS, statuses: {}, transitions: {}, list: [], message: err?.message ?? "Could not save the workflow." };
  (err?.errors ?? []).forEach(({ path = "", message }) => {
  const status = /(?:^|\.)statuses\.(\d+)/.exec(path);
  const transition = /(?:^|\.)transitions\.(\d+)/.exec(path);
  if (path === "name") out.name = message;
  else if (status) {
  if (out.statuses[Number(status[1])] === undefined) out.statuses[Number(status[1])] = message;
  } else if (transition) {
  if (out.transitions[Number(transition[1])] === undefined) out.transitions[Number(transition[1])] = message;
  } else out.list.push(message);
  });
  return out;
};

export default function WorkflowEditorPage() {
  const { workflowId } = useParams();
  const { projectId, status: projectStatus, resolutions, can } = useProject();
  const toast = useToast();
  const canEdit = can("workflow.manage");

  const wf = useResource(() => getWorkflow(projectId, workflowId), [projectId, workflowId]);
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [errors, setErrors] = useState(NO_ERRORS);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
  if (!wf.data) return;
  const next = fromWorkflow(wf.data);
  setDraft(next);
  setBaseline(JSON.stringify(next));
  setErrors(NO_ERRORS);
  }, [wf.data]);

  const loaded = projectStatus === "success" && wf.status === "success" && draft !== null;

  useViewEntry(
 "workflow-editor",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [loaded],
  );

  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const readOnly = !canEdit || wf.data?.status !== "draft";

  // Warn before the tab closes with unsaved changes.
  useEffect(() => {
  if (!dirty) return undefined;
  const warn = (e) => {
  e.preventDefault();
  e.returnValue = "";
  };
  window.addEventListener("beforeunload", warn);
  return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Removing a status also drops it from transitions, so no transition points at a missing status.
  const setStatuses = (next) =>
  setDraft((d) => {
  const keep = new Set(next.map((s) => s.id));
  return {
  ...d,
  statuses: next,
  transitions: d.transitions.map((t) => ({
  ...t,
  from: t.from.filter((id) => keep.has(id)),
  to: keep.has(t.to) ? t.to : "",
  })),
  };
  });

  const setTransitions = (transitions) => setDraft((d) => ({ ...d, transitions }));
  const patchTransition = (index, patch) =>
  setTransitions(draft.transitions.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const addTransition = () =>
  setTransitions([
  ...draft.transitions,
  { id: newId(), name: "", from: [], to: "", requiredFields: [], screenFields: [], conditions: [], validators: [], postActions: [] },
  ]);

  const save = async () => {
  setSaving(true);
  setErrors(NO_ERRORS);
  try {
  await updateWorkflow(projectId, workflowId, {
  name: draft.name.trim(),
  description: draft.description,
  statuses: cleanStatuses(draft.statuses),
  transitions: cleanTransitions(draft.transitions),
  });
  toast.success("Draft saved");
  wf.reload();
  return true;
  } catch (err) {
  setErrors(mapErrors(err));
  return false;
  } finally {
  setSaving(false);
  }
  };

  const publish = async () => {
  if (dirty) {
  const saved = await save();
  if (!saved) throw new Error("Save failed");
  }
  try {
  await publishWorkflow(projectId, workflowId);
  } catch (err) {
  setErrors(mapErrors(err));
  throw err;
  }
  toast.success("Workflow published");
  wf.reload();
  };

  const resolutionCount = resolutions?.length ?? 0;
  const statusOptions = (draft?.statuses ?? []).map((s) => ({
  value: s.id,
  label: s.name || "Untitled status",
  tone: CATEGORY_TONE[s.category] ?? "plain",
  }));
  const stateLabel = wf.data?.status === "live" ? "Live" : "Draft";

  if (wf.status === "error") {
  return (
  <>
  <PageHead title="Workflow" sub="Statuses and transitions" />
  <ProjectSettingsNav active="workflows" />
  <section className="card p-[22px]">
  <EmptyState tone="error" icon="workflow" title="This workflow could not load" text={wf.error?.message} onRetry={wf.reload} />
  </section>
  </>
  );
  }

  if (!draft) {
  return (
  <>
  <PageHead title="Workflow" sub="Statuses and transitions" />
  <ProjectSettingsNav active="workflows" />
  <div className="grid gap-[var(--gap)] grid-cols-[minmax(0,1fr)]">
  <Skeleton variant="cards" count={3} />
  </div>
  </>
  );
  }

  return (
  <>
  <PageHead
  title={draft.name || "Workflow"}
  sub={`${stateLabel} · version ${wf.data?.version ?? 0}`}
  />
  <ProjectSettingsNav active="workflows" />

  {readOnly ? (
  <section className="card p-[18px] mb-[var(--gap)] flex flex-wrap items-center gap-[10px]" role="status">
  <Badge tone={wf.data?.status === "live" ? "spruce" : "plain"}>{stateLabel}</Badge>
  <span className="text-muted text-[13.5px]">
  {wf.data?.status === "live"
  ? "This workflow is live and read only. Create a draft from the workflows list to change it."
  : "You can view this workflow. Only admins can change it."}
  </span>
  </section>
  ) : null}

  <div className="mx-auto w-full  grid gap-[var(--gap)]">
  <section className="card p-[20px] grid gap-[16px]" aria-labelledby="wf-details-title">
  <h2 id="wf-details-title" className="flex items-center gap-[8px] [font:600_17px_var(--display)] text-text">
  <Icon name="workflow" cls="text-muted" />
  Details
  </h2>
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Input
  label="Workflow name"
  value={draft.name}
  disabled={readOnly}
  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
  error={errors.name}
  hint="Shown when a project picks this workflow."
  />
  <Input
  label="Description"
  value={draft.description}
  disabled={readOnly}
  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
  hint="Optional. A short note for the team."
  />
  </div>
  </section>

  <section className="card p-[20px] grid gap-[16px]" aria-labelledby="wf-statuses-title">
  <h2 id="wf-statuses-title" className="flex items-center gap-[8px] [font:600_17px_var(--display)] text-text">
  <Icon name="stProgress" cls="text-muted" />
  Statuses
  </h2>
  <StatusList statuses={draft.statuses} onChange={setStatuses} readOnly={readOnly} errors={errors.statuses} />
  <div className="grid gap-[var(--gap)] grid-cols-3 w760:grid-cols-[minmax(0,1fr)]" aria-label="Status categories">
  {CATEGORY_OPTIONS.map((category) => {
  const items = draft.statuses.filter((s) => s.category === category.value);
  return (
  <div key={category.value} className="rounded-ctl border border-line p-[12px] grid gap-[8px] content-start">
  <p className="text-[12px] font-bold uppercase tracking-[.07em] text-muted">{category.label}</p>
  {items.length === 0 ? <p className="text-faint text-[13px]">No statuses</p> : null}
  <div className="flex flex-wrap gap-[6px]">
  {items.map((s) => (
  <span key={s.id} className="chip  truncate" title={s.name || "Untitled status"}>
  {s.name || "Untitled status"}
  </span>
  ))}
  </div>
  </div>
  );
  })}
  </div>
  </section>

  <section className="card p-[20px] grid gap-[14px]" aria-labelledby="wf-transitions-title">
  <div className="flex flex-wrap items-center justify-between gap-[10px]">
  <h2 id="wf-transitions-title" className="flex items-center gap-[8px] [font:600_17px_var(--display)] text-text">
  <Icon name="arrow" cls="text-muted" />
  Transitions
  </h2>
  {readOnly ? null : (
  <Button variant="soft" size="sm" icon="plus" onClick={addTransition} disabled={draft.statuses.length === 0}>
  Add transition
  </Button>
  )}
  </div>
  {draft.transitions.length === 0 ? (
  <div className="flex flex-wrap items-center gap-[16px]">
  <p className="text-muted text-[13.5px]">
  {draft.statuses.length === 0 ? "Add statuses first, then connect them with transitions." : "No transitions yet."}
  </p>
  <Illustration name="automation" alt="" className="w-[180px] w1000:hidden" />
  </div>
  ) : null}
  {draft.transitions.map((t, index) => (
  <div key={t.id} className="grid gap-[6px]">
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-[10px] w1000:grid-cols-[minmax(0,1fr)]">
  <Input
  label="Transition name"
  hideLabel
  placeholder="Transition name"
  value={t.name}
  disabled={readOnly}
  onChange={(e) => patchTransition(index, { name: e.target.value })}
  />
  <Select
  label="From"
  multiple
  value={t.from}
  options={statusOptions}
  disabled={readOnly}
  onChange={(from) => patchTransition(index, { from })}
  />
  <Select
  label="To"
  value={t.to}
  options={statusOptions}
  placeholder="Pick a status"
  disabled={readOnly}
  onChange={(to) => patchTransition(index, { to })}
  />
  <div className="flex items-center gap-[4px]">
  <Button variant="ghost" size="sm" icon="settings" onClick={() => setEditing(index)}>
  Rules
  </Button>
  {readOnly ? null : (
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="trash"
  aria-label={`Remove ${t.name || "transition"}`}
  onClick={() => setTransitions(draft.transitions.filter((_, i) => i !== index))}
  />
  )}
  </div>
  </div>
  {errors.transitions[index] ? (
  <p role="alert" className="text-bad text-[13px] font-semibold">
  {errors.transitions[index]}
  </p>
  ) : null}
  </div>
  ))}
  </section>

  {readOnly ? null : (
  <section className="card p-[18px] grid gap-[12px]" aria-label="Save or publish">
  {errors.message || errors.list.length ? (
  <div role="alert" className="grid gap-[4px] text-bad text-[13.5px] font-semibold">
  {errors.message && !errors.list.length ? <p>{errors.message}</p> : null}
  {errors.list.map((m, i) => (
  <p key={`${m}-${i}`}>{m}</p>
  ))}
  </div>
  ) : null}
  <div className="flex flex-wrap items-center justify-between gap-[10px]">
  <span className="flex items-center gap-[8px] text-muted text-[13px]">
  <Badge tone={dirty ? "iris" : "spruce"}>{dirty ? "Unsaved" : "Saved"}</Badge>
  {dirty ? "Unsaved changes" : "All changes saved"}
  </span>
  <div className="flex flex-wrap items-center gap-[10px]">
  <Button variant="soft" onClick={save} loading={saving} disabled={!dirty || saving}>
  Save draft
  </Button>
  <Button variant="ember" onClick={() => setPublishOpen(true)} disabled={saving}>
  Publish
  </Button>
  </div>
  </div>
  </section>
  )}
  </div>

  <TransitionEditor
  key={editing ?? "none"}
  open={editing !== null}
  transition={editing !== null ? draft.transitions[editing] : null}
  resolutions={resolutions ?? []}
  readOnly={readOnly}
  onClose={() => setEditing(null)}
  onSave={(rules) => patchTransition(editing, rules)}
  />

  <ConfirmDialog
  open={publishOpen}
  onClose={() => setPublishOpen(false)}
  title="Publish this workflow?"
  text={`Issues move under the published workflow. ${resolutionCount ? "" : "No resolutions are set up yet. "}Statuses that issues use cannot be removed.`}
  confirmLabel="Publish"
  tone="default"
  onConfirm={publish}
  />
  </>
  );
}
