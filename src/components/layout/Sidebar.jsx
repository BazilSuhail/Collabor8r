import { Fragment, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_GROUPS } from "../../metadata/nav.js";
import { paths } from "../../routes/paths.js";
import { PROJECT_ROLE_ORDER } from "../../utils/permissions.js";
import { userAvatarSrc } from "../../utils/media.js";
import { gsap, prefersReduced, useEntry } from "../../utils/motion.js";
import { BrandMark, Icon } from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import OrgSwitcher from "./OrgSwitcher.jsx";
import ProjectSwitcher from "./ProjectSwitcher.jsx";

const RAIL_PILL =
  "z-0 pointer-events-none opacity-0 h-0 absolute top-0 left-[4px] right-[4px] before:content-[''] before:absolute before:inset-0 before:rounded-[12px] before:bg-[var(--side-pill)] before:[box-shadow:inset_0_1px_#ffffff0f] after:content-[''] after:absolute after:top-[10px] after:bottom-[10px] after:left-0 after:w-[3px] after:rounded-[0_3px_3px_0] after:[background:linear-gradient(#ff8a62,var(--ember))] after:[box-shadow:0_0_12px_2px_#e4572e8c]";
const SHEET_PILL =
  "z-0 pointer-events-none opacity-0 h-0 absolute top-0 left-0 before:content-[''] before:absolute before:inset-0 before:rounded-[12px] before:[background-color:var(--side-pill)] before:[box-shadow:inset_0_1px_#ffffff0f] after:content-[''] after:absolute after:top-[10px] after:bottom-[10px] after:left-0 after:w-[3px] after:rounded-[0_3px_3px_0] after:[background:linear-gradient(#ff8a62,var(--ember))] after:[box-shadow:0_0_12px_2px_#e4572e8c]";

const rank = (role) => PROJECT_ROLE_ORDER.indexOf(role);
const allowed = (item, role) =>
  !item.requires || (role && rank(role) >= rank(item.requires));
const capitalise = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

// Secondary line under a nav label. Only uses data the sidebar already receives (badge counts and project role).
function detailFor(id, badge, role) {
  if (id === "my-work" && badge) return `${badge} assigned to you`;
  if (id === "overview" && role) return `Your role: ${capitalise(role)}`;
  return null;
}

// Main, project and settings links. Project items show only with a project. Role gating hides entries.
export function SideNav({
  pathname,
  pid,
  role,
  badges = {},
  mini = false,
  sheet = false,
  onNavigate,
}) {
  const navRef = useRef(null);
  const pillRef = useRef(null);

  const groups = NAV_GROUPS.filter((g) => !g.project || pid)
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => allowed(item, role))
        .map((item) => ({ ...item, href: item.to(pid) })),
    }))
    .filter((g) => g.items.length > 0);

  // The active link is the one with the longest matching href, so /p/x overview does not win on /p/x/issues.
  let activeId = null;
  let best = -1;
  groups.forEach((g) =>
    g.items.forEach((item) => {
      const hit =
        pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (hit && item.href.length > best) {
        best = item.href.length;
        activeId = item.id;
      }
    }),
  );

  useEntry(
    navRef,
    ({ gsap: g, reduced }) => {
      const move = () => {
        const link = navRef.current?.querySelector('.nav[aria-current="page"]');
        const pill = pillRef.current;
        if (!link || !pill) return;
        const to = sheet
          ? {
              x: link.offsetLeft,
              y: link.offsetTop,
              width: link.offsetWidth,
              height: link.offsetHeight,
              opacity: 1,
            }
          : { y: link.offsetTop, height: link.offsetHeight, opacity: 1 };
        g.to(pill, { ...to, duration: reduced ? 0 : 0.5, ease: "power3.out" });
      };
      move();
      addEventListener("resize", move);
      return () => removeEventListener("resize", move);
    },
    [activeId, mini, sheet, pid],
  );

  const navClass = sheet
    ? "side__nav grid grid-cols-2 content-start gap-x-3 gap-y-1 flex-auto min-h-0 mx-[-4px] py-0 px-[4px] relative overflow-x-hidden overflow-y-auto [scrollbar-width:none]"
    : "side__nav flex flex-col flex-auto gap-[2px] min-h-0 mx-[-4px] py-0 px-[4px] relative overflow-x-hidden overflow-y-auto [scrollbar-width:none]";
  const groupClass = sheet
    ? "side__group col-span-2 uppercase tracking-[0.08em] text-side-muted whitespace-nowrap pt-[14px] px-[12px] pb-[6px] text-[11px] font-bold first-of-type:pt-[4px]"
    : "side__group uppercase tracking-[0.08em] text-side-muted whitespace-nowrap pt-[14px] px-[12px] pb-[6px] text-[11px] font-bold first-of-type:pt-[4px] [@media(height<=900px)_and_(width>=901px)]:pt-[10px] [@media(height<=900px)_and_(width>=901px)]:pb-[4px]";

  return (
    <nav className={navClass} aria-label="Main" ref={navRef}>
      <span
        className={sheet ? SHEET_PILL : RAIL_PILL}
        aria-hidden="true"
        ref={pillRef}
      />
      {groups.map((g) => (
        <Fragment key={g.id}>
          <p className={groupClass}>
            <span className="side__label">{g.label}</span>
          </p>
          {g.items.map((item) => {
            const active = item.id === activeId;
            const badge = badges[item.id];
            const detail = detailFor(item.id, badge, role);
            return (
              <a
                key={item.id}
                className={`nav relative z-[1] flex flex-none items-center gap-[12px] ${detail ? "min-h-[42px] py-[6px]" : "h-[42px] py-0"} px-[12px] rounded-[12px] whitespace-nowrap text-[14px] font-semibold text-side-muted [&:hover]:text-side-text aria-[current=page]:text-side-text aria-[current=page]:[&_.ico]:text-[#ff8a62] [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:[&:active]:[transform:scale(0.97)] focus-visible:outline-side-text`}
                href={item.href}
                data-route={item.id}
                data-tip={item.label}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon name={item.icon} />
                {detail ? (
                  <span className="side__label flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.label}</span>
                    <small className="truncate text-[11.5px] font-medium text-side-muted">
                      {detail}
                    </small>
                  </span>
                ) : (
                  <span className="side__label">{item.label}</span>
                )}
                {badge ? (
                  <span
                    className="nav__badge inline-grid min-w-[22px] h-[20px] py-0 px-[7px] text-side-text bg-[#ffffff1a] rounded-[999px] place-items-center ml-auto text-[11px] font-bold"
                    data-badge={item.id}
                  >
                    {badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}

// Monthly goal card: first open goal of the current project. Hidden when there is none.
export function SideGoal({ goal, pid, onNavigate }) {
  if (!goal || !pid) return null;
  const target = Number(goal.target) || 0;
  const current = Number(goal.current) || 0;
  const pct =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const unit = goal.unit ? ` ${goal.unit}` : "";
  return (
    <a
      className="side__goal [display:grid] flex-none gap-[8px] p-[14px] rounded-[15px] border border-[var(--side-line)] bg-[linear-gradient(135deg,#e4572e38,#5b52d629)] focus-visible:outline-side-text [&_small]:text-side-muted [&_small]:text-[11.5px]"
      href={paths.goals(pid)}
      aria-label={`Goal: ${goal.title ?? "Project goal"}`}
      onClick={onNavigate}
    >
      <span className="side__goal-top side__label flex justify-between text-side-muted text-[12.5px] font-semibold [&_b]:text-side-text [&_b]:tabular-nums">
        <span>Goal</span>
        <b>{pct}%</b>
      </span>
      <span className="meter meter--side side__label [&_.meter\_\_fill]:bg-[linear-gradient(90deg,var(--ember),#ffb08f)]">
        <span
          className="meter__fill"
          style={{ transform: `scale(${pct / 100}, 1)` }}
        />
      </span>
      <small className="side__label truncate">
        {goal.title ?? "Goal"}: {current} of {target}
        {unit}
      </small>
    </a>
  );
}

// Account button: profile, settings, theme and sign out.
export function AccountMenu({ user, theme, onSignOut, onNavigate }) {
  const navigate = useNavigate();
  const dark = theme?.resolved === "dark";
  const items = [
    {
      id: "profile",
      label: "Profile",
      icon: "user",
      onSelect: () => {
        onNavigate?.();
        navigate(paths.settingsProfile());
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: "settings",
      onSelect: () => {
        onNavigate?.();
        navigate(paths.settings());
      },
    },
    {
      id: "theme",
      label: dark ? "Switch to light theme" : "Switch to dark theme",
      icon: "moon",
      onSelect: () => theme?.toggle(),
    },
    "separator",
    {
      id: "signout",
      label: "Sign out",
      icon: "logout",
      danger: true,
      onSelect: () => onSignOut?.(),
    },
  ];
  return (
    <Dropdown
      label="Account menu"
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
          aria-label="Account menu"
          className="side__me flex flex-none items-center gap-[10px] p-[8px] rounded-[14px] text-left [&:hover]:bg-[#ffffff0f] aria-[expanded=true]:bg-[#ffffff0f] focus-visible:outline-side-text"
        >
          <Avatar
            name={user?.displayName ?? user?.email ?? "Me"}
            src={userAvatarSrc(user)}
            size="md"
          />
          <span className="side__label side__who flex-1 min-w-0">
            <b className="block overflow-hidden whitespace-nowrap text-ellipsis text-[13.5px] text-side-text">
              {user?.displayName ?? "Signed in"}
            </b>
            <small className="block whitespace-nowrap text-side-muted text-[12px] overflow-hidden text-ellipsis">
              {user?.jobTitle ?? ""}
            </small>
          </span>
          <Icon
            name="upDown"
            cls="side__label w-[16px] h-[16px] text-side-muted"
          />
        </button>
      )}
    />
  );
}

export default function Sidebar({
  pathname,
  pid,
  project,
  orgId,
  personal,
  role,
  badges,
  mini,
  onToggle,
  openSearch,
  user,
  goal,
  theme,
  onSignOut,
}) {
  const asideRef = useRef(null);
  const miniRef = useRef(mini);

  useLayoutEffect(() => {
    const prev = miniRef.current;
    miniRef.current = mini;
    const side = asideRef.current;
    const app = side?.parentElement;
    if (!side || !app || prev === mini) return;
    const to = parseFloat(
      getComputedStyle(app).getPropertyValue(mini ? "--side-mini" : "--side-w"),
    );
    const clear = () => {
      app.style.gridTemplateColumns = "";
      app.style.background = "";
      side.style.willChange = "";
    };
    if (
      prefersReduced() ||
      !matchMedia("(min-width: 901px)").matches ||
      !(to >= 0)
    ) {
      clear();
      return;
    }
    const state = { w: side.getBoundingClientRect().width };
    const paint = () => {
      app.style.gridTemplateColumns = `${state.w}px minmax(0,1fr)`;
      app.style.background = `linear-gradient(90deg, var(--side-bg) ${state.w}px, transparent 0)`;
    };
    paint();
    side.style.willChange = "width";
    const tl = gsap.timeline({ onComplete: clear });
    tl.to(
      state,
      { w: to, duration: 0.5, ease: "power3.inOut", onUpdate: paint },
      0,
    );
    return () => {
      tl.kill();
      clear();
    };
  }, [mini]);

  return (
    <aside
      className="side z-40 flex h-[100dvh] flex-col gap-[14px] sticky top-0 overflow-hidden bg-side-bg text-side-text pt-[18px] px-[14px] pb-[14px] w900:z-[50] w900:invisible w900:w-[min(300px,86vw)] w900:h-[100dvh] w900:pt-[max(18px,env(safe-area-inset-top))] w900:pb-[max(14px,env(safe-area-inset-bottom))] w900:fixed w900:top-0 w900:bottom-0 w900:left-0 w900:shadow-[30px_0_60px_-20px_#00000080] [@media(height<=900px)_and_(width>=901px)]:gap-[10px] [@media(height<=900px)_and_(width>=901px)]:pt-[14px]"
      id="side"
      aria-label="Sidebar"
      ref={asideRef}
    >
      <div
        className={`side__top flex items-center justify-between gap-[8px] min-h-[44px] pt-0 ${mini ? "pr-[2px]" : "pr-[40px]"} pb-0 pl-[6px]`}
      >
        <a
          className="brand inline-flex items-center gap-[11px] min-w-0"
          href={paths.dashboard()}
          aria-label="Collabor8r, dashboard"
        >
          <span
            className="brand__mark [display:grid] place-items-center flex-none w-[30px] h-[30px] rounded-[12px] bg-transparent text-[color:var(--on-ember)] shadow-[var(--shadow)] overflow-hidden p-0"
            aria-hidden="true"
          >
            <BrandMark className="w-full h-full object-contain" />
          </span>
          <span className="brand__name [font:700_19px/1_var(--display)] tracking-[-0.02em] whitespace-nowrap">
            Collabor<span className="text-orange-500">8</span>r
          </span>
        </a>
      </div>

      <button
        type="button"
        className="side__search flex flex-none items-center gap-[10px] h-[42px] py-0 px-[12px] text-left rounded-[12px] border border-[var(--side-line)] bg-[color:var(--side-pill)] text-side-muted [&:hover]:text-side-text focus-visible:outline-side-text"
        data-act="search"
        aria-label="Search (Ctrl+K)"
        onClick={openSearch}
      >
        <Icon name="search" />
        <span className="side__label flex-1">Search</span>
        <kbd className="side__label [font:600_11px_var(--font)] text-side-muted border border-[var(--side-line)] [background:0_0] rounded-[6px] py-[2px] px-[6px]">
          Ctrl K
        </kbd>
      </button>

      <div className="grid gap-[8px] flex-none">
        <OrgSwitcher personal={personal} />
        <ProjectSwitcher project={project} orgId={orgId} personal={personal} />
      </div>

      <SideNav
        pathname={pathname}
        pid={pid}
        role={role}
        badges={badges}
        mini={mini}
      />

      <SideGoal goal={goal} pid={pid} />

      <AccountMenu user={user} theme={theme} onSignOut={onSignOut} />
      <button
        type="button"
        className="side__collapse absolute top-[12px] right-[10px] z-[3] [display:grid] place-items-center w-[26px] h-[26px] rounded-[50%] border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--ink)] shadow-[var(--shadow)] dark:bg-[color:var(--side-pill)] dark:border-[color:var(--side-line)] dark:text-[color:var(--side-text)] [&:hover]:bg-[color:var(--surface-2)] dark:[&:hover]:bg-[color:var(--side-bg)] focus-visible:outline-ember [&_.ico]:w-[14px] [&_.ico]:h-[14px] [@media(pointer:coarse)]:w-[44px] [@media(pointer:coarse)]:h-[44px] w900:hidden"
        aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!mini}
        aria-controls="side"
        onClick={onToggle}
      >
        <Icon name="chevL" />
      </button>
    </aside>
  );
}
