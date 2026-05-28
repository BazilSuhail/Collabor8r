// feat(pages/orgs/OrgAuditPage): let org admins review and filter the organization audit log.
import { useState } from "react";
import { useParams } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import AuditTable from "../../components/audit/AuditTable.jsx";
import AuditDetailDrawer from "../../components/audit/AuditDetailDrawer.jsx";
import PeoplePicker from "../../components/members/PeoplePicker.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { listOrgAudit } from "../../libs/api/orgs.js";
import { paths } from "../../routes/paths.js";
import { emptyCopy } from "../../metadata/empty.js";
import { bindLift, cardRise, fadeUp, gsap, useViewEntry } from "../../utils/motion.js";
import { can } from "../../utils/permissions.js";
import { usePaged } from "../../utils/usePaged.js";

// Action names the org services write to the audit log.
const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "org.updated", label: "Organization updated" },
  { value: "org.deleted", label: "Organization archived" },
  { value: "member.added", label: "Member added" },
  { value: "member.removed", label: "Member removed" },
  { value: "role.changed", label: "Role changed" },
];

export default function OrgAuditPage() {
  const { orgId } = useParams();
  const { orgs, status: orgStatus } = useOrg();
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState(null);
  const [selected, setSelected] = useState(null);

  const role = orgs.find((o) => o.id === orgId)?.role ?? null;
  const isAdmin = can(role, "org.admin", "org");
  const ready = orgStatus === "success";

  const entries = usePaged((p) => listOrgAudit(orgId, p), {
    orgId,
    action: action || undefined,
    actorId: actorId || undefined,
  });

  useViewEntry(
    "org-audit",
    ({ q, root }) => {
      if (!ready) return undefined;
      const tl = gsap.timeline();
      tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
      tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
      return bindLift(root);
    },
    [ready],
  );

  const forbidden = entries.status === "error" && entries.error?.status === 403;

  return (
    <>
      <PageHead
        title="Audit log"
        sub="Changes to this organization, newest first."
        back={{ to: paths.orgs(), label: "Organizations" }}
      />

      {!ready ? (
        <section className="card p-[20px]">
          <Skeleton variant="feed" count={6} />
        </section>
      ) : null}

      {ready && !isAdmin ? (
        <section className="card p-[20px] grid gap-[16px] justify-items-center">
          <Illustration name="security" alt="" className="w-[180px] w1000:hidden" />
          <EmptyState icon="lock" title="Only admins can review the audit log" text="Ask an organization admin for a copy of an entry." />
        </section>
      ) : null}

      {ready && isAdmin ? (
        <div className="grid gap-[var(--gap)]">
          <div className="toolbar grid gap-[10px] w760:grid-cols-[minmax(0,1fr)]">
            <Select
              label="Action"
              hideLabel
              value={action}
              onChange={setAction}
              options={ACTION_OPTIONS}
              className="min-w-[200px]"
            />
            <PeoplePicker
              label="Actor"
              hideLabel
              placeholder="Any actor"
              value={actorId}
              onChange={setActorId}
              className="min-w-[220px]"
            />
          </div>

          {forbidden ? (
            <section className="card p-[24px]">
              <EmptyState icon="lock" title="Only admins can review the audit log" />
            </section>
          ) : (
            <section className="card overflow-hidden">
              <AuditTable
                entries={entries.items}
                status={entries.status}
                error={entries.error}
                onRetry={entries.reload}
                hasMore={entries.hasMore}
                onLoadMore={entries.loadMore}
                loadingMore={entries.loadingMore}
                onRowClick={setSelected}
                empty={emptyCopy("org-audit")}
              />
            </section>
          )}
        </div>
      ) : null}

      <AuditDetailDrawer open={Boolean(selected)} onClose={() => setSelected(null)} entry={selected} />
    </>
  );
}
