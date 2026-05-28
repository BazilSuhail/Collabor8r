import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dropdown from "../ui/Dropdown.jsx";
import { Icon } from "../ui/Icon.jsx";
import { SWITCH_CLASS } from "./OrgSwitcher.jsx";
import { listOrgProjects, listPersonalProjects } from "../../libs/api/projects.js";
import { paths } from "../../routes/paths.js";

// Project switcher for the sidebar. The list loads the first time the menu opens, per org key.
const pid = (p) => String(p.id ?? p._id);

export default function ProjectSwitcher({ project, orgId, personal = false }) {
  const navigate = useNavigate();
  const [cache, setCache] = useState({ key: null, items: null });
  const key = personal ? "personal" : (orgId ?? "none");

  const load = (open) => {
    if (!open || cache.key === key) return;
    const request = personal || !orgId ? listPersonalProjects() : listOrgProjects(orgId, { limit: 100 });
    setCache({ key, items: null });
    request
      .then((res) => setCache({ key, items: res.data ?? [] }))
      .catch(() => setCache({ key, items: [] }));
  };

  const projects = cache.key === key ? cache.items : null;
  const items = [];
  if (projects === null) {
    items.push({ id: "loading", label: "Loading projects", disabled: true });
  } else if (projects.length === 0) {
    items.push({ id: "none", label: "No projects yet", disabled: true });
  } else {
    projects.forEach((p) =>
      items.push({ id: pid(p), label: p.name, icon: "project", onSelect: () => navigate(paths.project(pid(p))) }),
    );
  }
  items.push("separator");
  items.push({ id: "all", label: "All projects", icon: "folder", onSelect: () => navigate(paths.projects()) });

  return (
    <Dropdown
      label="Project"
      items={items}
      onOpenChange={load}
      trigger={(p) => (
        <button
          type="button"
          ref={p.ref}
          id={p.id}
          onClick={p.onClick}
          onKeyDown={p.onKeyDown}
          aria-haspopup={p["aria-haspopup"]}
          aria-expanded={p["aria-expanded"]}
          aria-controls={p["aria-controls"]}
          className={SWITCH_CLASS}
        >
          <Icon name="project" cls="flex-none" />
          <span className="side__label min-w-0 flex-1 truncate">{project?.name ?? "Choose a project"}</span>
          <Icon name="upDown" cls="side__label flex-none w-[14px] h-[14px] text-side-muted" />
        </button>
      )}
    />
  );
}
