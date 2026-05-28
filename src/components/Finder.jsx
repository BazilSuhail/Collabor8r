import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenterModal from "./ui/CenterModal.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import Highlight from "./ui/Highlight.jsx";
import Spinner from "./ui/Spinner.jsx";
import { Icon } from "./ui/Icon.jsx";
import { FINDER_STATIC } from "../metadata/finder.js";
import { paths } from "../routes/paths.js";
import { listIssues } from "../libs/api/issues.js";
import { searchUsers } from "../libs/api/users.js";

const EMPTY = { issues: [], users: [] };
const KIND_ICON = { Page: "chevR", Action: "plus", Issue: "task", Person: "user" };
const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 14;

// Ctrl/Cmd+K Finder. Static pages and actions, plus issues in the current project and people.
export default function Finder({ open, onClose, pid, onNewIssue }) {
  const navigate = useNavigate();
  const listId = useId();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const needle = q.trim();
  const needleLower = needle.toLowerCase();

  // Reset the query each time the Finder opens.
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setRemote(EMPTY);
    }
  }, [open]);

  // Remote search, debounced. Needs two characters so a single letter does not query.
  useEffect(() => {
    if (!open || needle.length < 2) {
      setRemote(EMPTY);
      setBusy(false);
      return undefined;
    }
    let alive = true;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const [issues, users] = await Promise.all([
          pid ? listIssues(pid, { q: needle, limit: 5 }) : Promise.resolve({ data: [] }),
          searchUsers(needle),
        ]);
        if (alive) setRemote({ issues: issues.data ?? [], users: users.data ?? [] });
      } catch {
        if (alive) setRemote(EMPTY);
      } finally {
        if (alive) setBusy(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [needle, open, pid]);

  const results = useMemo(() => {
    const statics = FINDER_STATIC.filter((e) => e.action !== "new-issue" || pid)
      .filter((e) => !needleLower || `${e.label} ${e.keywords}`.toLowerCase().includes(needleLower))
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        label: e.label,
        meta: e.kind === "Action" ? "New issue" : e.to ? e.to() : "",
        action: e.action ?? null,
        href: e.to ? e.to() : null,
      }));
    const issues = remote.issues.map((i) => ({
      id: `issue-${i.id ?? i._id ?? i.key}`,
      kind: "Issue",
      label: i.summary ?? i.key,
      meta: i.key ?? "",
      action: null,
      href: pid && i.key ? paths.issue(pid, i.key) : null,
    }));
    const users = remote.users.map((u) => ({
      id: `user-${u.id ?? u._id ?? u.displayName}`,
      kind: "Person",
      label: u.displayName ?? u.email ?? "",
      meta: u.email ?? "",
      action: null,
      href: pid ? paths.projectPeople(pid) : null,
    }));
    return [...statics, ...issues, ...users].slice(0, MAX_RESULTS);
  }, [needleLower, pid, remote]);

  const optionId = (i) => `${listId}-${i}`;
  const current = results[Math.min(active, Math.max(results.length - 1, 0))];

  const pick = (entry) => {
    if (!entry) return;
    if (entry.action === "new-issue") {
      onClose();
      onNewIssue?.();
      return;
    }
    if (!entry.href) return;
    onClose();
    navigate(entry.href);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(current);
    }
  };

  return (
    <CenterModal open={open} onClose={onClose} title="Search" position="top" size="md">
      <div className="flex items-center gap-[12px] pb-[14px] border-b border-line">
        <Icon name="search" cls="text-muted" />
        <input
          className="flex-1 min-w-0 bg-transparent border-0 text-text text-[17px] placeholder:text-faint focus:outline-none"
          type="text"
          role="combobox"
          aria-label="Search Collabor8r"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(Math.min(active, results.length - 1)) : undefined}
          placeholder="Search pages, issues and people"
          autoComplete="off"
          spellCheck="false"
          value={q}
          autoFocus
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        {busy && <Spinner size="sm" label="Searching" />}
        <kbd className="text-muted border border-line-2 rounded-[7px] py-[3px] px-[7px] text-[11px]">esc</kbd>
      </div>

      {results.length > 0 ? (
        <ul className="max-h-[52vh] mt-[8px] overflow-auto" id={listId} role="listbox" aria-label="Results">
          {results.map((e, i) => (
            <li
              key={e.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              aria-disabled={e.href || e.action ? undefined : "true"}
              className="flex items-center gap-[12px] rounded-[12px] py-[9px] px-[12px] cursor-pointer aria-selected:bg-well aria-[disabled=true]:opacity-[0.45] aria-[disabled=true]:cursor-not-allowed"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(e)}
            >
              <span className="grid place-items-center flex-none w-[28px] h-[28px] rounded-[9px] bg-well text-muted">
                <Icon name={KIND_ICON[e.kind] ?? "chevR"} cls="w-[15px] h-[15px]" />
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-text">
                <Highlight text={e.label} query={needle} />
              </span>
              <small className="flex-none text-muted text-[12px]">
                {e.kind}
                {e.meta ? ` · ${e.meta}` : ""}
              </small>
            </li>
          ))}
        </ul>
      ) : busy ? (
        <p className="mt-[12px] text-muted text-[13px]" role="status">Searching</p>
      ) : (
        <EmptyState icon="search" title="No matches" text="Try another word, or a key such as PROJ-42." />
      )}
    </CenterModal>
  );
}
