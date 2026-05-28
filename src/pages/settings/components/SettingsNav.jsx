// feat(pages/settings/components/SettingsNav): settings sidebar that switches sections by route, becoming a horizontal tab strip on narrow screens.
import { NavLink } from "react-router-dom";
import { paths } from "../../../routes/paths.js";
import { Icon } from "../../../components/ui/Icon.jsx";
import { cn } from "../../../utils/cn.js";
import Button from "../../../components/ui/Button.jsx";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "user", to: paths.settingsProfile() },
  { id: "notifications", label: "Notifications", icon: "bell", to: paths.settingsNotifications() },
  { id: "security", label: "Security", icon: "lock", to: paths.settingsSecurity() },
  { id: "appearance", label: "Appearance", icon: "sun", to: paths.settingsAppearance() },
];

const LINK =
  "relative flex items-center gap-[12px] h-[44px] px-[14px] text-muted whitespace-nowrap text-[13.5px] font-bold rounded-[12px] hover:text-text focus-visible:outline-offset-[-2px] w760:rounded-[999px] w760:px-[14px]";
const ACTIVE =
  "bg-(--ember-soft) text-(--ember-t) before:content-[''] before:absolute before:left-0 before:top-[8px] before:bottom-[8px] before:w-[3px] before:rounded-[3px] before:bg-ember w760:before:hidden";

export default function SettingsNav() {
  return (
    <nav
      className="card sticky top-[84px] p-[10px] w760:relative w760:top-0 w760:p-[6px] w760:overflow-x-auto w760:[scrollbar-width:none] w760:[&::-webkit-scrollbar]:hidden"
      aria-label="Settings sections"
    >
      <ul className="flex flex-col gap-[2px] w760:flex-row w760:w-max">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <NavLink to={s.to} className={({ isActive }) => cn(LINK, isActive && ACTIVE)}>
              <Icon name={s.icon} />
              <span>{s.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Footer for a settings form. Render it inside the <form>. Save stays disabled until the form is dirty.
export function SettingsFoot({ dirty, pending = false, onDiscard, saveLabel = "Save changes" }) {
  return (
    <footer className="mt-[22px] flex flex-wrap items-center justify-end gap-[10px] pt-[16px] border-t border-line">
      <span aria-live="polite" className="mr-auto inline-flex items-center gap-[8px] text-muted text-[13px] font-semibold">
        {dirty ? (
          <>
            <span aria-hidden="true" className="size-[8px] rounded-[50%] bg-saffron" />
            Unsaved changes
          </>
        ) : null}
      </span>
      <Button variant="ghost" onClick={onDiscard} disabled={!dirty || pending} className="w760:flex-1">
        Discard
      </Button>
      <Button type="submit" variant="ember" loading={pending} disabled={!dirty} className="w760:flex-1">
        {saveLabel}
      </Button>
    </footer>
  );
}
