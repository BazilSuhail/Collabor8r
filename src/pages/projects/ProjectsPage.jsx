// feat(pages/projects/ProjectsPage): list organization and personal projects and create new ones.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import ProjectFormModal from "../../components/projects/ProjectFormModal.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { createOrgProject, createPersonalProject, listOrgProjects, listPersonalProjects } from "../../libs/api/projects.js";
import { paths } from "../../routes/paths.js";
import { emptyCopy } from "../../metadata/empty.js";
import { bindLift, cardRise, fadeUp, gsap, useViewEntry } from "../../utils/motion.js";
import { can } from "../../utils/permissions.js";
import { usePaged } from "../../utils/usePaged.js";
import { useResource } from "../../utils/useResource.js";

const SCOPES = [
  { value: "org", label: "Organization" },
  { value: "personal", label: "Personal" },
];

const VISIBILITY_LABEL = { private: "Private", request: "Request to join", open: "Open" };
const noRows = () => Promise.resolve({ data: [], meta: null });
const pid = (p) => String(p.id ?? p._id);

function ProjectCard({ project }) {
  return (
    <Link
      to={paths.project(pid(project))}
      data-lift
      className="card flex flex-col gap-[12px] p-[20px] no-underline text-text"
    >
      <div className="flex items-start justify-between gap-[10px]">
        <Badge tone="plain">{project.key}</Badge>
        <Badge tone="plain">{VISIBILITY_LABEL[project.visibility] ?? project.visibility}</Badge>
      </div>
      <h2 className="truncate [font:700_17px_var(--display)] tracking-[-0.01em] text-text">{project.name}</h2>
      {project.description ? (
        <p className="line-clamp-2 text-[13.5px] text-muted">{project.description}</p>
      ) : null}
      <div className="mt-auto flex items-center gap-[8px] pt-[4px] text-[12.5px] text-muted">
        {project.leadName ? (
          <>
            <Avatar name={project.leadName} src={project.leadAvatar} size="xs" />
            <span className="truncate">Lead: {project.leadName}</span>
          </>
        ) : (
          <span>No lead set</span>
        )}
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { orgId, org, status: orgStatus, orgs } = useOrg();
  const [scope, setScope] = useState("org");
  const [creating, setCreating] = useState(false);

  const orgRole = orgs.find((o) => o.id === orgId)?.role ?? org?.role ?? null;
  const canCreateInOrg = Boolean(orgId) && can(orgRole, "project.create", "org");

  const orgProjects = usePaged(
    (p) => (orgId ? listOrgProjects(orgId, p) : noRows()),
    { orgId },
  );
  const personal = useResource(() => listPersonalProjects(), []);

  const active = scope === "org" ? orgProjects : { status: personal.status, error: personal.error, reload: personal.reload, items: personal.data ?? [], hasMore: false, loadMore: () => {}, loadingMore: false };
  const listStatus = scope === "org" && orgStatus !== "success" ? "loading" : active.status;
  const ready = listStatus === "success" && (scope === "personal" || Boolean(orgId));

  useViewEntry(
    "projects",
    ({ q, root }) => {
      if (!ready) return undefined;
      const tl = gsap.timeline();
      tl.add(fadeUp(q(".head__sub"), { y: 8 }), 0.12);
      tl.add(cardRise(q(".card"), { y: 26, stagger: 0.07 }), 0.14);
      return bindLift(root);
    },
    [ready, scope],
  );

  const createProject = async (values) => {
    const body = {
      name: values.name.trim(),
      key: values.key.trim(),
      description: values.description.trim() || undefined,
      visibility: values.visibility,
      themeKey: values.themeKey ?? null,
    };
    if (!values.personal && !orgId) throw new Error("Pick an organization before creating a project in it.");
    const { data: project } = values.personal ? await createPersonalProject(body) : await createOrgProject(orgId, body);
    toast.success("Project created");
    navigate(paths.board(pid(project)));
  };

  const orgEmpty = scope === "org" && !orgId && orgStatus === "success";

  return (
    <>
      <PageHead
        title="Projects"
        sub="Organization and personal projects you can open."
        actions={
          scope === "org" && !canCreateInOrg ? null : (
            <Button variant="ember" icon="plus" onClick={() => setCreating(true)}>
              New project
            </Button>
          )
        }
      />

      <div className="mb-[var(--gap)]">
        <SegmentedControl as="buttons" label="Project scope" value={scope} onChange={setScope} options={SCOPES} />
      </div>

      {orgEmpty ? (
        <section className="card p-[20px]">
          <EmptyState
            icon="building"
            title="Pick an organization"
            text="Organization projects belong to an organization."
            action={
              <Button as={Link} to={paths.orgs()} variant="soft">
                Go to organizations
              </Button>
            }
          />
        </section>
      ) : null}

      {!orgEmpty && listStatus === "loading" ? (
        <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)]">
          <Skeleton variant="cards" count={3} cols={3} />
        </div>
      ) : null}

      {!orgEmpty && listStatus === "error" ? (
        <section className="card p-[20px]">
          <EmptyState
            tone="error"
            icon="alert"
            title="Could not load projects"
            text={active.error?.message}
            onRetry={active.reload}
          />
        </section>
      ) : null}

      {!orgEmpty && listStatus === "success" && active.items.length === 0 ? (
        <section className="card p-[20px]">
          <div className="grid justify-items-center gap-[12px]">
            <Illustration name="empty" alt="" className="w-[180px] w1000:hidden" />
          </div>
          <EmptyState
            icon={emptyCopy("projects").icon}
            title={emptyCopy("projects").title}
            text={emptyCopy("projects").text}
            action={
              scope === "personal" || canCreateInOrg ? (
                <Button variant="ember" icon="plus" onClick={() => setCreating(true)}>
                  New project
                </Button>
              ) : null
            }
          />
        </section>
      ) : null}

      {!orgEmpty && listStatus === "success" && active.items.length > 0 ? (
        <>
          <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)]">
            {active.items.map((project) => (
              <ProjectCard key={pid(project)} project={project} />
            ))}
          </div>
          {active.hasMore ? (
            <div className="mt-[var(--gap)] flex justify-center">
              <Button variant="soft" size="sm" loading={active.loadingMore} onClick={active.loadMore}>
                Show more
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        allowPersonal
        onSubmit={createProject}
      />
    </>
  );
}
