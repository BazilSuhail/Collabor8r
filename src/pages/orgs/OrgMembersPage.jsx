// feat(pages/orgs/OrgMembersPage): manage organization members, roles, pending invites and join requests.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import MemberList from "../../components/members/MemberList.jsx";
import MemberFormModal from "../../components/members/MemberFormModal.jsx";
import InviteList from "../../components/members/InviteList.jsx";
import JoinRequestList from "../../components/members/JoinRequestList.jsx";
import SecretRevealModal from "../../components/shared/SecretRevealModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  createOrgInvite,
  decideOrgJoin,
  listOrgInvites,
  listOrgJoinRequests,
  listOrgMembers,
  removeOrgMember,
  revokeOrgInvite,
  updateOrgMember,
} from "../../libs/api/orgs.js";
import { listOrgProjects } from "../../libs/api/projects.js";
import { paths } from "../../routes/paths.js";
import { emptyCopy } from "../../metadata/empty.js";
import { bindLift, cardRise, fadeUp, gsap, useViewEntry } from "../../utils/motion.js";
import { can } from "../../utils/permissions.js";
import { useMutation } from "../../utils/useMutation.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";

// The server answers 409 when the last owner would be demoted or removed.
const lastOwnerError = (err) => (err.status === 409 ? "An org needs at least one owner" : err.message);

const adminTabs = [
  { value: "members", label: "Members" },
  { value: "invites", label: "Invites" },
  { value: "requests", label: "Requests" },
];

function MembersTab({ orgId, role, isAdmin, selfId }) {
  const navigate = useNavigate();
  const { reload: reloadOrgs } = useOrg();
  const members = usePaged((p) => listOrgMembers(orgId, p), { orgId });
  const [removing, setRemoving] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const changeRole = useMutation((userId, next) => updateOrgMember(orgId, userId, { role: next }), {
  success: "Role updated",
  error: lastOwnerError,
  });
  const removeMember = useMutation((userId) => removeOrgMember(orgId, userId), {
  success: "Member removed",
  error: lastOwnerError,
  });
  const leaveOrg = useMutation((userId) => removeOrgMember(orgId, userId), {
  success: "You left the organization",
  error: lastOwnerError,
  });

  const onRoleChange = async (member, next) => {
  const ok = await changeRole.run(member.userId, next);
  if (ok) members.setItems((prev) => prev.map((m) => (m.userId === member.userId ? { ...m, role: next } : m)));
  };

  const confirmRemove = async () => {
  const ok = await removeMember.run(removing.userId);
  if (ok) members.setItems((prev) => prev.filter((m) => m.userId !== removing.userId));
  };

  const confirmLeave = async () => {
  const ok = await leaveOrg.run(selfId);
  if (ok) {
  reloadOrgs();
  navigate(paths.orgs());
  }
  };

  return (
  <>
  <section className="card overflow-hidden">
  <MemberList
  scope="org"
  members={members.items}
  status={members.status}
  error={members.error}
  onRetry={members.reload}
  roles={role === "owner" ? undefined : ["admin", "member", "guest", "viewer"]}
  canManage={isAdmin}
  selfId={selfId}
  onRoleChange={onRoleChange}
  onRemove={setRemoving}
  onLeave={() => setLeaving(true)}
  empty={emptyCopy("org-members")}
  hasMore={members.hasMore}
  onLoadMore={members.loadMore}
  loadingMore={members.loadingMore}
  />
  </section>

  <ConfirmDialog
  open={Boolean(removing)}
  onClose={() => setRemoving(null)}
  title="Remove member?"
  text={removing ? `${removing.userName || "This person"} loses access to this organization.` : ""}
  confirmLabel="Remove"
  tone="danger"
  onConfirm={confirmRemove}
  />

  <ConfirmDialog
  open={leaving}
  onClose={() => setLeaving(false)}
  title="Leave organization?"
  text="You lose access to this organization until an admin invites you again."
  confirmLabel="Leave"
  tone="danger"
  onConfirm={confirmLeave}
  />
  </>
  );
}

function InvitesTab({ orgId }) {
  const toast = useToast();
  const invites = useResource(() => listOrgInvites(orgId), [orgId]);
  const orgProjects = useResource(() => listOrgProjects(orgId, { limit: 100 }), [orgId]);
  const [inviting, setInviting] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const revoke = useMutation((inviteId) => revokeOrgInvite(orgId, inviteId), {
  success: "Invite revoked",
  error: (err) => err.message,
  });

  const sendInvite = async (values) => {
  const { data } = await createOrgInvite(orgId, {
  email: values.email.trim(),
  role: values.role,
  projectIds: values.projectIds?.length ? values.projectIds : undefined,
  });
  toast.success("Invite sent");
  invites.setData((prev) => [data.invite, ...(prev ?? [])]);
  setReveal(`${window.location.origin}${paths.invite(data.token)}`);
  };

  const confirmRevoke = async () => {
  const ok = await revoke.run(revoking.id);
  if (ok) {
  invites.setData((prev) => (prev ?? []).map((i) => (i.id === revoking.id ? { ...i, status: "revoked" } : i)));
  }
  };

  return (
  <>
  <section className="card overflow-hidden">
  <div className="flex flex-wrap items-center justify-between gap-[10px] px-[20px] pt-[20px] pb-[12px]">
  <h2 className="flex items-center gap-[8px] [font:600_18px_var(--display)] text-text">
  <Icon name="mail" cls="text-muted" />
  Invites
  </h2>
  <Button variant="ember" icon="mail" disabled={invites.status !== "success"} onClick={() => setInviting(true)}>
  Invite people
  </Button>
  </div>
  <InviteList
  invites={invites.data ?? []}
  status={invites.status}
  error={invites.error}
  onRetry={invites.reload}
  canManage
  onRevoke={setRevoking}
  empty={{ icon: "mail", title: "No pending invites", text: "Invites appear here until they are accepted or revoked." }}
  />
  </section>

  <MemberFormModal
  open={inviting}
  onClose={() => setInviting(false)}
  mode="invite"
  scope="org"
  projects={orgProjects.data ?? []}
  onSubmit={sendInvite}
  />

  <SecretRevealModal
  open={Boolean(reveal)}
  onClose={() => setReveal(null)}
  title="Invite link"
  description="Copy this link now. It is shown once and cannot be opened from here again."
  value={reveal ?? ""}
  label="Invite link"
  />

  <ConfirmDialog
  open={Boolean(revoking)}
  onClose={() => setRevoking(null)}
  title="Revoke invite?"
  text={revoking ? `The invite to ${revoking.email} stops working.` : ""}
  confirmLabel="Revoke"
  tone="danger"
  onConfirm={confirmRevoke}
  />
  </>
  );
}

function RequestsTab({ orgId }) {
  const toast = useToast();
  const requests = usePaged((p) => listOrgJoinRequests(orgId, p), { orgId, status: "pending" });
  const [deciding, setDeciding] = useState(null);

  const decide = async (values) => {
  const target = deciding.request;
  const body =
  values.decision === "approve"
  ? { decision: "approve", role: values.role }
  : { decision: "decline", declineReason: values.declineReason?.trim() || undefined };
  await decideOrgJoin(orgId, target.id, body);
  toast.success(values.decision === "approve" ? "Approved" : "Declined");
  requests.setItems((prev) => prev.filter((r) => r.id !== target.id));
  };

  return (
  <>
  <section className="card overflow-hidden">
  <JoinRequestList
  requests={requests.items}
  status={requests.status}
  error={requests.error}
  onRetry={requests.reload}
  canDecide
  onDecide={(request, decision) => setDeciding({ request, decision })}
  empty={{ icon: "userCheck", title: "No pending requests", text: "People who ask to join appear here." }}
  />
  </section>

  <MemberFormModal
  open={Boolean(deciding)}
  onClose={() => setDeciding(null)}
  mode="decide"
  scope="org"
  decision={deciding?.decision}
  onSubmit={decide}
  />
  </>
  );
}

export default function OrgMembersPage() {
  const { orgId } = useParams();
  const { orgs, status: orgStatus } = useOrg();
  const { user } = useAuth();
  const [tab, setTab] = useState("members");

  const org = orgs.find((o) => o.id === orgId) ?? null;
  const role = org?.role ?? null;
  const isAdmin = can(role, "org.admin", "org");
  const canList = can(role, "org.members.view", "org");
  const ready = orgStatus === "success";
  const current = isAdmin ? tab : "members";

  useViewEntry(
 "org-members",
  ({ q, root }) => {
  if (!ready) return undefined;
  const tl = gsap.timeline();
  tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
  tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
  return bindLift(root);
  },
  [ready],
  );

  return (
  <>
  <PageHead
  title="Members"
  sub={org ? `People and access in ${org.name}.` : "People and access in this organization."}
  back={{ to: paths.orgs(), label: "Organizations" }}
  />

  {!ready ? (
  <section className="card p-[24px]">
  <Skeleton variant="feed" count={6} />
  </section>
  ) : null}

  {ready && !canList ? (
  <section className="card p-[20px] grid gap-[16px] justify-items-center">
  <Illustration name="team" alt="" className="w-[180px] w1000:hidden" />
  <EmptyState
  icon="lock"
  title="Only organization members can see the member list"
  text="Ask an organization admin to add you."
  />
  </section>
  ) : null}

  {ready && canList ? (
  <div className="grid gap-[var(--gap)] ">
  {isAdmin ? (
  <SegmentedControl
  as="tabs"
  label="Member sections"
  value={current}
  onChange={setTab}
  options={adminTabs}
  />
  ) : null}
  {current === "members" ? (
  <MembersTab orgId={orgId} role={role} isAdmin={isAdmin} selfId={user?.id ?? null} />
  ) : null}
  {current === "invites" ? <InvitesTab orgId={orgId} /> : null}
  {current === "requests" ? <RequestsTab orgId={orgId} /> : null}
  </div>
  ) : null}
  </>
  );
}
