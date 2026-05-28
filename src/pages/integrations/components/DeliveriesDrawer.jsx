// feat(pages/integrations/components/DeliveriesDrawer): list a webhook's recent deliveries and redeliver one.
import Badge from "../../../components/ui/Badge.jsx";
import DataTable from "../../../components/ui/DataTable.jsx";
import SideModal from "../../../components/ui/SideModal.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { listDeliveries, redeliver } from "../../../libs/api/automation.js";
import { relativeTime } from "../../../utils/format.js";
import { usePaged } from "../../../utils/usePaged.js";

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

const TONE = { success: "spruce", failed: "ember" };
const label = (status) => (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending");

// Mount with key={webhook.id} so the list refetches for each webhook.
export default function DeliveriesDrawer({ open, onClose, pid, webhook }) {
  const toast = useToast();
  const deliveriesQ = usePaged((q) => listDeliveries(pid, webhook.id, q), {});
  const rows = deliveriesQ.items.map(withId);

  const onRedeliver = async (row) => {
    await redeliver(pid, webhook.id, row.id);
    toast.success("Redelivered");
    deliveriesQ.reload();
  };

  const columns = [
    {
      key: "event",
      label: "Event",
      render: (row) => <span className="font-mono text-[12.5px] text-text">{row.event ?? "ping"}</span>,
    },
    {
      key: "status",
      label: "Result",
      render: (row) => (
        <Badge tone={TONE[row.status] ?? "plain"} variant="status" label={`Result: ${label(row.status)}`}>
          {label(row.status)}
        </Badge>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (row) => <span className="tabular-nums text-muted">{row.responseCode ?? "—"}</span>,
    },
    {
      key: "attempts",
      label: "Attempts",
      align: "right",
      render: (row) => <span className="tabular-nums">{row.attempts ?? 0}</span>,
    },
    {
      key: "at",
      label: "When",
      render: (row) => <span className="text-muted">{row.createdAt ? relativeTime(row.createdAt) : "—"}</span>,
    },
  ];

  return (
    <SideModal open={open} onClose={onClose} title="Deliveries" subtitle={webhook.url} side="right" size="lg">
      <DataTable
        label={`Deliveries for ${webhook.name}`}
        columns={columns}
        rows={rows}
        rowKey="id"
        status={deliveriesQ.status}
        error={deliveriesQ.error}
        onRetry={deliveriesQ.reload}
        empty={{
          icon: "send",
          title: "No deliveries yet",
          text: "Deliveries appear after an event or a test ping.",
        }}
        rowMenu={(row) => [{ id: "redeliver", label: "Redeliver", icon: "restore", onSelect: () => onRedeliver(row) }]}
        hasMore={deliveriesQ.hasMore}
        onLoadMore={deliveriesQ.loadMore}
        loadingMore={deliveriesQ.loadingMore}
      />
    </SideModal>
  );
}
