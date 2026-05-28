import { useNavigate } from "react-router-dom";
import Dropdown from "../ui/Dropdown.jsx";
import { Icon } from "../ui/Icon.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { paths } from "../../routes/paths.js";

export const SWITCH_CLASS =
  "flex items-center gap-[10px] w-full min-h-[38px] px-[10px] rounded-[12px] border border-[var(--side-line)] text-left text-[13px] font-semibold text-side-text hover:bg-[color:var(--side-pill)] focus-visible:outline-side-text pointer-coarse:min-h-[44px]";

// Organization switcher for the sidebar. personal=true when the open project has no org.
export default function OrgSwitcher({ personal = false }) {
  const { orgs, org, setOrgId } = useOrg();
  const navigate = useNavigate();
  const label = personal ? "Personal" : (org?.name ?? "Choose organization");
  const items = [
    ...orgs.map((o) => ({
      id: o.id,
      label: o.name,
      icon: "building",
      onSelect: () => setOrgId(o.id),
    })),
    ...(orgs.length ? ["separator"] : []),
    { id: "manage", label: "Manage organizations", icon: "gear", onSelect: () => navigate(paths.orgs()) },
  ];
  return (
    <Dropdown
      label="Organization"
      items={items}
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
          <Icon name="building" cls="flex-none" />
          <span className="side__label min-w-0 flex-1 truncate">{label}</span>
          <Icon name="upDown" cls="side__label flex-none w-[14px] h-[14px] text-side-muted" />
        </button>
      )}
    />
  );
}
