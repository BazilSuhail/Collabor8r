// feat(pages/settings/SettingsLayout): two-column settings shell with a section sidebar beside the active section.
import { Outlet } from "react-router-dom";
import SettingsNav from "./components/SettingsNav.jsx";

export default function SettingsLayout() {
  return (
    <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-[var(--gap)] w1000:grid-cols-[200px_minmax(0,1fr)] w760:grid-cols-[minmax(0,1fr)]">
      <SettingsNav />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
