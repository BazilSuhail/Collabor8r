import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";
import Highlight from "../ui/Highlight.jsx";
import { Icon } from "../ui/Icon.jsx";
import { paths } from "../../routes/paths.js";
import { cn } from "../../utils/cn.js";

const idOf = (item) => String(item?.id ?? item?._id);

// Builds parent to children lists. A page whose parent is not loaded yet is shown at the top level.
function buildChildren(pages) {
  const known = new Set(pages.map(idOf));
  const children = new Map();
  for (const page of pages) {
    const parent = page.parentId && known.has(String(page.parentId)) ? String(page.parentId) : "root";
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(page);
  }
  for (const list of children.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.title).localeCompare(String(b.title)));
  }
  return children;
}

function Branch({ pid, parentKey, children, depth, collapsed, onToggle, activeId }) {
  const list = children.get(parentKey) ?? [];
  return (
    <ul role={depth === 0 ? "tree" : "group"} className="grid gap-[2px]">
      {list.map((page) => {
        const id = idOf(page);
        const kids = children.get(id) ?? [];
        const open = !collapsed.has(id);
        const active = id === activeId;
        return (
          <li key={id} role="treeitem" aria-level={depth + 1} aria-expanded={kids.length ? open : undefined}>
            <div
              className={cn(
                "flex items-center gap-[4px] rounded-[10px] pr-[6px]",
                active ? "bg-well" : "hover:bg-surface-2",
              )}
              style={{ paddingLeft: `${depth * 16 + 4}px` }}
            >
              {kids.length ? (
                <button
                  type="button"
                  aria-label={open ? `Collapse ${page.title}` : `Expand ${page.title}`}
                  onClick={() => onToggle(id)}
                  className="ibtn ibtn--ghost ibtn--sm flex-none"
                >
                  <Icon name={open ? "down" : "chevR"} />
                </button>
              ) : (
                <span aria-hidden="true" className="inline-block w-[28px] flex-none" />
              )}
              <Link
                to={paths.wikiPage(pid, id)}
                data-tree-item=""
                aria-current={active ? "page" : undefined}
                className={cn(
                  "min-w-0 flex-1 truncate py-[7px] text-[14px] font-semibold",
                  active ? "text-text" : "text-muted hover:text-text",
                )}
              >
                {page.title}
              </Link>
            </div>
            {kids.length && open ? (
              <Branch
                pid={pid}
                parentKey={id}
                children={children}
                depth={depth + 1}
                collapsed={collapsed}
                onToggle={onToggle}
                activeId={activeId}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

// Page tree (or flat search results when query is set). Arrow keys move between visible pages.
export default function WikiList({ pid, pages = [], activeId, query = "", hasMore = false, loadingMore = false, onLoadMore }) {
  const rootRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const children = useMemo(() => buildChildren(pages), [pages]);
  const q = query.trim().toLowerCase();
  const matches = q ? pages.filter((page) => String(page.title ?? "").toLowerCase().includes(q)) : null;

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onKeyDown = (event) => {
    const items = Array.from(rootRef.current?.querySelectorAll("[data-tree-item]") ?? []);
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[Math.min(index + 1, items.length - 1)]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const more = hasMore && onLoadMore ? (
    <div className="pt-[10px]">
      <Button variant="soft" size="sm" loading={loadingMore} onClick={onLoadMore}>
        Show more
      </Button>
    </div>
  ) : null;

  if (matches) {
    return (
      <div>
        {matches.length ? (
          <ul aria-label="Matching pages" className="grid gap-[2px]">
            {matches.map((page) => {
              const id = idOf(page);
              const active = id === activeId;
              return (
                <li key={id}>
                  <Link
                    to={paths.wikiPage(pid, id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-[10px] px-[10px] py-[7px] text-[14px] font-semibold",
                      active ? "bg-well text-text" : "text-muted hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    <Highlight text={page.title} query={query} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-[10px] py-[8px] text-[14px] text-muted">No pages match this search.</p>
        )}
        {more}
      </div>
    );
  }

  return (
    <div ref={rootRef} onKeyDown={onKeyDown}>
      <Branch
        pid={pid}
        parentKey="root"
        children={children}
        depth={0}
        collapsed={collapsed}
        onToggle={toggle}
        activeId={activeId}
      />
      {more}
    </div>
  );
}
