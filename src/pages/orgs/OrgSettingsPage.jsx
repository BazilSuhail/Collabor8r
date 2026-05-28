// feat(pages/orgs/OrgSettingsPage): let org admins rename the organization, manage groups and archive it.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import GroupFormModal from "../../components/orgs/GroupFormModal.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { archiveOrg, createGroup, deleteGroup, getOrg, listGroups, updateGroup, updateOrg } from "../../libs/api/orgs.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, gsap, useViewEntry } from "../../utils/motion.js";
import { can } from "../../utils/permissions.js";
import { useMutation } from "../../utils/useMutation.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";

const TABS = [
  { value: "general", label: "General" },
  { value: "groups", label: "Groups" },
];

export default function OrgSettingsPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { reload: reloadOrgs } = useOrg();

  const detail = useResource(() => getOrg(orgId), [orgId]);
  const org = detail.data;
  const isAdmin = can(org?.role ?? null, "org.admin", "org");
  const isOwner = can(org?.role ?? null, "org.delete", "org");
  const ready = detail.status === "success" && isAdmin;

  const [tab, setTab] = useState("general");
  const [form, setForm] = useState({ name: "", description: "" });
  const [groupModal, setGroupModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
  if (org) setForm({ name: org.name ?? "", description: org.description ?? "" });
  }, [org]);

  const groups = usePaged((p) => listGroups(orgId, p), { orgId });

  const save = useMutation((body) => updateOrg(orgId, body), { success: "Saved", error: (e) => e.message });
  const removeGroup = useMutation((id) => deleteGroup(orgId, id), { success: "Group deleted", error: (e) => e.message });
  const archive = useMutation(() => archiveOrg(orgId), { success: "Organization archived", error: (e) => e.message });

  useViewEntry(
 "org-settings",
  ({ q, root }) => {
  if (!ready) return undefined;
  const tl = gsap.timeline();
  tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
  tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
  return bindLift(root);
  },
  [ready],
  );

  const dirty = Boolean(org) && (form.name !== (org.name ?? "") || form.description !== (org.description ?? ""));

  const onSave = async (e) => {
  e.preventDefault();
  const res = await save.run({ name: form.name.trim(), description: form.description.trim() });
  if (res) {
  detail.reload();
  reloadOrgs();
  }
  };

  const saveGroup = async (values) => {
  const body = { name: values.name.trim(), description: values.description.trim() };
  if (groupModal?.group) await updateGroup(orgId, groupModal.group.id, body);
  else await createGroup(orgId, body);
  toast.success("Group saved");
  groups.reload();
  };

  const confirmRemoveGroup = async () => {
  const ok = await removeGroup.run(removing.id);
  if (ok) groups.reload();
  };

  const confirmArchive = async () => {
  const ok = await archive.run();
  if (ok) {
  reloadOrgs();
  navigate(paths.orgs());
  }
  };

  const groupColumns = [
  {
  key: "name",
  label: "Group",
  render: (g) => (
  <div className="min-w-0">
  <div className="truncate font-semibold text-text">{g.name}</div>
  {g.description ? <div className="truncate text-[12.5px] text-muted">{g.description}</div> : null}
  </div>
  ),
  },
  {
  key: "members",
  label: "Members",
  width: "140px",
  render: (g) => <span className="tabular-nums text-muted">{g.memberCount ?? g.memberIds?.length ?? 0}</span>,
  },
  ];

  const groupMenu = (g) => [
  { id: "edit", label: "Edit", icon: "edit", onSelect: () => setGroupModal({ group: g }) },
  { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setRemoving(g) },
  ];

  const forbidden = detail.status === "error" && detail.error?.status === 403;
  const notAdmin = detail.status === "success" && !isAdmin;

  return (
  <>
  <PageHead title="Organization settings" sub={org?.name ?? "Loading organization"} back={{ to: paths.orgs(), label: "Organizations" }} />

  {detail.status === "loading" ? (
  <section className="card p-[24px]">
  <Skeleton variant="feed" count={3} />
  </section>
  ) : null}

  {detail.status === "error" && !forbidden ? (
  <section className="card p-[24px]">
  <EmptyState
  tone="error"
  icon="alert"
  title="Could not load the organization"
  text={detail.error?.message}
  onRetry={detail.reload}
  />
  </section>
  ) : null}

  {forbidden || notAdmin ? (
  <section className="card p-[24px]">
  <EmptyState
  icon="lock"
  title="Only admins can change organization settings"
  text="Ask an organization admin if you need a change."
  />
  </section>
  ) : null}

  {ready ? (
  <div className="grid gap-[var(--gap)] ">
  <SegmentedControl
  as="tabs"
  label="Organization settings sections"
  value={tab}
  onChange={setTab}
  options={TABS}
  />

  {tab === "general" ? (
  <section className="card p-[20px]">
  <h2 className="mb-[14px] flex items-center gap-[8px] [font:600_18px_var(--display)] text-text">
  <Icon name="edit" cls="text-muted" />
  Details
  {dirty ? <Badge tone="saffron">Unsaved changes</Badge> : null}
  </h2>
  <form onSubmit={onSave} className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Input
  label="Name"
  value={form.name}
  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
  error={save.fieldErrors.name}
  hint="Shown to every member."
  />
  <Input
  as="textarea"
  label="Description"
  className="col-span-full"
  value={form.description}
  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
  error={save.fieldErrors.description}
  hint="Optional. A short summary of what the organization does."
  />
  <div className="col-span-full flex flex-wrap items-center justify-end gap-[10px]">
  <Button
  variant="ghost"
  disabled={!dirty || save.pending}
  onClick={() => setForm({ name: org.name ?? "", description: org.description ?? "" })}
  >
  Reset
  </Button>
  <Button type="submit" variant="ember" loading={save.pending} disabled={!dirty || save.pending}>
  Save
  </Button>
  </div>
  </form>
  </section>
  ) : (
  <section className="card overflow-hidden">
  <div className="flex flex-wrap items-center justify-between gap-[10px] px-[24px] pt-[20px] pb-[12px]">
  <h2 className="flex items-center gap-[8px] [font:600_18px_var(--display)] text-text">
  <Icon name="users" cls="text-muted" />
  Groups
  </h2>
  <Button variant="ember" icon="plus" onClick={() => setGroupModal({ group: null })}>
  New group
  </Button>
  </div>
  <DataTable
  label="Groups"
  columns={groupColumns}
  rows={groups.items.map((g) => ({ ...g, id: String(g.id ?? g._id) }))}
  rowKey="id"
  status={groups.status}
  error={groups.error}
  onRetry={groups.reload}
  empty={{ icon: "users", title: "No groups yet", text: "Groups collect members so you can manage them together." }}
  rowMenu={groupMenu}
  hasMore={groups.hasMore}
  onLoadMore={groups.loadMore}
  loadingMore={groups.loadingMore}
  />
  </section>
  )}

  {isOwner ? (
  <section className="card border-bad p-[20px]">
  <h2 className="flex items-center gap-[8px] [font:600_18px_var(--display)] text-text">
  <Icon name="archive" cls="text-bad" />
  Archive organization
  </h2>
  <p className="mt-[6px] text-[13.5px] text-muted">
  Archiving removes this organization from everyone's list.
  </p>
  <div className="mt-[16px] flex justify-end">
  <Button variant="danger" onClick={() => setArchiving(true)}>
  Archive organization
  </Button>
  </div>
  </section>
  ) : null}
  </div>
  ) : null}

  <GroupFormModal
  open={Boolean(groupModal)}
  onClose={() => setGroupModal(null)}
  group={groupModal?.group ?? null}
  onSubmit={saveGroup}
  />

  <ConfirmDialog
  open={Boolean(removing)}
  onClose={() => setRemoving(null)}
  title="Delete group?"
  text={removing ? `${removing.name} is removed. Its members stay in the organization.` : ""}
  confirmLabel="Delete"
  tone="danger"
  onConfirm={confirmRemoveGroup}
  />

  <ConfirmDialog
  open={archiving}
  onClose={() => setArchiving(false)}
  title="Archive organization?"
  text="This removes the organization from every member's list."
  confirmLabel="Archive"
  tone="danger"
  onConfirm={confirmArchive}
  />
  </>
  );
}
