import DataTable from "../ui/DataTable.jsx";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import { formatDateTime } from "../../utils/format.js";

// Audit rows are read only. Clicking a row calls onRowClick(entry) so the page can open the detail drawer.
export default function AuditTable({
  entries,
  status,
  error,
  onRetry,
  hasMore,
  onLoadMore,
  loadingMore,
  onRowClick,
  empty,
}) {
  const rows = (entries ?? []).map((e) => ({ ...e, id: e.id ?? e._id }));

  const columns = [
    {
      key: "at",
      label: "When",
      width: "180px",
      render: (e) => <span className="text-muted tabular-nums">{e.at ? formatDateTime(e.at) : "-"}</span>,
    },
    {
      key: "actor",
      label: "Actor",
      render: (e) => (
        <div className="flex min-w-0 items-center gap-[10px]">
          <Avatar name={e.actorName || "System"} size="xs" />
          <span className="truncate text-text">{e.actorName || "System"}</span>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      width: "200px",
      render: (e) => <Badge tone="plain">{e.action}</Badge>,
    },
    {
      key: "target",
      label: "Target",
      render: (e) => (
        <div className="min-w-0">
          <div className="truncate text-text">{e.targetName || "-"}</div>
          {e.targetType ? <div className="text-[12.5px] text-muted">{e.targetType}</div> : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      label="Audit log"
      columns={columns}
      rows={rows}
      rowKey="id"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      onRowClick={onRowClick}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}
