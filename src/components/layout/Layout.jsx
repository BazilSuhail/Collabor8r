import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShellProvider, useShell } from "../../context/ShellContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrg } from "../../context/OrgContext.jsx";
import { registerModalHooks } from "../ui/Modal.jsx";
import { getPopLayer } from "../ui/Dropdown.jsx";
import { useTheme, useSidebar } from "../../utils/store.js";
import { gsap, prefersReduced } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import { ORG_ROLE_ORDER, PROJECT_ROLE_ORDER } from "../../utils/permissions.js";
import { pageMeta } from "../../metadata/pages.js";
import { getProject, listProjectMembers } from "../../libs/api/projects.js";
import { listGoals } from "../../libs/api/reports.js";
import { myIssues } from "../../libs/api/myWork.js";
import { paths } from "../../routes/paths.js";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import BottomNav from "./BottomNav.jsx";
import BottomSheet from "./BottomSheet.jsx";
import Finder from "../Finder.jsx";
import NotificationsDrawer from "../notifications/NotificationsDrawer.jsx";
import ActivityDrawer from "../activity/ActivityDrawer.jsx";
// CONTRACT-GAP: IssueFormModal props (projectId, defaults) are not in section B. H07 must accept projectId and must not call useProject().
import IssueFormModal from "../issues/IssueFormModal.jsx";
import shellCss from "../../styles/shell.css?url";

const MOBILE = "(max-width: 760px)";
const PROJECT_KEY = "c8r.project";
const NONE = { data: [], meta: null };
const MEMBER_PAGE_LIMIT = 100;
const MEMBER_MAX_PAGES = 10;

const VIEW_BY_ROUTE = {
  dashboard: "dashboard",
  "my-work": "my-work",
  calendar: "calendar",
  notifications: "notifications",
  ai: "ai",
  help: "help",
  settings: "profile",
  orgs: "orgs",
  projects: "projects",
};

const VIEW_BY_PROJECT_SEGMENT = {
  issues: "issues",
  board: "pipeline",
  backlog: "backlog",
  releases: "releases",
  timesheet: "timesheet",
  wiki: "wiki",
  reports: "reports",
  dashboards: "dashboards",
  goals: "goals",
  automation: "automation",
  integrations: "integrations",
  desk: "desk",
  forms: "forms",
  tests: "tests",
  risks: "risks",
  budget: "budget",
  cat: "cat",
  settings: "project-settings",
};

const projectIdFromPath = (pathname) => {
  const match = /^\/p\/([^/]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const viewFor = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "p") return VIEW_BY_PROJECT_SEGMENT[parts[2]] ?? "project-overview";
  return VIEW_BY_ROUTE[parts[0]] ?? null;
};

const readRememberedProject = () => {
  try {
    return window.localStorage.getItem(PROJECT_KEY);
  } catch {
    return null;
  }
};

// Same rules as ProjectContext.resolveRole, using the member list loaded here.
const projectRoleFor = (project, members, userId, orgRole, membersDenied = false) => {
  if (!project || !userId) return null;
  const served = project.myAccess?.role;
  if (served && PROJECT_ROLE_ORDER.includes(served)) return served;
  const membership = members.find((m) => m.userId === userId);
  if (membership) return PROJECT_ROLE_ORDER.includes(membership.role) ? membership.role : "guest";
  if (!project.orgId) return project.ownerId === userId ? "admin" : null;
  if (orgRole === "owner" || orgRole === "admin") return "admin";
  if (membersDenied) return "guest";
  if (project.visibility === "open" && ORG_ROLE_ORDER.indexOf(orgRole) >= ORG_ROLE_ORDER.indexOf("member")) {
    return "viewer";
  }
  return null;
};

const fetchAllMembers = async (pid) => {
  const members = [];
  let cursor = null;
  for (let page = 0; page < MEMBER_MAX_PAGES; page += 1) {
    const res = await listProjectMembers(pid, { limit: MEMBER_PAGE_LIMIT, ...(cursor ? { cursor } : {}) });
    members.push(...(res.data ?? []));
    cursor = res.meta?.nextCursor ?? null;
    if (!cursor) break;
  }
  return { data: members, meta: null };
};

function useMobile() {
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE).matches);
  useEffect(() => {
    const mq = matchMedia(MOBILE);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

function ShellBody() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { status: authStatus, user, logout } = useAuth();
  const { orgs, org } = useOrg();
  const { drawer, finderOpen, openFinder, closeFinder, createIssue, openCreateIssue, closeCreateIssue, unread } = useShell();
  const theme = useTheme();
  const side = useSidebar();
  const mobile = useMobile();
  const signedIn = authStatus === "authenticated";
  const { setOpen, show } = drawer;

  // The project in the URL, else the one remembered last. A project that fails to load is treated as none.
  const [remembered] = useState(readRememberedProject);
  const pid = projectIdFromPath(pathname) ?? remembered;

  const projectRes = useResource(
    () => (signedIn && pid ? getProject(pid) : Promise.resolve({ data: null, meta: null })),
    [signedIn, pid],
  );
  const project = projectRes.status === "success" ? projectRes.data : null;
  const activePid = project ? pid : null;

  const membersRes = useResource(
    () => (activePid && user?.id && !project?.myAccess ? fetchAllMembers(activePid) : Promise.resolve(NONE)),
    [activePid, user?.id],
  );
  const orgRole = project?.orgId ? (orgs.find((o) => o.id === project.orgId)?.role ?? null) : null;
  const role = activePid ? projectRoleFor(
        project,
        membersRes.data ?? [],
        user?.id ?? null,
        orgRole,
        membersRes.status === "error" && membersRes.error?.status === 403,
      ) : null;

  const goalsRes = useResource(
    () => (activePid ? listGoals(activePid, { limit: 5 }) : Promise.resolve(NONE)),
    [activePid],
  );
  const goal = (goalsRes.data ?? []).find((g) => g.status !== "done") ?? null;

  const tasksRes = useResource(
    () => (signedIn ? myIssues({ limit: 50 }) : Promise.resolve(NONE)),
    [signedIn],
  );
  const taskCount = tasksRes.data?.length ?? 0;
  const badges = {
    "my-work": taskCount ? (tasksRes.meta?.nextCursor || taskCount > 9 ? "9+" : String(taskCount)) : "",
  };

  const view = viewFor(pathname);
  const crumb = view ? pageMeta(view).crumb : "";

  // ShellContext returns a new setter on every drawer change, so the effects below read it through a ref
  // and depend only on their real triggers. Otherwise closing the drawer would re-run them forever.
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const nameRef = useRef(drawer.name);
  nameRef.current = drawer.name;

  // Modal engine: opening the first modal closes the mobile sheet (C.1, reconcile opus2 H05).
  useEffect(() => {
    // Close only the nav sheet. A named panel (notifications, activity) is itself a modal, so it must stay open.
    registerModalHooks({ onFirstOpen: () => { if (!nameRef.current) setOpenRef.current(false); } });
    return () => registerModalHooks({ onFirstOpen: null });
  }, []);

  useEffect(() => {
    getPopLayer();
    document.documentElement.classList.add("is-ready");
    return () => document.documentElement.classList.remove("is-ready");
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    const prev = el.dataset.route;
    el.dataset.route = view ?? "";
    setOpenRef.current(false);
    return () => {
      el.dataset.route = prev;
    };
  }, [pathname, view]);

  useEffect(() => {
    setOpenRef.current(false);
  }, [mobile]);

  useEffect(() => {
    if (prefersReduced()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".glow i").forEach((el, i) => {
        gsap.to(el, {
          x: [-80, 70][i],
          y: [60, -50][i],
          scale: [1.12, 0.92][i],
          duration: 16 + i * 5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let on = false;
    const onScroll = () => {
      const next = window.scrollY > 8;
      if (next === on) return;
      on = next;
      document.documentElement.classList.toggle("is-scrolled", next);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("is-scrolled");
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openFinder();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [openFinder]);

  // The shell uses plain anchors, so route them through the router.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      const href = a?.getAttribute("href");
      if (!href || !href.startsWith("/") || a.target || a.hasAttribute("download")) return;
      e.preventDefault();
      navigate(href);
    };
    addEventListener("click", onClick);
    return () => removeEventListener("click", onClick);
  }, [navigate]);

  // Named drawers (notifications, activity) and the mobile nav sheet share one drawer state.
  // The sheet is open when the drawer is open with no name.
  const navOpen = drawer.open && !drawer.name;
  const toggleNav = () => (navOpen ? setOpen(false) : show(null));
  const closeNav = useCallback(() => setOpen(false), [setOpen]);
  const namedOpen = (name) => drawer.open && drawer.name === name;
  const toggleNamed = (name) => (namedOpen(name) ? setOpen(false) : show(name));
  const closeNamed = useCallback(() => setOpen(false), [setOpen]);

  const signOut = () => logout();

  const newItems = [
    { id: "issue", label: "Issue", icon: "task", disabled: !activePid, onSelect: () => openCreateIssue({ projectId: activePid }) },
    { id: "sprint", label: "Sprint", icon: "sprint", disabled: !activePid, href: activePid ? paths.backlog(activePid) : undefined },
    { id: "wiki", label: "Wiki page", icon: "wiki", disabled: !activePid, href: activePid ? paths.wikiNew(activePid) : undefined },
    { id: "project", label: "Project", icon: "project", href: paths.projects() },
  ];

  return (
    <>
      <link rel="stylesheet" href={shellCss} precedence="shell" />
      <a className="skip fixed top-[-60px] left-[12px] z-[100] rounded-[12px] bg-ink px-[16px] py-[10px] text-on-ink focus:top-[12px]" href="#main">
        Skip to content
      </a>
      <div className="glow pointer-events-none fixed inset-0 z-[-1] overflow-hidden" aria-hidden="true">
        <i className="glow__a absolute rounded-[50%] will-change-transform motion-reduce:will-change-auto w-[60vmax] h-[60vmax] top-[-26vmax] right-[-20vmax] bg-[radial-gradient(closest-side,var(--glow-a),transparent)]" />
        <i className="glow__b absolute rounded-[50%] will-change-transform motion-reduce:will-change-auto w-[54vmax] h-[54vmax] bottom-[-30vmax] left-[10vmax] bg-[radial-gradient(closest-side,var(--glow-b),transparent)]" />
      </div>

      <div className="app [display:grid] min-h-[100dvh] grid-cols-[var(--side-w)_minmax(0,1fr)] bg-[linear-gradient(90deg,var(--side-bg)_var(--side-w),transparent_0)] w900:grid-cols-[minmax(0,1fr)] w900:bg-none">
        {!mobile && (
          <Sidebar
            pathname={pathname}
            pid={activePid}
            project={project}
            orgId={project ? project.orgId : (org?.id ?? null)}
            personal={Boolean(project) && !project.orgId}
            role={role}
            badges={badges}
            mini={side.mini}
            onToggle={side.toggle}
            openSearch={openFinder}
            user={user}
            goal={goal}
            theme={theme}
            onSignOut={signOut}
          />
        )}
        <div className="frame min-w-0 pt-0 px-[var(--gutter)] pb-[56px] overflow-x-clip w760:pr-[max(14px,env(safe-area-inset-right))] w760:pb-[calc(96px_+_env(safe-area-inset-bottom))] w760:pl-[max(14px,env(safe-area-inset-left))]">
          <Header
            crumb={crumb}
            theme={theme}
            unread={unread}
            navOpen={navOpen}
            bellOpen={namedOpen("notifications")}
            onMenu={toggleNav}
            onBell={() => toggleNamed("notifications")}
            onActivity={() => toggleNamed("activity")}
            openSearch={openFinder}
            newItems={newItems}
          />
          <main id="main" className="main relative">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomNav pathname={pathname} pid={activePid} badges={badges} drawerOpen={navOpen} onMore={toggleNav} />
      {mobile && (
        <BottomSheet
          open={navOpen}
          onClose={closeNav}
          pathname={pathname}
          pid={activePid}
          role={role}
          badges={badges}
          goal={goal}
          user={user}
          theme={theme}
          openSearch={openFinder}
          onSignOut={signOut}
        />
      )}

      <div className="side-scrim fixed inset-0 z-[45] invisible opacity-0 bg-[#14100c52] [[data-theme=dark]_&]:bg-[#0009]" aria-hidden="true" onClick={closeNav} />
      <div className="scrim fixed inset-0 z-[55] invisible opacity-0 bg-[#14100c52] [[data-theme=dark]_&]:bg-[#0009]" aria-hidden="true" />

      <Finder open={finderOpen} onClose={closeFinder} pid={activePid} onNewIssue={() => openCreateIssue({ projectId: activePid })} />
      <NotificationsDrawer open={namedOpen("notifications")} onClose={closeNamed} />
      <ActivityDrawer open={namedOpen("activity")} onClose={closeNamed} pid={activePid} />
      {createIssue && (
        <IssueFormModal open onClose={closeCreateIssue} projectId={createIssue.projectId ?? activePid} defaults={createIssue} />
      )}
    </>
  );
}

// Signed-in shell. ShellProvider holds the drawer, Finder, create-issue and unread state.
export default function Layout() {
  return (
    <ShellProvider>
      <ShellBody />
    </ShellProvider>
  );
}
