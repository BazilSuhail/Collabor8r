// feat(pages/integrations/WebhooksPage): manage a project's webhooks, send test pings and redeliver failed deliveries.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Switch from "../../components/ui/Switch.jsx";
import SecretRevealModal from "../../components/shared/SecretRevealModal.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteWebhook, listWebhooks, testWebhook, updateWebhook } from "../../libs/api/automation.js";
import { emptyCopy } from "../../metadata/empty.js";
import { relativeTime } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import DeliveriesDrawer from "./components/DeliveriesDrawer.jsx";
import IntegrationsTabs from "./components/IntegrationsTabs.jsx";
import WebhookFormModal from "./components/WebhookFormModal.jsx";

const idOf = (row) => String(row?.id ?? row?._id ?? "");
const withId = (row) => ({ ...row, id: idOf(row) });

// The signing secret is returned once on create and never listed again.
const withoutSecret = (hook) => {
  const { secret: _secret, ...listed } = hook;
  return listed;
};

function LastDelivery({ hook }) {
  if (hook.lastStatus == null) return <Badge tone="plain">No deliveries</Badge>;
  const code = Number(hook.lastStatus);
  const ok = code >= 200 && code < 300;
  return (
    <span className="inline-flex flex-wrap items-center gap-[8px] text-muted">
      <Badge tone={ok ? "spruce" : "ember"} variant="status" label={`Last response ${hook.lastStatus}`}>
        {hook.lastStatus}
      </Badge>
      {hook.lastDeliveredAt ? <span>{relativeTime(hook.lastDeliveredAt)}</span> : null}
    </span>
  );
}

export default function WebhooksPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canManage = can("webhook.manage");

  const hooksQ = usePaged((q) => listWebhooks(projectId, q), {});
  const hooks = hooksQ.items.map(withId);
  const ready = hooksQ.status === "success";

  const [form, setForm] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  useViewEntry(
    "webhooks",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  const setActive = (id, active) =>
    hooksQ.setItems((prev) => prev.map((h) => (idOf(h) === id ? { ...h, active } : h)));

  const applyActive = async (id, active) => {
    setActive(id, active);
    await updateWebhook(projectId, id, { active });
  };

  const onToggle = async (hook) => {
    const before = Boolean(hook.active);
    const next = !before;
    setPendingId(hook.id);
    try {
      await applyActive(hook.id, next);
      toast.success(next ? "Webhook turned on" : "Webhook turned off", {
        undo: async () => {
          try {
            await applyActive(hook.id, before);
          } catch {
            setActive(hook.id, next);
          }
        },
      });
    } catch {
      setActive(hook.id, before);
    } finally {
      setPendingId(null);
    }
  };

  const onPing = async (hook) => {
    const res = await testWebhook(projectId, hook.id);
    const code = res.data?.responseCode;
    if ((code != null && code >= 400) || res.data?.error) {
      toast.warning("Ping sent, but the endpoint did not accept it.");
    } else {
      toast.success("Ping sent");
    }
  };

  const confirmDelete = async () => {
    await deleteWebhook(projectId, pendingDelete.id);
    hooksQ.setItems((prev) => prev.filter((h) => idOf(h) !== pendingDelete.id));
    toast.success("Webhook deleted");
  };

  const onCreated = (hook) => {
    hooksQ.setItems((prev) => [withId(withoutSecret(hook)), ...prev]);
    if (hook.secret) setRevealed({ name: hook.name, value: hook.secret });
  };

  const onSaved = (hook) => {
    hooksQ.setItems((prev) => prev.map((h) => (idOf(h) === idOf(hook) ? { ...h, ...withoutSecret(hook) } : h)));
  };

  const columns = [
    {
      key: "name",
      label: "Webhook",
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-text truncate">{row.name}</p>
          <p className="card__sub break-all">{row.url}</p>
        </div>
      ),
    },
    {
      key: "events",
      label: "Events",
      render: (row) => <Badge tone="plain">{`${row.events?.length ?? 0} events`}</Badge>,
    },
    {
      key: "active",
      label: "Active",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch
            checked={Boolean(row.active)}
            disabled={!canManage || pendingId === row.id}
            onChange={() => onToggle(row)}
            label={`Active for ${row.name}`}
            hideLabel
          />
        </span>
      ),
    },
    {
      key: "last",
      label: "Last delivery",
      render: (row) => <LastDelivery hook={row} />,
    },
  ];

  const rowMenu = (row) => [
    { id: "edit", label: "Edit webhook", icon: "edit", onSelect: () => setForm({ webhook: row }) },
    { id: "ping", label: "Send ping", icon: "send", onSelect: () => onPing(row) },
    { id: "deliveries", label: "Deliveries", icon: "history", onSelect: () => setDeliveriesFor(row) },
    "separator",
    { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setPendingDelete(row) },
  ];

  return (
    <>
      <PageHead
        title="Webhooks"
        sub="Send project events to other systems. Each request is signed with the webhook's secret."
        actions={
          canManage ? (
            <Button variant="ember" icon="plus" onClick={() => setForm({ webhook: null })}>
              New webhook
            </Button>
          ) : null
        }
      />

      <div className="toolbar">
        <IntegrationsTabs pid={projectId} active="webhooks" />
      </div>

      <DataTable
        label="Webhooks"
        columns={columns}
        rows={hooks}
        rowKey="id"
        status={hooksQ.status}
        error={hooksQ.error}
        onRetry={hooksQ.reload}
        empty={{
          ...emptyCopy("webhooks"),
          action: canManage ? (
            <Button variant="ember" icon="plus" onClick={() => setForm({ webhook: null })}>
              New webhook
            </Button>
          ) : undefined,
        }}
        rowMenu={canManage ? rowMenu : undefined}
        hasMore={hooksQ.hasMore}
        onLoadMore={hooksQ.loadMore}
        loadingMore={hooksQ.loadingMore}
      />

      {form ? (
        <WebhookFormModal
          key={form.webhook ? idOf(form.webhook) : "new"}
          open
          onClose={() => setForm(null)}
          pid={projectId}
          webhook={form.webhook}
          onSaved={onSaved}
          onCreated={onCreated}
        />
      ) : null}

      <SecretRevealModal
        open={Boolean(revealed)}
        onClose={() => setRevealed(null)}
        title="Signing secret"
        description={revealed ? `Copy the secret for ${revealed.name} now. It is shown once and cannot be read again.` : ""}
        label="Signing secret"
        value={revealed?.value ?? ""}
      />

      {deliveriesFor ? (
        <DeliveriesDrawer
          key={deliveriesFor.id}
          open
          onClose={() => setDeliveriesFor(null)}
          pid={projectId}
          webhook={deliveriesFor}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this webhook?"
        text={pendingDelete ? `"${pendingDelete.name}" stops receiving events and its deliveries are removed.` : ""}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
