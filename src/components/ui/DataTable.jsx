import { useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { fadeUp, flip, useEntry } from "../../utils/motion.js";
import { cn } from "../../utils/cn.js";
import Button from "./Button.jsx";
import Dropdown from "./Dropdown.jsx";
import EmptyState from "./EmptyState.jsx";
import Skeleton from "./Skeleton.jsx";
import SortHeader from "./SortHeader.jsx";
import { Icon } from "./Icon.jsx";

const cssEscape = (value) => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value);

// Table in a card. Loading shows Skeleton rows, error and empty show
// EmptyState (no table). Sorting is client-side on loaded rows (caller passes
// sort and onSort). Entry follows F.8.
export default function DataTable({
  columns,
  rows = [],
  rowKey = "id",
  status = "success",
  error,
  onRetry,
  empty,
  sort,
  onSort,
  onRowClick,
  rowMenu,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  selectable = false,
  selected = [],
  onSelect,
  label,
}) {
  const bodyRef = useRef(null);
  const prevKeys = useRef(new Set());
  const colCount = columns.length + (selectable ? 1 : 0) + (rowMenu ? 1 : 0);
  const keyOf = (row) => row[rowKey];

  useEntry(
    bodyRef,
    ({ q }) => {
      const trs = q("tr[data-key]");
      if (!trs.length) return;
      fadeUp(trs.slice(0, 14), { y: 10, stagger: 0.035, delay: 0.14 });
      if (trs.length > 14) fadeUp(trs.slice(14), { y: 10, stagger: 0, delay: 0.6 });
    },
    [status === "success"],
  );

  // Fresh rows (load more, insert) fade in. Rows that stay do not move here.
  useLayoutEffect(() => {
    const keys = rows.map((r) => String(keyOf(r)));
    const prev = prevKeys.current;
    prevKeys.current = new Set(keys);
    if (status !== "success" || prev.size === 0 || !bodyRef.current) return;
    const fresh = keys
      .filter((k) => !prev.has(k))
      .map((k) => bodyRef.current.querySelector(`tr[data-key="${cssEscape(k)}"]`))
      .filter(Boolean);
    if (fresh.length) fadeUp(fresh, { y: 10, stagger: 0.02 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, status]);

  const handleSort = (key) => {
    flip(bodyRef.current, () => flushSync(() => onSort?.(key)));
  };

  const toggleAll = (checked) => {
    if (!onSelect) return;
    onSelect(checked ? rows.map(keyOf) : []);
  };

  const toggleOne = (key, checked) => {
    if (!onSelect) return;
    onSelect(checked ? [...selected, key] : selected.filter((k) => k !== key));
  };

  if (status === "error") {
    return (
      <div className="card">
        <EmptyState tone="error" title={error?.message ?? "Could not load these items."} onRetry={onRetry} />
      </div>
    );
  }

  if (status === "success" && rows.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={empty?.icon}
          title={empty?.title ?? "Nothing here yet"}
          text={empty?.text}
          action={empty?.action}
        />
      </div>
    );
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(keyOf(r)));

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tbl" aria-label={label} aria-busy={status === "loading" || loadingMore || undefined}>
          <thead>
            <tr>
              {selectable ? (
                <th className="w-[40px]">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    disabled={status === "loading"}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
              ) : null}
              {columns.map((col) =>
                col.sortable ? (
                  <SortHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    sort={sort}
                    onSort={handleSort}
                    className={cn(col.align === "right" && "r")}
                    style={col.width ? { width: col.width } : undefined}
                  />
                ) : (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(col.align === "right" && "r")}
                  >
                    {col.label}
                  </th>
                ),
              )}
              {rowMenu ? (
                <th className="w-[48px]">
                  <span className="sr">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          {status === "loading" ? (
            <Skeleton variant="rows" count={6} cols={colCount} />
          ) : (
            <tbody ref={bodyRef}>
              {rows.map((row) => {
                const key = keyOf(row);
                const isSel = selected.includes(key);
                return (
                  <tr
                    key={String(key)}
                    data-key={String(key)}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-selected={selectable ? isSel : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" && e.target === e.currentTarget) {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn("hover:bg-surface-2 transition-colors", onRowClick && "cursor-pointer")}
                  >
                    {selectable ? (
                      <td className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={isSel}
                          onChange={(e) => toggleOne(key, e.target.checked)}
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(col.align === "right" && "r")}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {rowMenu ? (
                      <td
                        className="w-[48px] text-right"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Dropdown
                          label="Row actions"
                          items={rowMenu(row)}
                          trigger={(p) => (
                            <Button
                              iconOnly
                              variant="ghost"
                              size="sm"
                              icon="more"
                              aria-label="Row actions"
                              {...p}
                            />
                          )}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
      {hasMore ? (
        <div className="flex justify-center py-[12px] border-t border-line">
          <Button variant="soft" size="sm" loading={loadingMore} disabled={loadingMore} onClick={onLoadMore}>
            <Icon name="down" />
            Show more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
