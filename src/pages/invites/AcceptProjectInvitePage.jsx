// feat(pages/invites/AcceptProjectInvitePage): let a signed-in user accept a project invite and open that project.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptProjectInvite } from "../../libs/api/projects.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useViewEntry, fadeUp, scaled } from "../../utils/motion.js";
import { paths } from "../../routes/paths.js";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

export default function AcceptProjectInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useViewEntry(
    "project-invite",
    ({ q }) => {
      fadeUp(q("[data-enter]"), { y: 14, stagger: 0.06, delay: scaled(0.05) });
    },
    [],
  );

  const accept = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await acceptProjectInvite(token);
      const project = res.data;
      toast.success(project?.name ? `Joined ${project.name}` : "Joined the project");
      navigate(paths.project(project.projectId), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="card mx-auto w-[min(440px,100%)] p-[28px] grid gap-[18px]" data-enter>
      <div className="flex items-center gap-[14px]">
        <span className="grid place-items-center size-[44px] flex-none rounded-[14px] bg-[color:var(--iris-soft)] text-[color:var(--iris-t)]">
          <Icon name="project" />
        </span>
        <div>
          <h1 className="[font:600_20px_var(--display)] tracking-[-0.015em] text-text">Project invite</h1>
          <p className="text-muted text-[14px]">Accept to join this project and open it.</p>
        </div>
      </div>

      {error ? (
        <EmptyState
          tone="error"
          icon="alert"
          title="This invite can't be accepted"
          text={error.message || "The invite may have expired or already been used."}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-[10px]">
        <Button variant="ghost" onClick={() => navigate(paths.projects(), { replace: true })}>
          Not now
        </Button>
        <Button variant="ember" loading={pending} onClick={accept}>
          Accept invite
        </Button>
      </div>
    </section>
  );
}
