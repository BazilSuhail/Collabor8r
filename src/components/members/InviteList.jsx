import DataTable from "../ui/DataTable.jsx";
import Badge from "../ui/Badge.jsx";
import { roleLabel } from "./RoleSelect.jsx";
import { formatDate } from "../../utils/format.js";

const STATUS_TONE = { pending: "iris", accepted: "spruce", revoked: "plain", expired: "saffron" };

// Invite table. Only pending invites can be revoked. onRevoke(invite) is handled by the page.
export default function InviteList({ invites, status, error, onRetry, canManage, onRevoke, empty }) {
  const columns = [
    { key: "email", label: "Email", render: (i) => <span className="font-semibold text-text break-all">{i.email}</span> },
    { key: "role", label: "Role", width: "160px", render: (i) => <Badge tone="plain">{roleLabel(i.role)}</Badge> },
    {
      key: "status",
      label: "Status",
      width: "130px",
      render: (i) => <Badge tone={STATUS_TONE[i.status] ?? "plain"}>{i.status}</Badge>,
    },
    {
      key: "expires",
      label: "Expires",
      width: "140px",
      render: (i) => <span className="text-muted">{i.expiresAt ? formatDate(i.expiresAt) : "-"}</span>,
    },
  ];

  const rowMenu = (i) =>
    canManage && i.status === "pending"
      ? [{ id: "revoke", label: "Revoke invite", icon: "close", danger: true, onSelect: () => onRevoke?.(i) }]
      : [];

  return (
    <DataTable
      label="Invites"
      columns={columns}
      rows={invites ?? []}
      rowKey="id"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      rowMenu={rowMenu}
    />
  );
}
