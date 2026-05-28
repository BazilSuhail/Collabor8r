// feat(pages/projectSettings/ProjectSettingsPage): edit a project's details, schedule and theme, handle join requests and archive the project.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import FormModal from "../../components/ui/FormModal.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import ThemePicker from "../../components/projects/ThemePicker.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { archiveProject, decideProjectJoin, listProjectJoinRequests, updateProject } from "../../libs/api/projects.js";
import { listBoards, updateBoard } from "../../libs/api/boards.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import { toFieldErrors } from "../../utils/formErrors.js";
import { paths } from "../../routes/paths.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";

// Matches the server's updateProjectSchema. Fields the server does not accept are not shown.
const VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "request", label: "Request to join" },
  { value: "open", label: "Open to org" },
];

const DEFAULT_VIEW_OPTIONS = [
  { value: "board", label: "Board" },
  { value: "backlog", label: "Backlog" },
  { value: "list", label: "List" },
  { value: "timeline", label: "Timeline" },
];

const HEALTH_OPTIONS = [
  { value: "on_track", label: "On track", tone: "spruce" },
  { value: "at_risk", label: "At risk", tone: "saffron" },
  { value: "off_track", label: "Off track", tone: "ember" },
  { value: "not_set", label: "Not set", tone: "plain" },
];

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const toForm = (project) => ({
  name: project.name ?? "",
  description: project.description ?? "",
  headline: project.headline ?? "",
  leadId: project.leadId ?? "",
  visibility: project.visibility ?? "private",
  defaultView: project.defaultView ?? "board",
  startDate: toDateInput(project.startDate),
  targetDate: toDateInput(project.targetDate),
  health: project.health ?? "not_set",
  healthNote: project.healthNote ?? "",
  themeKey: project.themeKey ?? null,
});

function SectionTitle({ id, icon, children }) {
  return (
    <h2 id={id} className="flex min-w-0 items-center gap-[8px] [font:600_17px_var(--display)] text-text">
      <Icon name={icon} cls="text-muted shrink-0" />
      <span className="truncate">{children}</span>
    </h2>
  );
}

export default function ProjectSettingsPage() {
  const { projectId, project, status, error, reload, can, members } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = can("project.admin");
  const archived = project?.status === "archived";
  const editable = isAdmin && !archived;
  const ready = status === "success";

  useViewEntry(
  "project-settings",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const boards = useResource(() => listBoards(projectId, { limit: 100 }), [projectId]);
  const joins = useResource(
  () => (isAdmin ? listProjectJoinRequests(projectId, { status: "pending", limit: 100 }) : Promise.resolve({ data: [], meta: null })),
  [projectId, isAdmin],
  );

  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decideRow, setDecideRow] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const base = project ? toForm(project) : null;
  const values = form ?? base ?? toForm({});
  const dirty = form !== null;
  const set = (key, value) => setForm((prev) => ({ ...(prev ?? base ?? toForm({})), [key]: value }));

  const discard = () => {
  setForm(null);
  setFieldErrors({});
  setFormError(null);
  };

  const save = async (e) => {
  e.preventDefault();
  if (values.startDate && values.targetDate && values.targetDate < values.startDate) {
  setFieldErrors({ targetDate: "Target date must be on or after the start date" });
  return;
  }
  setSaving(true);
  setFieldErrors({});
  setFormError(null);
  try {
  await updateProject(projectId, {
  name: values.name.trim(),
  description: values.description,
  headline: values.headline,
  leadId: values.leadId || null,
  visibility: values.visibility,
  defaultView: values.defaultView,
  themeKey: values.themeKey,
  startDate: values.startDate || null,
  targetDate: values.targetDate || null,
  health: values.health,
  healthNote: values.healthNote,
  });
  setForm(null);
  toast.success("Saved");
  reload();
  } catch (err) {
  const message = err?.message ?? "Could not save the project.";
  if (err?.status === 422) setFieldErrors(toFieldErrors(err.errors));
  else setFormError(message);
  toast.error(message);
  } finally {
  setSaving(false);
  }
  };

  const boardRows = boards.data ?? [];
  const boardOptions = boardRows.map((b) => ({ value: b._id, label: b.name }));
  const defaultBoard = boardRows.find((b) => b.isDefault)?._id ?? "";

  const chooseDefaultBoard = async (id) => {
  try {
  await updateBoard(projectId, id, { isDefault: true });
  toast.success("Saved");
  boards.reload();
  } catch (err) {
  if (err?.status === 422 || err?.status === 409) toast.error(err.message);
  }
  };

  const memberOptions = [
  { value: "", label: "No lead" },
  ...members.map((m) => ({ value: m.userId, label: m.userName || "Member" })),
  ];

  const joinColumns = [
  {
  key: "person",
  label: "Person",
  render: (row) => (
  <span className="inline-flex min-w-0 items-center gap-[10px]">
  <Avatar name={row.userName || "Member"} src={row.userAvatar || undefined} size="sm" />
  <span className="truncate font-semibold text-text">{row.userName || "Member"}</span>
  </span>
  ),
  },
  { key: "role", label: "Role", render: (row) => <Badge tone="iris">{row.requestedRole}</Badge> },
  { key: "message", label: "Message", render: (row) => <span className="text-muted truncate">{row.message || ""}</span> },
  ];

  if (status === "error") {
  return (
  <>
  <PageHead title="Project settings" sub={project?.name ?? ""} />
  <ProjectSettingsNav active="general" />
  <section className="card p-[20px]">
  <EmptyState tone="error" icon="project" title="Project settings could not load" text={error?.message} onRetry={reload} />
  </section>
  </>
  );
  }

  return (
  <>
  <PageHead title="Project settings" sub={project?.name ?? ""} />
  <ProjectSettingsNav active="general" />

  {status === "loading" ? (
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Skeleton variant="cards" count={2} />
  </div>
  ) : (
  <form noValidate onSubmit={save} className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <section className="card min-w-0 p-[20px] grid gap-[16px]" aria-labelledby="project-general-title">
  <div className="flex min-w-0 items-center justify-between gap-[10px]">
  <SectionTitle id="project-general-title" icon="gear">General</SectionTitle>
  {archived ? <Badge tone="saffron">Archived</Badge> : null}
  </div>
  <p className="card__sub truncate" title={project?.name ?? ""}>
  Editing {project?.name ?? "this project"}
  </p>
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Input
  label="Project name"
  value={values.name}
  disabled={!editable}
  onChange={(e) => set("name", e.target.value)}
  error={fieldErrors.name}
  hint="Shown across lists and boards"
  />
  <Input label="Key" value={project?.key ?? ""} readOnly disabled hint="Set when the project is created" />
  <div className="col-span-full">
  <Input
  label="Headline"
  value={values.headline}
  disabled={!editable}
  onChange={(e) => set("headline", e.target.value)}
  error={fieldErrors.headline}
  hint="A one-line summary shown under the name"
  />
  </div>
  <div className="col-span-full">
  <Input
  label="Description"
  as="textarea"
  value={values.description}
  disabled={!editable}
  onChange={(e) => set("description", e.target.value)}
  error={fieldErrors.description}
  hint="Optional. A short summary for the team"
  />
  </div>
  <Select
  label="Lead"
  value={values.leadId}
  options={memberOptions}
  disabled={!editable}
  onChange={(v) => set("leadId", v)}
  error={fieldErrors.leadId}
  hint="The person who owns this project"
  />
  <fieldset disabled={!editable} className="col-span-full m-0 grid min-w-0 gap-[6px] border-0 p-0">
  <legend className="field__label">Who can join</legend>
  <SegmentedControl
  label="Who can join"
  value={values.visibility}
  options={VISIBILITY_OPTIONS}
  onChange={(v) => set("visibility", v)}
  />
  <p className="field__hint">Controls who can find and join this project</p>
  {fieldErrors.visibility ? (
  <p role="alert" className="text-bad text-[13px] font-semibold">
  {fieldErrors.visibility}
  </p>
  ) : null}
  </fieldset>
  </div>
  </section>

  <section className="card min-w-0 p-[20px] grid gap-[16px]" aria-labelledby="project-schedule-title">
  <SectionTitle id="project-schedule-title" icon="calendar">Schedule</SectionTitle>
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Input
  type="date"
  label="Start date"
  value={values.startDate}
  disabled={!editable}
  onChange={(e) => set("startDate", e.target.value)}
  error={fieldErrors.startDate}
  hint="When work begins"
  />
  <Input
  type="date"
  label="Target date"
  value={values.targetDate}
  disabled={!editable}
  onChange={(e) => set("targetDate", e.target.value)}
  error={fieldErrors.targetDate}
  hint="When the project should finish"
  />
  <Select
  label="Health"
  value={values.health}
  options={HEALTH_OPTIONS}
  disabled={!editable}
  onChange={(v) => set("health", v)}
  error={fieldErrors.health}
  hint="Shown on the project overview"
  />
  <div className="col-span-full">
  <Input
  label="Health note"
  as="textarea"
  value={values.healthNote}
  disabled={!editable}
  onChange={(e) => set("healthNote", e.target.value)}
  error={fieldErrors.healthNote}
  hint="Optional. Why the project has this health"
  />
  </div>
  </div>
  </section>

  <section className="card min-w-0 p-[20px] grid gap-[12px]" aria-labelledby="project-board-title">
  <SectionTitle id="project-board-title" icon="kanban">Board defaults</SectionTitle>
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  {boards.status === "error" ? (
  <div className="col-span-full">
  <EmptyState tone="error" icon="kanban" title="Boards could not load" onRetry={boards.reload} />
  </div>
  ) : boards.status === "loading" ? (
  <div className="col-span-full">
  <Skeleton variant="rows" count={1} cols={1} />
  </div>
  ) : (
  <Select
  label="Default board"
  value={defaultBoard}
  options={boardOptions}
  placeholder="Pick a board"
  disabled={!can("board.manage") || archived}
  hint={boardOptions.length ? "Saves as soon as you pick it" : "Create a board first"}
  onChange={chooseDefaultBoard}
  />
  )}
  <Select
  label="Default view"
  value={values.defaultView}
  options={DEFAULT_VIEW_OPTIONS}
  disabled={!editable}
  onChange={(v) => set("defaultView", v)}
  error={fieldErrors.defaultView}
  hint="The view that opens first in this project"
  />
  </div>
  </section>

  <section className="card col-span-full min-w-0 p-[20px] grid gap-[12px]" aria-labelledby="project-theme-title">
  <SectionTitle id="project-theme-title" icon="sparkle">Banner</SectionTitle>
  <p className="card__sub">Choose the banner shown at the top of the project.</p>
  <ThemePicker value={values.themeKey} disabled={!editable} onChange={(key) => set("themeKey", key)} />
  </section>

  {isAdmin ? (
  <section className="card col-span-full min-w-0 p-[20px] grid gap-[12px]" aria-labelledby="project-joins-title">
  <SectionTitle id="project-joins-title" icon="users">Join requests</SectionTitle>
  <p className="card__sub">People who asked to join this project. Select a row to decide.</p>
  <DataTable
  label="Join requests"
  rowKey="_id"
  columns={joinColumns}
  rows={joins.data ?? []}
  status={joins.status}
  error={joins.error}
  onRetry={joins.reload}
  onRowClick={(row) => setDecideRow(row)}
  empty={{ icon: "users", title: "No join requests", text: "People who ask to join this project appear here." }}
  />
  </section>
  ) : null}

  {isAdmin ? (
  <section className="card col-span-full min-w-0 p-[20px] grid gap-[12px]" aria-labelledby="project-danger-title">
  <SectionTitle id="project-danger-title" icon="archive">Archive project</SectionTitle>
  <p className="card__sub">Archiving hides this project from the project list.</p>
  <div>
  <Button variant="danger" disabled={archived} onClick={() => setArchiveOpen(true)}>
  Archive project
  </Button>
  </div>
  </section>
  ) : null}

  {isAdmin ? (
  <div className="sticky bottom-[12px] z-[5] col-span-full flex flex-wrap items-center justify-end gap-[10px] rounded-ctl border border-line bg-float p-[12px] shadow-[var(--shadow-pop)]">
  {dirty ? (
  <Badge tone="saffron" className="mr-auto">
  Unsaved changes
  </Badge>
  ) : null}
  {formError ? (
  <p role="alert" className="basis-full text-bad text-[13px] font-semibold">
  {formError}
  </p>
  ) : null}
  <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>
  Discard
  </Button>
  <Button variant="ember" type="submit" loading={saving} disabled={!dirty || saving}>
  Save
  </Button>
  </div>
  ) : null}
  </form>
  )}

  <FormModal
  open={Boolean(decideRow)}
  onClose={() => setDecideRow(null)}
  title="Decide join request"
  description={
  decideRow
  ? `${decideRow.userName || "This person"} asked to join as ${decideRow.requestedRole}.`
  : undefined
  }
  submitLabel="Confirm"
  initialValues={{ decision: "approve", declineReason: "" }}
  onSubmit={async (v) => {
  await decideProjectJoin(projectId, decideRow._id, {
  decision: v.decision,
  ...(v.decision === "decline" && v.declineReason ? { declineReason: v.declineReason } : {}),
  });
  toast.success(v.decision === "approve" ? "Approved" : "Declined");
  joins.reload();
  }}
  fields={({ values: dv, set: setDecision, errors }) => (
  <>
  <div className="col-span-full">
  <Select
  label="Decision"
  value={dv.decision}
  options={[
  { value: "approve", label: "Approve" },
  { value: "decline", label: "Decline" },
  ]}
  onChange={(d) => setDecision("decision", d)}
  error={errors.decision}
  />
  </div>
  {dv.decision === "decline" ? (
  <div className="col-span-full">
  <Input
  label="Reason (optional)"
  value={dv.declineReason}
  onChange={(e) => setDecision("declineReason", e.target.value)}
  error={errors.declineReason}
  />
  </div>
  ) : null}
  </>
  )}
  />

  <ConfirmDialog
  open={archiveOpen}
  onClose={() => setArchiveOpen(false)}
  title="Archive project?"
  text={`Archiving hides ${project?.name ?? "this project"} from every list.`}
  confirmLabel="Archive"
  tone="danger"
  onConfirm={async () => {
  try {
  await archiveProject(projectId);
  } catch (err) {
  if (err?.status === 409 || err?.status === 422) toast.error(err.message);
  throw err;
  }
  toast.success("Project archived");
  navigate(paths.projects());
  }}
  />
  </>
  );
}
