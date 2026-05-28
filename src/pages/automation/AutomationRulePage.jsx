// feat(pages/automation/AutomationRulePage): build or edit an automation rule from a trigger, conditions and actions.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import { useConfirm } from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import Switch from "../../components/ui/Switch.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { createRule, getRule, listRuleRuns, updateRule } from "../../libs/api/automation.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import RuleSection, { ACTION_TYPES, CONDITION_OPS, TRIGGER_TYPES } from "./components/RuleSection.jsx";
import RunDetailDrawer from "./components/RunDetailDrawer.jsx";
import RunsTable from "./components/RunsTable.jsx";

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });
const LIST_LIMITS = { conditions: 10, actions: 10 };
const LIST_OPS = new Set(["in", "notIn"]);

const toParams = (config) =>
  Object.entries(config ?? {}).map(([k, v]) => ({
  k,
  v: typeof v === "string" ? v : v == null ? "" : JSON.stringify(v),
  }));

const fromParams = (params) =>
  Object.fromEntries(params.filter((p) => p.k.trim()).map((p) => [p.k.trim(), p.v]));

const emptyDraft = () => ({
  name: "",
  description: "",
  enabled: false,
  trigger: { type: "itemCreated", params: [] },
  conditions: [],
  actions: [{ type: "setField", params: [] }],
});

// Server rule to the editable draft. Lists are kept as rows so each can carry its own errors.
const fromRule = (rule) => {
  const actions = (rule.actions ?? []).map((a) => ({ type: a.type, params: toParams(a.config) }));
  return {
  name: rule.name ?? "",
  description: rule.description ?? "",
  enabled: Boolean(rule.enabled),
  trigger: { type: rule.trigger?.type ?? "itemCreated", params: toParams(rule.trigger?.config) },
  conditions: (rule.conditions ?? []).map((c) => ({
  field: c.field ?? "",
  op: c.op ?? "equals",
  value: Array.isArray(c.value) ? c.value.join(", ") : c.value == null ? "" : String(c.value),
  })),
  actions: actions.length ? actions : emptyDraft().actions,
  };
};

const toBody = (d) => ({
  name: d.name.trim(),
  description: d.description.trim() || undefined,
  enabled: d.enabled,
  trigger: { type: d.trigger.type, config: fromParams(d.trigger.params) },
  conditions: d.conditions
  .filter((c) => c.field.trim())
  .map((c) => ({
  field: c.field.trim(),
  op: c.op,
  value: LIST_OPS.has(c.op) ? c.value.split(",").map((s) => s.trim()).filter(Boolean) : c.value,
  })),
  actions: d.actions.map((a) => ({ type: a.type, config: fromParams(a.params) })),
});

// 422 paths look like body.conditions.0.field. Keep the part after "body.".
const mapErrors = (list = []) => {
  const map = {};
  list.forEach((item) => {
  const key = String(item.path ?? "").replace(/^body\./, "");
  if (key && !map[key]) map[key] = item.message;
  });
  return map;
};

function ParamRows({ label, params, disabled, onChange }) {
  const update = (index, change) =>
  onChange(params.map((p, i) => (i === index ? { ...p, ...change } : p)));
  return (
  <div className="grid gap-[8px]">
  {params.length > 0 ? <span className="field__label">{label}</span> : null}
  {params.map((p, i) => (
  <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-[8px] items-end">
  <Input
  label={`${label} ${i + 1} name`}
  hideLabel
  placeholder="Name"
  value={p.k}
  disabled={disabled}
  onChange={(e) => update(i, { k: e.target.value })}
  />
  <Input
  label={`${label} ${i + 1} value`}
  hideLabel
  placeholder="Value"
  value={p.v}
  disabled={disabled}
  onChange={(e) => update(i, { v: e.target.value })}
  />
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="trash"
  aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
  disabled={disabled}
  onClick={() => onChange(params.filter((_, j) => j !== i))}
  />
  </div>
  ))}
  <div>
  <Button
  variant="soft"
  size="sm"
  icon="plus"
  disabled={disabled}
  onClick={() => onChange([...params, { k: "", v: "" }])}
  >
  Add {label.toLowerCase()}
  </Button>
  </div>
  </div>
  );
}

export default function AutomationRulePage() {
  const { ruleId } = useParams();
  const isNew = !ruleId;
  const { projectId, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const canManage = can("automation.manage");

  const ruleRes = useResource(
  () => (isNew ? Promise.resolve({ data: null, meta: null }) : getRule(projectId, ruleId)),
  [ruleId, projectId],
  );
  const runsRes = useResource(
  () => (isNew ? Promise.resolve({ data: [], meta: null }) : listRuleRuns(projectId, ruleId, { limit: 10 })),
  [ruleId, projectId],
  );

  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openRun, setOpenRun] = useState(null);

  // Load the draft once per fetched rule. Saves update the baseline without resetting the draft.
  useEffect(() => {
  if (ruleRes.status !== "success") return;
  const next = ruleRes.data ? fromRule(withId(ruleRes.data)) : emptyDraft();
  setDraft(next);
  setBaseline(JSON.stringify(next));
  setErrors({});
  setFormError(null);
  }, [ruleRes.status, ruleId]);

  const ready = draft !== null;
  useViewEntry(
 "automation-rule",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const rule = ruleRes.data ? withId(ruleRes.data) : null;
  const locked = !canManage || saving;

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const setTrigger = (change) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, ...change } }));
  const setList = (key, rows) => setDraft((d) => ({ ...d, [key]: rows }));
  const setCondition = (index, change) =>
  setDraft((d) => ({ ...d, conditions: d.conditions.map((c, i) => (i === index ? { ...c, ...change } : c)) }));
  const setAction = (index, change) =>
  setDraft((d) => ({ ...d, actions: d.actions.map((a, i) => (i === index ? { ...a, ...change } : a)) }));

  const save = async (e) => {
  e?.preventDefault();
  if (!draft || saving || !canManage) return;
  setSaving(true);
  setErrors({});
  setFormError(null);
  try {
  const body = toBody(draft);
  const res = isNew ? await createRule(projectId, body) : await updateRule(projectId, ruleId, body);
  toast.success("Rule saved");
  setBaseline(JSON.stringify(draft));
  if (isNew) {
  const created = withId(res.data ?? {});
  if (created.id) navigate(paths.automationRule(projectId, created.id), { replace: true });
  } else {
  ruleRes.setData(res.data ?? ruleRes.data);
  }
  } catch (err) {
  if (err?.status === 422) {
  const map = mapErrors(err.errors);
  setErrors(map);
  if (!Object.keys(map).length) setFormError(err.message ?? "Check the highlighted fields.");
  } else {
  setFormError(err?.message ?? "Could not save the rule. Try again.");
  }
  } finally {
  setSaving(false);
  }
  };

  const leave = async () => {
  if (dirty) {
  const discard = await confirm({
  title: "Discard changes?",
  text: "Your edits to this rule have not been saved.",
  confirmLabel: "Discard",
  tone: "danger",
  });
  if (!discard) return;
  }
  navigate(paths.automation(projectId));
  };

  if (ruleRes.status === "error") {
  return (
  <>
  <PageHead title="Automation rule" back={{ to: paths.automation(projectId), label: "Automation" }} />
  <div className="card">
  <EmptyState tone="error" title={ruleRes.error?.message ?? "Could not load this rule."} onRetry={ruleRes.reload} />
  </div>
  </>
  );
  }

  const title = isNew ? "New automation rule" : draft?.name || rule?.name || "Automation rule";

  return (
  <>
  <PageHead
  title={title}
  sub="When something happens, check the conditions, then take the actions."
  back={{ to: paths.automation(projectId), label: "Automation" }}
  />

  {!draft ? (
  <Skeleton variant="cards" count={3} />
  ) : (
  <form onSubmit={save} noValidate className="grid gap-[var(--gap)] ">
  {!canManage ? (
  <p className="card__sub flex items-center gap-[8px]">
  <Icon name="lock" />
  Only project admins can change automation rules.
  </p>
  ) : null}

  <section aria-labelledby="rule-details" className="card p-[20px] grid gap-[16px] grid-cols-2 w1000:grid-cols-1">
  <header className="flex items-center gap-[12px] col-span-full">
  <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
  <Icon name="settings" />
  </span>
  <h2 id="rule-details" className="text-[15px] font-bold text-text">
  Rule details
  </h2>
  </header>
  <Input
  label="Rule name"
  value={draft.name}
  onChange={(e) => setField("name", e.target.value)}
  error={errors.name}
  disabled={locked}
  hint="Shown in the rule list and run history."
  required
  maxLength={120}
  />
  <div className="grid content-start gap-[6px]">
  <span className="field__label">Status</span>
  <Switch
  checked={draft.enabled}
  onChange={(v) => setField("enabled", v)}
  label="Turn on when saved"
  disabled={locked}
  />
  <p className="field__hint">Rules that are off never run.</p>
  </div>
  <Input
  label="Description"
  as="textarea"
  className="col-span-full"
  value={draft.description}
  onChange={(e) => setField("description", e.target.value)}
  error={errors.description}
  disabled={locked}
  hint="Optional. Shown to people who manage this project."
  />
  </section>

  <RuleSection id="rule-when" icon="bolt" title="When" text="The event that starts this rule.">
  <Select
  label="Trigger"
  options={TRIGGER_TYPES}
  value={draft.trigger.type}
  onChange={(value) => setTrigger({ type: value })}
  error={errors["trigger.type"]}
  hint="Starts the rule each time this happens."
  disabled={locked}
  />
  <ParamRows
  label="Trigger setting"
  params={draft.trigger.params}
  disabled={locked}
  onChange={(params) => setTrigger({ params })}
  />
  </RuleSection>

  <RuleSection id="rule-if" icon="filter" title="If" text="Every condition must match. Leave empty to match always.">
  {draft.conditions.length === 0 ? (
  <EmptyState icon="filter" title="No conditions" text="The rule runs for every matching event." />
  ) : null}
  {draft.conditions.map((c, i) => (
  <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-[8px] items-end w760:grid-cols-[minmax(0,1fr)]">
  <Input
  label="Field"
  placeholder="Field name"
  value={c.field}
  onChange={(e) => setCondition(i, { field: e.target.value })}
  error={errors[`conditions.${i}.field`]}
  disabled={locked}
  />
  <Select
  label="Operator"
  options={CONDITION_OPS}
  value={c.op}
  onChange={(value) => setCondition(i, { op: value })}
  error={errors[`conditions.${i}.op`]}
  disabled={locked}
  />
  <Input
  label="Value"
  placeholder={LIST_OPS.has(c.op) ? "Comma separated" : "Value"}
  value={c.value}
  onChange={(e) => setCondition(i, { value: e.target.value })}
  hint={LIST_OPS.has(c.op) ? "Separate several values with commas." : undefined}
  disabled={locked || c.op === "isEmpty" || c.op === "isNotEmpty"}
  />
  <Button
  iconOnly
  variant="ghost"
  icon="trash"
  aria-label={`Remove condition ${i + 1}`}
  disabled={locked}
  onClick={() => setList("conditions", draft.conditions.filter((_, j) => j !== i))}
  />
  </div>
  ))}
  <div>
  <Button
  variant="soft"
  size="sm"
  icon="plus"
  disabled={locked || draft.conditions.length >= LIST_LIMITS.conditions}
  onClick={() => setList("conditions", [...draft.conditions, { field: "", op: "equals", value: "" }])}
  >
  Add condition
  </Button>
  </div>
  </RuleSection>

  <RuleSection id="rule-then" icon="play" title="Then" text="Actions run in order when the conditions match.">
  {draft.actions.map((a, i) => (
  <div key={i} className="grid gap-[10px] rounded-ctl border border-line p-[14px]">
  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-[8px] items-end">
  <Select
  label={`Action ${i + 1}`}
  options={ACTION_TYPES}
  value={a.type}
  onChange={(value) => setAction(i, { type: value })}
  error={errors[`actions.${i}.type`]}
  disabled={locked}
  />
  <Button
  iconOnly
  variant="ghost"
  icon="trash"
  aria-label={`Remove action ${i + 1}`}
  disabled={locked || draft.actions.length <= 1}
  onClick={() => setList("actions", draft.actions.filter((_, j) => j !== i))}
  />
  </div>
  <ParamRows
  label="Action setting"
  params={a.params}
  disabled={locked}
  onChange={(params) => setAction(i, { params })}
  />
  </div>
  ))}
  <div>
  <Button
  variant="soft"
  size="sm"
  icon="plus"
  disabled={locked || draft.actions.length >= LIST_LIMITS.actions}
  onClick={() => setList("actions", [...draft.actions, { type: "setField", params: [] }])}
  >
  Add action
  </Button>
  </div>
  </RuleSection>

  {canManage ? (
  <div className="flex flex-wrap items-center justify-end gap-[10px] pt-[4px]">
  {formError ? (
  <p role="alert" className="order-[-1] basis-full text-bad text-[13px] font-semibold">
  {formError}
  </p>
  ) : null}
  <Button variant="ghost" onClick={leave} disabled={saving}>
  Cancel
  </Button>
  <Button variant="ember" type="submit" loading={saving} disabled={saving}>
  Save rule
  </Button>
  </div>
  ) : null}

  {!isNew ? (
  <RuleSection id="rule-runs" icon="runs" title="Recent runs" text="The last runs of this rule.">
  <RunsTable
  rows={runsRes.data ?? []}
  status={runsRes.status}
  error={runsRes.error}
  onRetry={runsRes.reload}
  onOpen={setOpenRun}
  showRule={false}
  label="Recent runs"
  />
  </RuleSection>
  ) : null}
  </form>
  )}

  <RunDetailDrawer
  open={Boolean(openRun)}
  onClose={() => setOpenRun(null)}
  run={openRun}
  ruleName={draft?.name || rule?.name}
  />
  </>
  );
}
