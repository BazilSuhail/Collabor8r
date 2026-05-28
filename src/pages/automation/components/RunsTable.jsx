// feat(pages/automation/components/RunsTable): list automation runs with their rule, item, result and time, and open one on click.
import DataTable from "../../../components/ui/DataTable.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { relativeTime } from "../../../utils/format.js";

const RESULT = {
  success: { tone: "spruce", label: "Success" },
  failed: { tone: "ember", label: "Failed" },
  skipped: { tone: "plain", label: "Skipped" },
};

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

export default function RunsTable({
  rows = [],
  status = "success",
  error,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onOpen,
  ruleNames = {},
  showRule = true,
  label = "Automation runs",
}) {
  const data = rows.map(withId);

  const columns = [
    ...(showRule
      ? [
          {
            key: "rule",
            label: "Rule",
            render: (row) => <span className="font-semibold text-text">{ruleNames[String(row.ruleId)] ?? "Rule"}</span>,
          },
        ]
      : []),
    {
      key: "item",
      label: "Item",
      render: (row) => (
        <span className="font-mono text-[12.5px] text-muted">
          {row.itemKey ?? (row.itemId ? `#${String(row.itemId).slice(-6)}` : "No item")}
        </span>
      ),
    },
    {
      key: "result",
      label: "Result",
      render: (row) => {
        const meta = RESULT[row.status] ?? RESULT.skipped;
        return (
          <Badge tone={meta.tone} variant="status" label={`Result: ${meta.label}`}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => <span className="tabular-nums text-muted">{row.durationMs != null ? `${row.durationMs} ms` : "—"}</span>,
    },
    {
      key: "at",
      label: "When",
      render: (row) => <span className="text-muted">{row.at ? relativeTime(row.at) : "—"}</span>,
    },
  ];

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={data}
      rowKey="id"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={{ icon: "runs", title: "No runs yet", text: "Runs appear here when a rule fires." }}
      onRowClick={onOpen}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
    />
  );
}
