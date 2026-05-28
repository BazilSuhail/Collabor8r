import DataTable from "../ui/DataTable.jsx";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import RoleSelect, { roleLabel } from "./RoleSelect.jsx";
import { formatDate } from "../../utils/format.js";

// Member table. Admins change roles inline and remove others. Every member can leave from their own row.
// Mutations live in the page: onRoleChange(member, role), onRemove(member), onLeave(member).
export default function MemberList({
  members,
  status,
  error,
  onRetry,
  scope = "org",
  roles,
  canManage,
  selfId,
  onRoleChange,
  onRemove,
  onLeave,
  empty,
  hasMore,
  onLoadMore,
  loadingMore,
}) {
  const columns = [
    {
      key: "person",
      label: "Person",
      render: (m) => (
        <div className="flex min-w-0 items-center gap-[12px]">
          <Avatar name={m.userName} src={m.userAvatar} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-text">{m.userName || "Unnamed"}</div>
            {m.userHeadline ? <div className="truncate text-[12.5px] text-muted">{m.userHeadline}</div> : null}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      width: "220px",
      render: (m) =>
        canManage && m.userId !== selfId ? (
          <RoleSelect
            scope={scope}
            roles={roles}
            hideLabel
            label={`Role for ${m.userName || "member"}`}
            size="sm"
            value={m.role}
            onChange={(role) => onRoleChange?.(m, role)}
          />
        ) : (
          <Badge tone="plain">{roleLabel(m.role)}</Badge>
        ),
    },
    {
      key: "joined",
      label: "Joined",
      width: "140px",
      render: (m) => <span className="text-muted">{m.joinedAt ? formatDate(m.joinedAt) : "-"}</span>,
    },
  ];

  const rowMenu = (m) => {
    const items = [];
    if (m.userId === selfId) {
      items.push({ id: "leave", label: "Leave", icon: "logout", danger: true, onSelect: () => onLeave?.(m) });
    } else if (canManage) {
      items.push({ id: "remove", label: "Remove", icon: "userMinus", danger: true, onSelect: () => onRemove?.(m) });
    }
    return items;
  };

  return (
    <DataTable
      label="Members"
      columns={columns}
      rows={members ?? []}
      rowKey="userId"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      rowMenu={rowMenu}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}
