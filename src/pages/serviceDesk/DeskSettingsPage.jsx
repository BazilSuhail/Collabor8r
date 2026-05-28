// feat(pages/serviceDesk/DeskSettingsPage): manage service desk customers, request types and SLA policies.
import { useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  deleteCustomer,
  deleteRequestType,
  deleteSlaPolicy,
  listCustomers,
  listRequestTypes,
  listSlaPolicies,
} from "../../libs/api/servicedesk.js";
import { paths } from "../../routes/paths.js";
import { formatDuration } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import DeskEntityModal from "./components/DeskEntityModal.jsx";

const idOf = (row) => String(row?.id ?? row?._id ?? "");
const withId = (row) => ({ ...row, id: idOf(row) });

const TABS = [
  { value: "customers", label: "Customers" },
  { value: "request-types", label: "Request types" },
  { value: "sla-policies", label: "SLA policies" },
];

const ENTITY_LABEL = { customers: "customer", "request-types": "request type", "sla-policies": "SLA policy" };
const DELETE = { customers: deleteCustomer, "request-types": deleteRequestType, "sla-policies": deleteSlaPolicy };

const EMPTY = {
  customers: { icon: "customer", title: "No customers yet", text: "Customers are the people who raise requests." },
  "request-types": { icon: "ticket", title: "No request types", text: "Request types group the requests customers can raise." },
  "sla-policies": { icon: "sla", title: "No SLA policies", text: "Policies set the response and resolution targets." },
};

const minutesText = (m) => (m == null ? "None" : formatDuration(m * 60));

export default function DeskSettingsPage() {
  const { projectId, can, types, priorities, members } = useProject();
  const toast = useToast();

  const [tab, setTab] = useState("customers");
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const customersQ = useResource(() => listCustomers(projectId, { limit: 100 }), [projectId]);
  const typesQ = useResource(() => listRequestTypes(projectId, { limit: 100 }), [projectId]);
  const policiesQ = useResource(() => listSlaPolicies(projectId, { limit: 100 }), [projectId]);

  const lists = { customers: customersQ, "request-types": typesQ, "sla-policies": policiesQ };
  const current = lists[tab];
  const ready = current.status === "success";

  useViewEntry(
    "desk-settings",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 26, stagger: 0.07 });
      return bindLift(root);
    },
    [ready],
  );

  // Customers need developer. Request types and SLA policies need lead.
  const canEdit = tab === "customers" ? can("issue.edit") : can("config.manage");

  const policies = (policiesQ.data ?? []).map(withId);
  const typeNames = Object.fromEntries((types ?? []).map((t) => [idOf(t), t.name]));
  const policyNames = Object.fromEntries(policies.map((p) => [p.id, p.name]));

  const upsert = (entity, rec) => {
    const next = withId(rec);
    lists[entity].setData((prev) => {
      const list = prev ?? [];
      return list.some((r) => idOf(r) === next.id)
        ? list.map((r) => (idOf(r) === next.id ? { ...r, ...next } : r))
        : [...list, next];
    });
  };

  const confirmDelete = async () => {
    const { entity, record } = pendingDelete;
    await DELETE[entity](projectId, idOf(record));
    lists[entity].setData((prev) => (prev ?? []).filter((r) => idOf(r) !== idOf(record)));
    toast.success("Deleted");
  };

  const rowMenu = (row) => [
    { id: "edit", label: "Edit", icon: "edit", onSelect: () => setEditor({ entity: tab, record: row }) },
    "separator",
    { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setPendingDelete({ entity: tab, record: row }) },
  ];

  const columnsFor = {
    customers: [
      {
        key: "name",
        label: "Customer",
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{row.name}</p>
            <p className="card__sub truncate">{row.email}</p>
          </div>
        ),
      },
      { key: "company", label: "Company", render: (row) => <span className="text-muted">{row.company || "—"}</span> },
      {
        key: "requestCount",
        label: "Requests",
        align: "right",
        render: (row) => <span className="tabular-nums">{row.requestCount ?? 0}</span>,
      },
    ],
    "request-types": [
      {
        key: "name",
        label: "Request type",
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{row.name}</p>
            {row.description ? <p className="card__sub truncate">{row.description}</p> : null}
          </div>
        ),
      },
      {
        key: "issueType",
        label: "Issue type",
        render: (row) => <span className="text-muted">{typeNames[String(row.issueTypeId)] ?? "—"}</span>,
      },
      {
        key: "sla",
        label: "SLA",
        render: (row) => <span className="text-muted">{policyNames[String(row.slaPolicyId)] ?? "None"}</span>,
      },
      {
        key: "approval",
        label: "Approval",
        render: (row) =>
          row.approvalRequired ? <Badge tone="iris">Required</Badge> : <Badge tone="plain">Not required</Badge>,
      },
      {
        key: "active",
        label: "Status",
        render: (row) =>
          row.isActive === false ? <Badge tone="plain">Inactive</Badge> : <Badge tone="spruce">Active</Badge>,
      },
    ],
    "sla-policies": [
      {
        key: "name",
        label: "Policy",
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{row.name}</p>
            {row.description ? <p className="card__sub truncate">{row.description}</p> : null}
          </div>
        ),
      },
      {
        key: "targets",
        label: "Targets",
        render: (row) => (
          <span className="text-muted">
            First response {minutesText(row.targets?.firstResponseMinutes)}, resolution{" "}
            {minutesText(row.targets?.resolutionMinutes)}
          </span>
        ),
      },
      {
        key: "default",
        label: "Default",
        render: (row) => (row.isDefault ? <Badge tone="saffron">Default</Badge> : <span className="text-faint">—</span>),
      },
    ],
  };

  const rows = tab === "customers" ? (customersQ.data ?? []).map(withId) : tab === "request-types" ? (typesQ.data ?? []).map(withId) : policies;

  return (
    <>
      <PageHead
        title="Desk settings"
        sub="Customers, request types and SLA policies used by the service desk."
        back={{ to: paths.desk(projectId), label: "Service desk" }}
        actions={
          canEdit ? (
            <Button variant="ember" icon="plus" onClick={() => setEditor({ entity: tab, record: null })}>
              New {ENTITY_LABEL[tab]}
            </Button>
          ) : null
        }
      />

      <div className="toolbar">
        <SegmentedControl as="tabs" label="Desk settings sections" value={tab} onChange={setTab} options={TABS} />
      </div>

      <DataTable
        label={TABS.find((t) => t.value === tab)?.label}
        columns={columnsFor[tab]}
        rows={rows}
        rowKey="id"
        status={current.status}
        error={current.error}
        onRetry={current.reload}
        empty={{
          ...EMPTY[tab],
          action: canEdit ? (
            <Button variant="ember" icon="plus" onClick={() => setEditor({ entity: tab, record: null })}>
              New {ENTITY_LABEL[tab]}
            </Button>
          ) : undefined,
        }}
        rowMenu={canEdit ? rowMenu : undefined}
      />

      {editor ? (
        <DeskEntityModal
          key={`${editor.entity}-${editor.record ? idOf(editor.record) : "new"}`}
          open
          onClose={() => setEditor(null)}
          pid={projectId}
          entity={editor.entity}
          record={editor.record}
          lookups={{ types, priorities, members, policies }}
          onSaved={(rec) => upsert(editor.entity, rec)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete ? `Delete this ${ENTITY_LABEL[pendingDelete.entity]}?` : "Delete?"}
        text={
          pendingDelete
            ? `"${pendingDelete.record.name}" will be removed. Existing requests keep their history.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
