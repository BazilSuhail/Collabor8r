import { Link } from "react-router-dom";
import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import ActivityList from "./ActivityList.jsx";
import { listActivity } from "../../libs/api/projects.js";
import { useResource } from "../../utils/useResource.js";
import { paths } from "../../routes/paths.js";

const EMPTY = { data: [], meta: null };

// Opened from the Header activity button (small screens). Shows the current project's feed.
export default function ActivityDrawer({ open, onClose, pid }) {
  const list = useResource(
    () => (open && pid ? listActivity(pid, { limit: 30 }) : Promise.resolve(EMPTY)),
    [open, pid],
  );
  const items = list.data ?? [];

  let body;
  if (!pid) {
    body = (
      <EmptyState
        icon="project"
        title="Pick a project"
        text="Activity is shown per project."
        action={
          <Button as={Link} to={paths.projects()} variant="soft" size="sm" onClick={onClose}>
            Open projects
          </Button>
        }
      />
    );
  } else if (list.status === "loading") {
    body = (
      <div aria-busy="true">
        <Skeleton variant="feed" count={5} />
      </div>
    );
  } else if (list.status === "error") {
    body = <EmptyState tone="error" title="Could not load activity" onRetry={list.reload} />;
  } else if (items.length === 0) {
    body = <EmptyState icon="history" title="No activity yet" text="Changes in this project will show up here." />;
  } else {
    body = <ActivityList items={items} />;
  }

  return (
    <SideModal open={open} onClose={onClose} title="Recent activity" subtitle="What changed in this project">
      {body}
    </SideModal>
  );
}
