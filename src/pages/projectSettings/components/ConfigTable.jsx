// feat(pages/projectSettings/components/ConfigTable): list issue types, priorities, resolutions or custom fields with reorder, edit and delete actions.
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import DataTable from "../../../components/ui/DataTable.jsx";
import { cn } from "../../../utils/cn.js";

// Colour names stored on config rows map to these token backgrounds only.
export const SWATCH = {
  ember: "bg-ember",
  iris: "bg-iris",
  spruce: "bg-spruce",
  saffron: "bg-saffron",
  ink: "bg-ink",
};

const orderKey = (seg) => (seg === "priorities" ? "rank" : "sortOrder");

function Swatch({ color }) {
  return (
    <span className="inline-flex items-center gap-[8px] text-[13px] text-muted">
      <span
        aria-hidden="true"
        className={cn("inline-block h-[12px] w-[12px] rounded-[4px]", SWATCH[color] ?? "bg-well")}
      />
      {color ? color : "No colour"}
    </span>
  );
}

const detailFor = (seg, row) => {
  if (seg === "issue-types") {
    return (
      <span className="inline-flex flex-wrap items-center gap-[6px]">
        <Badge tone="iris">{row.hierarchy}</Badge>
        {row.isDefault ? <Badge tone="spruce">Default</Badge> : null}
      </span>
    );
  }
  if (seg === "priorities") {
    return (
      <span className="inline-flex flex-wrap items-center gap-[6px]">
        <Badge>Rank {row.rank}</Badge>
        {row.isDefault ? <Badge tone="spruce">Default</Badge> : null}
      </span>
    );
  }
  if (seg === "resolutions") {
    return row.countsAsDone ? <Badge tone="spruce">Counts as done</Badge> : <Badge>Still open</Badge>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-[6px]">
      <Badge tone="iris">{row.fieldType}</Badge>
      {row.required ? <Badge tone="saffron">Required</Badge> : null}
    </span>
  );
};

const COLUMN_LABEL = {
  "issue-types": "Issue type",
  priorities: "Priority",
  resolutions: "Resolution",
  "custom-fields": "Custom field",
};

export default function ConfigTable({
  seg,
  rows,
  status,
  error,
  onRetry,
  empty,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onMove,
}) {
  const key = orderKey(seg);
  const sorted = [...rows].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
  const hasColor = seg === "issue-types" || seg === "priorities";

  const columns = [
    {
      key: "order",
      label: "Order",
      width: "96px",
      render: (row) => {
        const index = sorted.findIndex((r) => r._id === row._id);
        return (
          <span className="inline-flex items-center gap-[2px]">
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="up"
              aria-label={`Move ${row.name} up`}
              disabled={!canEdit || index <= 0}
              onClick={() => onMove?.(row, -1)}
            />
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="down"
              aria-label={`Move ${row.name} down`}
              disabled={!canEdit || index >= sorted.length - 1}
              onClick={() => onMove?.(row, 1)}
            />
          </span>
        );
      },
    },
    {
      key: "name",
      label: COLUMN_LABEL[seg] ?? "Name",
      render: (row) => (
        <span className="grid gap-[2px]">
          <span className="font-semibold text-text">{row.name}</span>
          {row.description ? <span className="text-muted text-[13px]">{row.description}</span> : null}
        </span>
      ),
    },
    {
      key: "detail",
      label: "Details",
      render: (row) => detailFor(seg, row),
    },
  ];

  if (hasColor) {
    columns.push({
      key: "color",
      label: "Colour",
      render: (row) => <Swatch color={row.color ?? ""} />,
    });
  }

  const rowMenu =
    canEdit || canDelete
      ? (row) => [
          ...(canEdit ? [{ id: "edit", label: "Edit", icon: "pen", onSelect: () => onEdit?.(row) }] : []),
          ...(canDelete
            ? [{ id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => onDelete?.(row) }]
            : []),
        ]
      : undefined;

  return (
    <DataTable
      label={`${COLUMN_LABEL[seg] ?? "Config"} list`}
      rowKey="_id"
      columns={columns}
      rows={sorted}
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      rowMenu={rowMenu}
    />
  );
}
