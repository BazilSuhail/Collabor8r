// feat(pages/orgs/OrgsPage): list the user's organizations, create a new one, or ask to join an existing one.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Dropdown from "../../components/ui/Dropdown.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import OrgFormModal from "../../components/orgs/OrgFormModal.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { createOrg, requestOrgJoin } from "../../libs/api/orgs.js";
import { paths } from "../../routes/paths.js";
import { emptyCopy } from "../../metadata/empty.js";
import { gsap, bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { can } from "../../utils/permissions.js";
import { useMutation } from "../../utils/useMutation.js";

export default function OrgsPage() {
  const { orgs, orgId, status, error, reload, setOrgId } = useOrg();
  const toast = useToast();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinTarget, setJoinTarget] = useState("");
  const ready = status === "success";

  const join = useMutation((target) => requestOrgJoin(target, {}), {
    success: "Request sent",
    error: (err) => err.message,
  });

  useViewEntry(
    "orgs",
    ({ q, root }) => {
      if (!ready) return undefined;
      const tl = gsap.timeline();
      tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
      tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
      return bindLift(root);
    },
    [ready],
  );

  const createSubmit = async (values) => {
    const { data: org } = await createOrg({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    });
    toast.success("Organization created");
    setOrgId(org.id);
    reload();
  };

  const submitJoin = async (e) => {
    e.preventDefault();
    const target = joinTarget.trim();
    if (!target) return;
    const sent = await join.run(target);
    if (sent) setJoinTarget("");
  };

  const openOrg = (id) => {
    setOrgId(id);
    navigate(paths.projects());
  };

  return (
    <>
      <PageHead
        title="Organizations"
        sub="Switch between organizations, create one, or ask to join an existing one."
        actions={
          <Button variant="ember" icon="plus" onClick={() => setCreating(true)}>
            New organization
          </Button>
        }
      />

      {status === "loading" ? (
        <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)]">
          <Skeleton variant="cards" count={3} cols={3} />
        </div>
      ) : null}

      {status === "error" ? (
        <section className="card p-[20px]">
          <EmptyState
            tone="error"
            icon="alert"
            title="Could not load organizations"
            text={error?.message}
            onRetry={reload}
          />
        </section>
      ) : null}

      {ready && orgs.length === 0 ? (
        <section className="card p-[20px]">
          <div className="grid justify-items-center gap-[12px]">
            <Illustration name="team" alt="" className="w-[180px] w1000:hidden" />
          </div>
          <EmptyState
            icon={emptyCopy("orgs").icon}
            title={emptyCopy("orgs").title}
            text={emptyCopy("orgs").text}
            action={
              <Button variant="ember" icon="plus" onClick={() => setCreating(true)}>
                New organization
              </Button>
            }
          />
        </section>
      ) : null}

      {ready && orgs.length > 0 ? (
        <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)]">
          {orgs.map((org) => {
            const current = org.id === orgId;
            const isAdmin = can(org.role, "org.admin", "org");
            const canSeeMembers = can(org.role, "org.members.view", "org");
            const items = [
              { id: "open", label: current ? "Current organization" : "Make current", icon: "check", onSelect: () => setOrgId(org.id), disabled: current },
              { id: "projects", label: "Projects", icon: "project", href: paths.projects() },
              ...(canSeeMembers ? [{ id: "members", label: "Members", icon: "users", href: paths.orgMembers(org.id) }] : []),
              ...(isAdmin ? [{ id: "settings", label: "Settings", icon: "settings", href: paths.orgSettings(org.id) }] : []),
              ...(isAdmin ? [{ id: "audit", label: "Audit log", icon: "audit", href: paths.orgAudit(org.id) }] : []),
            ];
            return (
              <article key={org.id} data-lift className="card flex flex-col gap-[14px] p-[20px]">
                <div className="flex items-start gap-[12px]">
                  <Avatar name={org.name} src={org.logoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate [font:700_17px_var(--display)] tracking-[-0.01em] text-text">{org.name}</h2>
                    <p className="truncate text-[12.5px] text-muted">{org.slug}</p>
                  </div>
                  <Dropdown
                    label={`Actions for ${org.name}`}
                    items={items}
                    trigger={(p) => (
                      <Button iconOnly variant="ghost" size="sm" icon="more" aria-label={`Actions for ${org.name}`} {...p} />
                    )}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-[8px]">
                  {current ? <Badge tone="spruce">Current</Badge> : null}
                  <Badge tone="plain">{org.role}</Badge>
                </div>
                <div className="mt-auto flex justify-end">
                  <Button variant="soft" size="sm" onClick={() => openOrg(org.id)}>
                    Open
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <section className="card mt-[var(--gap)] grid gap-[12px] p-[20px]">
        <form onSubmit={submitJoin} className="grid gap-[12px] w560:grid-cols-[minmax(0,1fr)]">
          <div className="flex flex-wrap items-end gap-[10px]">
            <div className="min-w-[220px] flex-1">
              <Input
                label="Request to join an organization"
                hint="Enter the organization's id or slug."
                value={joinTarget}
                onChange={(e) => setJoinTarget(e.target.value)}
              />
            </div>
            <Button type="submit" variant="soft" loading={join.pending} disabled={!joinTarget.trim() || join.pending}>
              Request to join
            </Button>
          </div>
        </form>
      </section>

      <OrgFormModal open={creating} onClose={() => setCreating(false)} onSubmit={createSubmit} />
    </>
  );
}
