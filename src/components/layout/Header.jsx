import Button from "../ui/Button.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import { Icon } from "../ui/Icon.jsx";

// Top bar. Every control is driven by props from Layout, so no state lives here.
export default function Header({ crumb, theme, unread, navOpen, bellOpen, onMenu, onBell, onActivity, openSearch, newItems }) {
  return (
    <header className="top sticky top-0 z-30 flex items-center gap-[14px] min-h-[72px] py-0 px-[var(--gutter)] [margin:0_calc(var(--gutter)_*_-1)_6px] w760:[padding:max(8px,env(safe-area-inset-top))_14px_8px] w760:gap-[10px] w760:min-h-[64px] w760:[margin:0_-14px_4px] before:content-[''] before:z-[-1] before:[background:color-mix(in_srgb,var(--bg)_82%,transparent)] before:[-webkit-backdrop-filter:blur(14px)_saturate(1.2)] before:[backdrop-filter:blur(14px)_saturate(1.2)] before:[border-bottom:1px_solid_var(--line)] before:[opacity:var(--top-solid,0)] before:[transition:opacity_0.25s_var(--ease)] before:absolute before:inset-0">
      <Button
        className="ibtn top__menu hidden w900:inline-grid w760:hidden"
        id="btn-menu"
        aria-label="Open menu"
        aria-controls="side"
        aria-expanded={navOpen}
        onClick={onMenu}
      >
        <Icon name="menu" />
      </Button>
      <p className="top__crumb flex min-w-0 items-center gap-[6px] whitespace-nowrap font-semibold text-muted [&_.ico]:w-[14px] [&_.ico]:h-[14px] w760:[&_.ico]:hidden">
        <span className="top__home w760:hidden">Collabor8r</span>
        <Icon name="chevR" />
        <b id="crumb" className="text-text [font:600_17px_var(--display)] tracking-[-0.01em] text-ellipsis min-w-0 overflow-hidden">{crumb}</b>
      </p>
      <div className="top__tools flex items-center gap-[8px] ml-auto">
        <Button className="ibtn top__search hidden w760:inline-grid" data-act="search" aria-label="Search" onClick={openSearch}>
          <Icon name="search" />
        </Button>
        <Button
          magnetic
          className="ibtn magnetic"
          id="btn-theme"
          aria-label={theme.resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={theme.toggle}
        >
          <Icon name="moon" cls="ico--moon dark:hidden" />
          <Icon name="sun" cls="ico--sun hidden dark:block" />
        </Button>
        <Button magnetic className="ibtn magnetic w760:hidden" id="btn-activity" aria-label="Recent activity" onClick={onActivity}>
          <Icon name="history" />
        </Button>
        <Button
          magnetic
          className="ibtn magnetic"
          id="btn-bell"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          aria-haspopup="dialog"
          aria-expanded={bellOpen}
          onClick={onBell}
        >
          <Icon name="bell" />
          <span className="bg-ember w-[8px] h-[8px] [box-shadow:0_0_0_2px_var(--bg)] rounded-[50%] absolute top-[8px] right-[9px]" id="bell-badge" hidden={!unread} />
        </Button>
        <Dropdown
          label="New"
          items={newItems}
          trigger={(p) => (
            <Button
              magnetic
              variant="ember"
              size="sm"
              className="magnetic top__new w760:w-[44px] w760:p-0"
              id={p.id}
              ref={p.ref}
              onClick={p.onClick}
              onKeyDown={p.onKeyDown}
              aria-haspopup={p["aria-haspopup"]}
              aria-expanded={p["aria-expanded"]}
              aria-controls={p["aria-controls"]}
            >
              <Icon name="plus" />
              <span className="w760:hidden">New</span>
            </Button>
          )}
        />
      </div>
    </header>
  );
}
