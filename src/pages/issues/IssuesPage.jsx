// feat(pages/issues/IssuesPage): search, filter and bulk-edit a project's issues, with saved filters and quick create.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import FilterChip from "../../components/ui/FilterChip.jsx";
import Highlight from "../../components/ui/Highlight.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import JerryButton from "../../components/ai/JerryButton.jsx";
import Select from "../../components/ui/Select.jsx";
import SplitTitle from "../../components/SplitTitle.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listSprints } from "../../libs/api/boards.js";
import { deleteIssue, listIssues } from "../../libs/api/issues.js";
import { summary } from "../../libs/api/reports.js";
import { searchUsers } from "../../libs/api/users.js";
import { emptyCopy } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { relativeTime } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { priorityIcon, priorityTone, statusTone, typeIcon } from "../../utils/issueVisuals.js";
import { useResource } from "../../utils/useResource.js";
import { usePaged } from "../../utils/usePaged.js";
import BulkBar from "./components/BulkBar.jsx";
import SavedFiltersPanel from "./components/SavedFiltersPanel.jsx";

const FILTER_KEYS = ["q", "status", "assignee", "type", "label", "sprint", "savedFilter"];
const STATUS_CHIPS = [
  { value: "todo", label: "To do" },
  { value: "inprogress", label: "In progress" },
  { value: "done", label: "Done" },
];
const SORT_VALUE = {
  key: (r) => r.number ?? 0,
  title: (r) => String(r.title ?? "").toLowerCase(),
  status: (r) => String(r.statusName ?? ""),
  priority: (r) => r.priorityRank ?? 99,
  updated: (r) => new Date(r.lastActivityAt ?? r.updatedAt ?? 0).getTime(),
};

const idOf = (r) => String(r.id ?? r._id);
const withId = (r) => ({ ...r, id: idOf(r) });
const assigneeOf = (r) => r.assigneeUser ?? r.assignee ?? null;

export default function IssuesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId, types, labels, statuses, can } = useProject();
  const { openCreateIssue } = useShell();
  const toast = useToast();
  const [sort, setSort] = useState(null);
  const [selected, setSelected] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const assignee = searchParams.get("assignee") ?? "";
  const type = searchParams.get("type") ?? "";
  const label = searchParams.get("label") ?? "";
  const sprint = searchParams.get("sprint") ?? "";
  const savedFilter = searchParams.get("savedFilter") ?? "";
  const activeStatuses = status ? status.split(",") : [];
  const hasFilters = FILTER_KEYS.some((k) => searchParams.get(k));

  const setParams = (changes) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => {
          if (v) next.set(k, v);
          else next.delete(k);
        });
        return next;
      },
      { replace: true },
    );
  // Any manual filter change leaves the saved filter behind.
  const setFilter = (changes) => setParams({ ...changes, savedFilter: null });
  const clearFilters = () => {
    setDraftQ("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Search is debounced 250ms before it reaches the URL and the request.
  const [draftQ, setDraftQ] = useState(q);
  useEffect(() => {
    setDraftQ(q);
  }, [q]);
  useEffect(() => {
    if (draftQ.trim() === q) return undefined;
    const id = setTimeout(() => setFilter({ q: draftQ.trim() }), 250);
    return () => clearTimeout(id);
    // Only the typed text drives the debounce. setFilter is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ]);

  const params = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(assignee ? { assignee } : {}),
      ...(type ? { type } : {}),
      ...(label ? { label } : {}),
      ...(sprint ? { sprint } : {}),
      ...(savedFilter ? { savedFilter } : {}),
    }),
    [q, status, assignee, type, label, sprint, savedFilter],
  );
  const issues = usePaged((p) => listIssues(projectId, p), params);
  const rows = useMemo(() => issues.items.map(withId), [issues.items]);
  const ready = issues.status === "success";

  const stats = useResource(() => summary(projectId), [projectId]);
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const counts = useMemo(() => {
    const byStatus = stats.data?.byStatus ?? {};
    const sumOf = (category) =>
      statuses
        .filter((s) => s.category === category)
        .reduce((total, s) => total + (byStatus[s.name] ?? 0), 0);
    return { todo: sumOf("todo"), inprogress: sumOf("inprogress"), done: sumOf("done") };
  }, [stats.data, statuses]);

  const displayRows = useMemo(() => {
    if (!sort) return rows;
    const get = SORT_VALUE[sort.key] ?? SORT_VALUE.updated;
    const list = [...rows];
    list.sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? c : -c;
    });
    return list;
  }, [rows, sort]);

  const onSort = (key) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const visibleIds = useMemo(() => new Set(rows.map(idOf)), [rows]);
  const liveSelected = selected.filter((id) => visibleIds.has(id));

  const onBulkChanged = () => {
    setSelected([]);
    issues.reload();
    stats.reload();
  };

  const copyLink = async (row) => {
    const url = `${window.location.origin}${paths.issue(projectId, row.key)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const removeIssue = async () => {
    try {
      await deleteIssue(projectId, idOf(deleting));
      issues.setItems((prev) => prev.filter((r) => idOf(r) !== idOf(deleting)));
      toast.success(`Deleted ${deleting.key}`);
      stats.reload();
    } catch (err) {
      toast.error(err.message ?? "Could not delete the issue");
      throw err;
    }
  };

  const applySavedFilter = (filter) => {
    setSearchParams(new URLSearchParams({ savedFilter: idOf(filter) }), { replace: true });
    setPanelOpen(false);
  };

  // Saved filter grammar: "field = value" joined by AND. Only one status category can be saved.
  const savedQuery = useMemo(() => {
    const clauses = [];
    if (activeStatuses.length === 1) clauses.push(`category = ${activeStatuses[0]}`);
    if (assignee) clauses.push(`assignee = ${assignee}`);
    const typeName = types.find((t) => idOf(t) === type)?.name;
    if (typeName) clauses.push(`type = "${typeName}"`);
    if (label) clauses.push(`label = "${label}"`);
    if (sprint) clauses.push(`sprint = ${sprint}`);
    return clauses.join(" AND ");
    // activeStatuses is derived from status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assignee, type, label, sprint, types]);

  const toggleStatus = (value) => {
    const next = activeStatuses.includes(value)
      ? activeStatuses.filter((s) => s !== value)
      : [...activeStatuses, value];
    setFilter({ status: next.join(",") || null });
  };

  const loadUsers = async (text) => {
    const res = await searchUsers(text);
    return (res.data ?? []).map((u) => ({ value: idOf(u), label: u.displayName }));
  };

  const columns = [
    {
      key: "key",
      label: "Key",
      sortable: true,
      width: "110px",
      render: (r) => <span className="tnum font-bold text-muted text-[12.5px] whitespace-nowrap">{r.key}</span>,
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (r) => (
        <span className="block min-w-0 truncate font-semibold text-text" title={r.title}>
          <Highlight text={r.title} query={q} />
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      width: "150px",
      render: (r) => (
        <span className="inline-flex items-center gap-[7px] text-[13px] text-muted whitespace-nowrap">
          <Icon name={typeIcon({ icon: r.typeIcon, name: r.typeName, hierarchy: r.hierarchy })} cls="text-muted" />
          {r.typeName}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      width: "150px",
      render: (r) => (
        <Badge variant="status" tone={statusTone(r.statusCategory)}>
          {r.statusName}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      width: "140px",
      render: (r) => (
        <Badge variant="badge" tone={priorityTone(r.priorityRank)} icon={priorityIcon(r.priorityRank, r.priorityIcon)}>
          {r.priorityName ?? "None"}
        </Badge>
      ),
    },
    {
      key: "assignee",
      label: "Assignee",
      width: "180px",
      render: (r) => {
        const a = assigneeOf(r);
        if (!a) return <span className="text-faint text-[13px]">Unassigned</span>;
        return (
          <span className="inline-flex items-center gap-[8px] min-w-0">
            <Avatar name={a.displayName ?? "User"} src={a.avatar} size="xs" />
            <span className="truncate text-[13px]">{a.displayName}</span>
          </span>
        );
      },
    },
    {
      key: "updated",
      label: "Updated",
      sortable: true,
      width: "130px",
      render: (r) => (
        <span className="text-muted text-[12.5px] whitespace-nowrap">{relativeTime(r.lastActivityAt ?? r.updatedAt)}</span>
      ),
    },
  ];

  const rowMenu = (row) => [
    { id: "open", label: "Open", icon: "external", onSelect: () => navigate(paths.issue(projectId, row.key)) },
    { id: "copy", label: "Copy link", icon: "copy", onSelect: () => copyLink(row) },
    ...(can("issue.delete")
      ? [
          "separator",
          { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleting(row) },
        ]
      : []),
  ];

  // Illustration sits above the empty-state action on desktop and is hidden on narrow screens.
  const emptyArt = <Illustration name="empty" alt="" className="w-[180px] w1000:hidden" />;
  const empty = hasFilters
    ? {
        ...emptyCopy("issues"),
        action: (
          <div className="grid justify-items-center gap-[10px]">
            {emptyArt}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ),
      }
    : {
        icon: "task",
        title: "No issues yet",
        text: "Create the first issue for this project.",
        action: (
          <div className="grid justify-items-center gap-[10px]">
            {emptyArt}
            {can("issue.create") ? (
              <Button variant="ember" size="sm" icon="plus" onClick={() => openCreateIssue({})}>
                New issue
              </Button>
            ) : null}
          </div>
        ),
      };

  useViewEntry(
    "issues",
    ({ q: sel, root }) => {
      fadeUp(sel(".head__sub"), { y: 8, delay: 0.12 });
      fadeUp(sel(".head .stat, .head__actions > *"), { y: 14, stagger: 0.07, delay: 0.16 });
      fadeUp(sel(".toolbar > *"), { y: 10, stagger: 0.03, delay: 0.2 });
      cardRise(sel(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  return (
    <>
      <header className="head">
        <div className="head__lead">
          <div className="head__text">
            <SplitTitle text="Issues" />
            <p className="head__sub">Search, filter and bulk-edit the work in this project.</p>
          </div>
        </div>
        <div className="head__actions">
          <Button variant="ghost" icon="filter" onClick={() => setPanelOpen(true)}>
            Saved filters
          </Button>
          {can("issue.create") ? (
            <Button variant="ember" icon="plus" magnetic onClick={() => openCreateIssue({})}>
              New issue
            </Button>
          ) : null}
        </div>
        <dl className="head__stats">
          <div className="stat">
            <span className="stat__ico">
              <Icon name="stTodo" />
            </span>
            <div className="stat__body">
              <dd className="stat__value">
                <b className="tnum">{counts.todo}</b>
              </dd>
              <dt className="stat__label">To do</dt>
            </div>
          </div>
          <div className="stat">
            <span className="stat__ico">
              <Icon name="stProgress" />
            </span>
            <div className="stat__body">
              <dd className="stat__value">
                <b className="tnum">{counts.inprogress}</b>
              </dd>
              <dt className="stat__label">In progress</dt>
            </div>
          </div>
          <div className="stat">
            <span className="stat__ico">
              <Icon name="stDone" />
            </span>
            <div className="stat__body">
              <dd className="stat__value">
                <b className="tnum">{counts.done}</b>
              </dd>
              <dt className="stat__label">Done</dt>
            </div>
          </div>
        </dl>
      </header>

      <div className="toolbar">
        <Input
          variant="search"
          label="Search issues"
          hideLabel
          placeholder="Search issues"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
        />
        <JerryButton mode="search" projectId={projectId} onApply={(out) => setDraftQ(out.query ?? "")} />
        {STATUS_CHIPS.map((c) => (
          <FilterChip key={c.value} pressed={activeStatuses.includes(c.value)} onClick={() => toggleStatus(c.value)}>
            {c.label}
          </FilterChip>
        ))}
        <FilterChip pressed={assignee === "me"} icon="user" onClick={() => setFilter({ assignee: assignee === "me" ? null : "me" })}>
          Mine
        </FilterChip>
        <Select
          variant="button"
          size="sm"
          label="Type"
          placeholder="All types"
          value={type}
          options={[{ value: "", label: "All types" }, ...types.map((t) => ({ value: idOf(t), label: t.name }))]}
          onChange={(v) => setFilter({ type: v || null })}
        />
        <Select
          variant="button"
          size="sm"
          label="Assignee"
          placeholder="Anyone"
          value={assignee && assignee !== "me" ? assignee : null}
          searchable
          loadOptions={loadUsers}
          onChange={(v) => setFilter({ assignee: v || null })}
        />
        <Select
          variant="button"
          size="sm"
          label="Label"
          placeholder="All labels"
          value={label}
          options={[{ value: "", label: "All labels" }, ...labels.map((l) => ({ value: l.name, label: l.name }))]}
          onChange={(v) => setFilter({ label: v || null })}
        />
        <Select
          variant="button"
          size="sm"
          label="Sprint"
          placeholder="All sprints"
          value={sprint}
          options={[
            { value: "", label: "All sprints" },
            ...(sprints.data ?? [])
              .filter((s) => s.state !== "closed")
              .map((s) => ({ value: idOf(s), label: s.name })),
          ]}
          onChange={(v) => setFilter({ sprint: v || null })}
        />
        <span className="toolbar__spacer" />
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {liveSelected.length > 0 && can("issue.bulk") ? (
        <BulkBar ids={liveSelected} onClear={() => setSelected([])} onChanged={onBulkChanged} />
      ) : null}

      <DataTable
        label="Issues"
        columns={columns}
        rows={displayRows}
        rowKey="id"
        status={issues.status}
        error={issues.error}
        onRetry={issues.reload}
        empty={empty}
        sort={sort ?? { key: null, dir: null }}
        onSort={onSort}
        onRowClick={(row) => navigate(paths.issue(projectId, row.key))}
        rowMenu={rowMenu}
        hasMore={issues.hasMore}
        onLoadMore={issues.loadMore}
        loadingMore={issues.loadingMore}
        selectable={can("issue.bulk")}
        selected={liveSelected}
        onSelect={setSelected}
      />

      <SavedFiltersPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        query={savedQuery}
        activeId={savedFilter}
        onApply={applySavedFilter}
        onDeleted={() => setParams({ savedFilter: null })}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.key ?? "issue"}?`}
        text="Deleted issues cannot be restored."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeIssue}
      />
    </>
  );
}
