// feat(pages/projectSettings/RolesPage): view the project permission matrix and create, edit or delete custom roles.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import SideModal from "../../components/ui/SideModal.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { emptyCopy } from "../../metadata/empty.js";
import { createRole, deleteRole, listRoles, updateRole } from "../../libs/api/projects.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { toFieldErrors } from "../../utils/formErrors.js";
import { useResource } from "../../utils/useResource.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";
import RoleMatrix from "./components/RoleMatrix.jsx";

const blankDraft = { name: "", description: "", permissions: [] };

export default function RolesPage() {
  const { projectId, status, can } = useProject();
  const toast = useToast();
  const ready = status === "success";
  const canManage = can("role.manage");

  useViewEntry(
 "roles",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const roles = useResource(() => listRoles(projectId, { limit: 100 }), [projectId]);
  const rows = roles.data ?? [];
  const permissionUnion = [...new Set(rows.flatMap((r) => r.permissions ?? []))].sort();

  // editor: null when closed, otherwise { mode: "create" | "edit", role? }.
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(blankDraft);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openEditor = (next) => {
  setFieldErrors({});
  setFormError(null);
  setDraft(
  next.mode === "edit"
  ? {
  name: next.role.name,
  description: next.role.description ?? "",
  permissions: [...(next.role.permissions ?? [])],
  }
  : blankDraft,
  );
  setEditor(next);
  };

  const togglePermission = (permission) => {
  setDraft((d) => ({
  ...d,
  permissions: d.permissions.includes(permission)
  ? d.permissions.filter((p) => p !== permission)
  : [...d.permissions, permission],
  }));
  };

  const save = async (e) => {
  e.preventDefault();
  setSaving(true);
  setFieldErrors({});
  setFormError(null);
  try {
  if (editor.mode === "create") {
  await createRole(projectId, {
  name: draft.name.trim(),
  description: draft.description,
  permissions: draft.permissions,
  });
  } else {
  await updateRole(projectId, editor.role._id, {
  description: draft.description,
  permissions: draft.permissions,
  });
  }
  setEditor(null);
  toast.success("Role saved");
  roles.reload();
  } catch (err) {
  if (err?.status === 422) {
  setFieldErrors(toFieldErrors(err.errors));
  setFormError(err.message);
  } else {
  setFormError(err?.message ?? "Could not save the role.");
  }
  } finally {
  setSaving(false);
  }
  };

  const removeRole = async () => {
  try {
  await deleteRole(projectId, deleteTarget._id);
  toast.success("Role deleted");
  roles.reload();
  } catch (err) {
  if (err?.status === 409) toast.error(err.message);
  throw err;
  }
  };

  const editingSystem = editor?.mode === "edit" && editor.role.isSystem;

  return (
  <>
  <PageHead
  title="Roles"
  sub="Project permissions"
  actions={
  canManage ? (
  <Button variant="ember" icon="plus" onClick={() => openEditor({ mode: "create" })}>
  New role
  </Button>
  ) : null
  }
  />
  <ProjectSettingsNav active="roles" />

  <section className="card p-[22px]" aria-label="Permission matrix">
  {roles.status === "loading" ? (
  <Skeleton variant="rows" count={6} cols={4} />
  ) : roles.status === "error" ? (
  <EmptyState tone="error" icon="shield" title="Roles could not load" text={roles.error?.message} onRetry={roles.reload} />
  ) : rows.length === 0 ? (
  <EmptyState icon="shield" title={emptyCopy("roles").title} text={emptyCopy("roles").text} />
  ) : (
  <RoleMatrix
  roles={rows}
  canManage={canManage}
  onEdit={(role) => openEditor({ mode: "edit", role })}
  onDelete={(role) => setDeleteTarget(role)}
  />
  )}
  </section>

  <SideModal
  open={Boolean(editor)}
  onClose={() => setEditor(null)}
  title={editor?.mode === "create" ? "New role" : `Edit ${editor?.role?.name ?? "role"}`}
  subtitle={editingSystem ? "System roles are read only." : "Pick what members with this role can do."}
  footer={
  <div className="flex w-full flex-wrap items-center justify-end gap-[10px]">
  {formError ? (
  <p role="alert" className="basis-full text-bad text-[13px] font-semibold">
  {formError}
  </p>
  ) : null}
  <Button variant="ghost" onClick={() => setEditor(null)} className="w760:flex-1">
  {editingSystem ? "Close" : "Cancel"}
  </Button>
  {editingSystem ? null : (
  <Button variant="ember" type="submit" form="role-editor-form" loading={saving} disabled={saving} className="w760:flex-1">
  Save role
  </Button>
  )}
  </div>
  }
  >
  <form id="role-editor-form" noValidate onSubmit={save} className="grid gap-[18px]">
  {editor?.mode === "create" ? (
  <Input
  label="Name"
  value={draft.name}
  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
  error={fieldErrors.name}
  hint="Required. Members see this name when they pick a role."
  />
  ) : (
  <p className="flex flex-wrap items-center gap-[8px] text-[14px] text-text min-w-0">
  <span className="text-muted">Name: </span>
  <span className="font-semibold truncate ">{editor?.role?.name}</span>
  {editingSystem ? <Badge tone="plain">System</Badge> : null}
  </p>
  )}
  <Input
  label="Description"
  as="textarea"
  value={draft.description}
  disabled={editingSystem}
  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
  error={fieldErrors.description}
  hint="Optional. Explain what this role is for."
  />
  <fieldset className="grid grid-cols-2 gap-x-[var(--gap)] gap-y-[4px] w1000:grid-cols-1" disabled={editingSystem}>
  <legend className="col-span-full mb-[6px] flex items-center gap-[8px] text-[13px] font-semibold text-text">
  <Icon name="shield" cls="text-muted" />
  Permissions
  </legend>
  {permissionUnion.length === 0 ? (
  <p className="col-span-full text-muted text-[13.5px]">No permissions to choose from yet.</p>
  ) : null}
  {permissionUnion.map((permission) => (
  <label key={permission} className="flex min-w-0 items-center gap-[10px] py-[6px] text-[14px] text-text">
  <input
  type="checkbox"
  className="h-[16px] w-[16px] shrink-0 accent-[color:var(--ember)]"
  checked={draft.permissions.includes(permission)}
  onChange={() => togglePermission(permission)}
  />
  <span className="truncate font-semibold" title={permission}>
  {permission}
  </span>
  </label>
  ))}
  </fieldset>
  {fieldErrors.permissions ? (
  <p role="alert" className="text-bad text-[13px] font-semibold">
  {fieldErrors.permissions}
  </p>
  ) : null}
  </form>
  </SideModal>

  <ConfirmDialog
  open={Boolean(deleteTarget)}
  onClose={() => setDeleteTarget(null)}
  title={`Delete ${deleteTarget?.name ?? "role"}?`}
  text="Members who still have this role must be moved to another role first."
  confirmLabel="Delete"
  tone="danger"
  onConfirm={removeRole}
  />
  </>
  );
}
