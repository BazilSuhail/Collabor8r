// feat(pages/integrations/IntegrationsPage): connect, configure and disconnect a project's code, chat and import integrations.
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import FilterChip from "../../components/ui/FilterChip.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { connectIntegration, deleteIntegration, disconnectIntegration, listIntegrations } from "../../libs/api/automation.js";
import { bindLift, cardRise, fadeUp, flip, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import IntegrationCard, { CATEGORIES, PROVIDER_BY_KEY, PROVIDERS } from "./components/IntegrationCard.jsx";
import IntegrationFormModal from "./components/IntegrationFormModal.jsx";
import IntegrationsTabs from "./components/IntegrationsTabs.jsx";

const idOf = (row) => String(row?.id ?? row?._id ?? "");
const norm = (row) => ({ ...row, id: idOf(row) });

const CATEGORY_CHIPS = ["all", ...CATEGORIES];

export default function IntegrationsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canManage = can("integration.manage");

  const integrationsQ = useResource(() => listIntegrations(projectId, { limit: 100 }), [projectId]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [busyKey, setBusyKey] = useState(null);
  const [formFor, setFormFor] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const gridRef = useRef(null);

  const ready = integrationsQ.status === "success";
  useViewEntry(
    "integrations",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.05 });
      return bindLift(root);
    },
    [ready],
  );

  // Each saved integration gets a card. Providers without one get a Connect card.
  const records = (integrationsQ.data ?? []).map(norm);
  const entries = [
    ...records.map((rec) => ({
      key: `${rec.provider}-${rec.id}`,
      provider: rec.provider,
      item: PROVIDER_BY_KEY[rec.provider] ?? { key: rec.provider, name: rec.provider, desc: "", cat: "Code", icon: "plug" },
      integration: rec,
    })),
    ...PROVIDERS.filter((p) => !records.some((r) => r.provider === p.key)).map((p) => ({
      key: `${p.key}-new`,
      provider: p.key,
      item: p,
      integration: null,
    })),
  ];

  const needle = query.trim().toLowerCase();
  const matches = (e) =>
    !needle || `${e.item.name} ${e.item.desc} ${e.item.cat} ${e.integration?.displayName ?? ""}`.toLowerCase().includes(needle);
  const counts = Object.fromEntries(
    CATEGORY_CHIPS.map((c) => [c, entries.filter((e) => matches(e) && (c === "all" || e.item.cat === c)).length]),
  );
  const visible = entries.filter((e) => matches(e) && (cat === "all" || e.item.cat === cat));

  const changeCat = (next) => flip(gridRef.current, () => flushSync(() => setCat(next)));

  const upsert = (rec) => {
    const next = norm(rec);
    integrationsQ.setData((prev) => {
      const list = prev ?? [];
      return list.some((r) => idOf(r) === next.id)
        ? list.map((r) => (idOf(r) === next.id ? { ...r, ...next } : r))
        : [...list, next];
    });
  };

  const onPrimary = async (entry) => {
    if (!entry.integration || entry.integration.status === "connected") {
      setFormFor({ provider: entry.provider, integration: entry.integration });
      return;
    }
    setBusyKey(entry.key);
    try {
      const res = await connectIntegration(projectId, entry.integration.id);
      upsert(res.data ?? { ...entry.integration, status: "connected" });
      toast.success(`Connected ${entry.item.name}`);
    } catch {
      // The API layer shows the error toast.
    } finally {
      setBusyKey(null);
    }
  };

  const menuFor = (entry) => {
    const rec = entry.integration;
    if (!rec) return null;
    const name = entry.item.name;
    return [
      { id: "configure", label: "Configure", icon: "gear", onSelect: () => setFormFor({ provider: entry.provider, integration: rec }) },
      rec.status === "connected"
        ? { id: "disconnect", label: "Disconnect", icon: "unlink", onSelect: () => setPendingConfirm({ kind: "disconnect", record: rec, name }) }
        : null,
      "separator",
      { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setPendingConfirm({ kind: "delete", record: rec, name }) },
    ].filter(Boolean);
  };

  const runConfirm = async () => {
    const { kind, record } = pendingConfirm;
    if (kind === "disconnect") {
      const res = await disconnectIntegration(projectId, record.id);
      upsert(res.data ?? { ...record, status: "disconnected" });
      toast.success("Disconnected");
      return;
    }
    await deleteIntegration(projectId, record.id);
    integrationsQ.setData((prev) => (prev ?? []).filter((r) => idOf(r) !== record.id));
    toast.success("Integration deleted");
  };

  const denied = integrationsQ.error?.status === 403;

  let body;
  if (integrationsQ.status === "loading") {
    body = (
      <div className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w760:grid-cols-[minmax(0,1fr)]">
        <Skeleton variant="cards" count={6} />
      </div>
    );
  } else if (integrationsQ.status === "error") {
    body = (
      <div className="card">
        <EmptyState
          tone="error"
          title={denied ? "Only project admins manage integrations" : integrationsQ.error?.message ?? "Could not load integrations."}
          onRetry={denied ? undefined : integrationsQ.reload}
        />
      </div>
    );
  } else if (visible.length === 0) {
    body = (
      <div className="card">
        <div className="grid justify-items-center gap-[12px]">
          <Illustration name="integrations" alt="" className="w-[180px] w1000:hidden" />
          <EmptyState icon="plug" title="No integrations match" text="Try another search or category." />
        </div>
      </div>
    );
  } else {
    body = (
      <div
        ref={gridRef}
        className="grid gap-[var(--gap)] grid-cols-[repeat(3,minmax(0,1fr))] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w760:grid-cols-[minmax(0,1fr)]"
      >
        {visible.map((e) => (
          <IntegrationCard
            key={e.key}
            cardKey={e.key}
            item={e.item}
            integration={e.integration}
            query={query.trim()}
            canManage={canManage}
            busy={busyKey === e.key}
            onPrimary={() => onPrimary(e)}
            menuItems={canManage ? menuFor(e) : null}
          />
        ))}
      </div>
    );
  }

  const confirmName = pendingConfirm?.name ?? "this integration";
  const confirmDelete = pendingConfirm?.kind === "delete";

  return (
    <>
      <PageHead
        title="Integrations"
        sub="Connect code, chat and import sources to this project. Each one links its items to issues."
      />

      <div className="toolbar">
        <IntegrationsTabs pid={projectId} active="integrations" />
        <span className="toolbar__spacer" />
        <Input
          variant="search"
          label="Search integrations"
          hideLabel
          placeholder="Search integrations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-[16px] flex flex-wrap gap-[8px]" role="group" aria-label="Filter by category">
        {CATEGORY_CHIPS.map((c) => (
          <FilterChip key={c} pressed={cat === c} count={counts[c]} onClick={() => changeCat(c)}>
            {c === "all" ? "All" : c}
          </FilterChip>
        ))}
      </div>

      {body}

      {formFor ? (
        <IntegrationFormModal
          key={`${formFor.provider}-${formFor.integration ? idOf(formFor.integration) : "new"}`}
          open
          onClose={() => setFormFor(null)}
          pid={projectId}
          provider={formFor.provider}
          integration={formFor.integration}
          onSaved={upsert}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        onClose={() => setPendingConfirm(null)}
        title={confirmDelete ? `Delete ${confirmName}?` : `Disconnect ${confirmName}?`}
        text={
          confirmDelete
            ? "Its linked items will be removed. This cannot be undone."
            : "Syncing stops until you connect it again."
        }
        confirmLabel={confirmDelete ? "Delete" : "Disconnect"}
        tone={confirmDelete ? "danger" : "default"}
        onConfirm={runConfirm}
      />
    </>
  );
}
