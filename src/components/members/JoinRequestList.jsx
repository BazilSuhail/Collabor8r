import DataTable from "../ui/DataTable.jsx";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import { relativeTime } from "../../utils/format.js";

const STATUS_TONE = { pending: "iris", approved: "spruce", declined: "plain" };

// Join request table. onDecide(request, decision) opens the page's decision form with that preset.
export default function JoinRequestList({ requests, status, error, onRetry, canDecide, onDecide, empty }) {
  const columns = [
    {
      key: "person",
      label: "Person",
      render: (r) => (
        <div className="flex min-w-0 items-center gap-[12px]">
          <Avatar name={r.userName} src={r.userAvatar} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-text">{r.userName || "Unnamed"}</div>
            {r.message ? <div className="truncate text-[12.5px] text-muted">{r.message}</div> : null}
          </div>
        </div>
      ),
    },
    {
      key: "requested",
      label: "Requested",
      width: "140px",
      render: (r) => <span className="text-muted">{r.createdAt ? relativeTime(r.createdAt) : "-"}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: "130px",
      render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "plain"}>{r.status}</Badge>,
    },
  ];

  const rowMenu = (r) =>
    canDecide && r.status === "pending"
      ? [
          { id: "approve", label: "Approve", icon: "userCheck", onSelect: () => onDecide?.(r, "approve") },
          { id: "decline", label: "Decline", icon: "close", danger: true, onSelect: () => onDecide?.(r, "decline") },
        ]
      : [];

  return (
    <DataTable
      label="Join requests"
      columns={columns}
      rows={requests ?? []}
      rowKey="id"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      rowMenu={rowMenu}
    />
  );
}
