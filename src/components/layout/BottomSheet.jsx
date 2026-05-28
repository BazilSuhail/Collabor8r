import { useEffect, useLayoutEffect, useRef } from "react";
import { paths } from "../../routes/paths.js";
import { gsap, prefersReduced } from "../../utils/motion.js";
import { BrandMark, Icon } from "../ui/Icon.jsx";
import { AccountMenu, SideGoal, SideNav } from "./Sidebar.jsx";

// Navigation sheet for small screens, opened from the tab bar "More" button.
export default function BottomSheet({ open, onClose, pathname, pid, role, badges, goal, user, theme, openSearch, onSignOut }) {
  const sheetRef = useRef(null);
  const scrimRef = useRef(null);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!sheet || !scrim) return;
    if (!mounted.current || prefersReduced()) {
      mounted.current = true;
      gsap.set(sheet, { yPercent: open ? 0 : 100 });
      gsap.set(scrim, { opacity: open ? 1 : 0 });
      return;
    }
    gsap.to(
      sheet,
      open ? { yPercent: 0, duration: 0.45, ease: "power3.out" } : { yPercent: 100, duration: 0.3, ease: "power2.in" },
    );
    gsap.to(scrim, { opacity: open ? 1 : 0, duration: open ? 0.45 : 0.3 });
  }, [open]);

  // Escape reaches here only when no modal handled it (the modal engine stops the event first).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        ref={scrimRef}
        className={`fixed inset-0 z-[59] bg-[#14100c66] [-webkit-backdrop-filter:blur(4px)] [backdrop-filter:blur(4px)] opacity-0 ${open ? "" : "pointer-events-none"}`}
        onClick={onClose}
        inert={!open}
        aria-hidden="true"
      />
      <aside
        className={`side fixed inset-x-0 bottom-0 z-[60] flex max-h-[88dvh] flex-col gap-[14px] overflow-hidden rounded-t-[24px] bg-side-bg text-side-text pt-[10px] px-[14px] pb-[max(14px,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_-20px_#00000080] ${open ? "" : "pointer-events-none"}`}
        id="side"
        aria-label="Sidebar"
        ref={sheetRef}
        inert={!open}
      >
        <span className="mx-auto h-[4px] w-[40px] flex-none rounded-[2px] bg-[#ffffff33]" aria-hidden="true" />
        <div className="side__top flex items-center justify-between gap-[8px] min-h-[44px] pt-0 pr-[2px] pb-0 pl-[6px]">
          <a className="brand inline-flex items-center gap-[11px] min-w-0" href={paths.dashboard()} aria-label="Collabor8r, dashboard" onClick={onClose}>
            <span className="brand__mark [display:grid] place-items-center flex-none w-[38px] h-[38px] rounded-[12px] bg-transparent text-[color:var(--on-ember)] shadow-[var(--shadow)] overflow-hidden p-0" aria-hidden="true">
              <BrandMark className="w-full h-full object-contain" />
            </span>
            <span className="brand__name [font:700_19px/1_var(--display)] tracking-[-0.02em] whitespace-nowrap">Collabor8r</span>
          </a>
        </div>

        <button
          type="button"
          className="side__search flex flex-none items-center gap-[10px] h-[42px] py-0 px-[12px] text-left rounded-[12px] border border-[var(--side-line)] bg-[color:var(--side-pill)] text-side-muted [&:hover]:text-side-text focus-visible:outline-side-text"
          data-act="search"
          aria-label="Search (Ctrl+K)"
          onClick={() => {
            onClose();
            openSearch();
          }}
        >
          <Icon name="search" />
          <span className="side__label flex-1">Search</span>
        </button>

        <SideNav pathname={pathname} pid={pid} role={role} badges={badges} sheet onNavigate={onClose} />

        <SideGoal goal={goal} pid={pid} onNavigate={onClose} />

        <AccountMenu user={user} theme={theme} onSignOut={onSignOut} onNavigate={onClose} />
      </aside>
    </>
  );
}
