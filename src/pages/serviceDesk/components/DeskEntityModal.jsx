// feat(pages/serviceDesk/components/DeskEntityModal): create or edit a service desk customer, request type or SLA policy.
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import {
  createCustomer,
  createRequestType,
  createSlaPolicy,
  updateCustomer,
  updateRequestType,
  updateSlaPolicy,
} from "../../../libs/api/servicedesk.js";

const idOf = (row) => String(row?.id ?? row?._id ?? "");
const NONE = "";

const ENTITY = {
  customers: { label: "customer", create: createCustomer, update: updateCustomer },
  "request-types": { label: "request type", create: createRequestType, update: updateRequestType },
  "sla-policies": { label: "SLA policy", create: createSlaPolicy, update: updateSlaPolicy },
};

// Drops empty optional strings so the server keeps its defaults.
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined));
const minutes = (v) => (v === "" || v == null ? null : Number(v));

const initialFor = (entity, record) => {
  if (entity === "customers") {
    return {
      name: record?.name ?? "",
      email: record?.email ?? "",
      company: record?.company ?? "",
      phone: record?.phone ?? "",
      notes: record?.notes ?? "",
    };
  }
  if (entity === "request-types") {
    return {
      name: record?.name ?? "",
      description: record?.description ?? "",
      issueTypeId: record?.issueTypeId ? idOf({ id: record.issueTypeId }) : "",
      slaPolicyId: record?.slaPolicyId ? idOf({ id: record.slaPolicyId }) : NONE,
      defaultPriorityId: record?.defaultPriorityId ? idOf({ id: record.defaultPriorityId }) : NONE,
      approverIds: (record?.approverIds ?? []).map((id) => idOf({ id })),
      approvalRequired: Boolean(record?.approvalRequired),
      isActive: record ? Boolean(record.isActive) : true,
    };
  }
  return {
    name: record?.name ?? "",
    description: record?.description ?? "",
    firstResponseMinutes: record?.targets?.firstResponseMinutes ?? "",
    resolutionMinutes: record?.targets?.resolutionMinutes ?? "",
    isDefault: Boolean(record?.isDefault),
  };
};

const bodyFor = (entity, v) => {
  if (entity === "customers") {
    return compact({
      name: v.name.trim(),
      email: v.email.trim(),
      company: v.company.trim(),
      phone: v.phone.trim(),
      notes: v.notes.trim(),
    });
  }
  if (entity === "request-types") {
    return compact({
      name: v.name.trim(),
      description: v.description.trim(),
      issueTypeId: v.issueTypeId,
      slaPolicyId: v.slaPolicyId || null,
      defaultPriorityId: v.defaultPriorityId || null,
      approverIds: v.approverIds,
      approvalRequired: v.approvalRequired,
      isActive: v.isActive,
    });
  }
  return compact({
    name: v.name.trim(),
    description: v.description.trim(),
    targets: {
      firstResponseMinutes: minutes(v.firstResponseMinutes),
      resolutionMinutes: minutes(v.resolutionMinutes),
    },
    isDefault: v.isDefault,
  });
};

// lookups: { types, priorities, members, policies } from the project context and the SLA list.
export default function DeskEntityModal({ open, onClose, pid, entity, record, lookups, onSaved }) {
  const toast = useToast();
  const config = ENTITY[entity];
  if (!config) return null;
  const editing = Boolean(record);
  const { types = [], priorities = [], members = [], policies = [] } = lookups ?? {};

  const submit = async (values) => {
    const body = bodyFor(entity, values);
    const res = editing ? await config.update(pid, idOf(record), body) : await config.create(pid, body);
    toast.success("Saved");
    onSaved?.(res.data);
  };

  const typeOptions = types.map((t) => ({ value: idOf(t), label: t.name }));
  const policyOptions = [{ value: NONE, label: "No SLA policy" }, ...policies.map((p) => ({ value: idOf(p), label: p.name }))];
  const priorityOptions = [
    { value: NONE, label: "Project default" },
    ...priorities.map((p) => ({ value: idOf(p), label: p.name })),
  ];
  const memberOptions = members.map((m) => ({
    value: String(m.userId ?? m.id ?? ""),
    label: m.displayName ?? m.user?.displayName ?? m.name ?? String(m.userId ?? m.id ?? ""),
  }));

  const fields = ({ values, set, errors }) => {
    if (entity === "customers") {
      return (
        <>
          <div className="col-span-full">
            <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required maxLength={120} />
          </div>
          <div className="col-span-full">
            <Input label="Email" type="email" hint="Required. Used to contact this customer." value={values.email} onChange={(e) => set("email", e.target.value)} error={errors.email} required />
          </div>
          <Input label="Company" hint="Optional." value={values.company} onChange={(e) => set("company", e.target.value)} error={errors.company} />
          <Input label="Phone" type="tel" hint="Optional." value={values.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
          <div className="col-span-full">
            <Input as="textarea" label="Notes" hint="Optional. Notes about this customer." value={values.notes} onChange={(e) => set("notes", e.target.value)} error={errors.notes} />
          </div>
        </>
      );
    }

    if (entity === "request-types") {
      return (
        <>
          <div className="col-span-full">
            <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required maxLength={120} />
          </div>
          <div className="col-span-full">
            <Input as="textarea" label="Description" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
          </div>
          <Select label="Issue type" options={typeOptions} value={values.issueTypeId} onChange={(value) => set("issueTypeId", value)} error={errors.issueTypeId} required placeholder="Choose a type" />
          <Select label="SLA policy" hint="Sets the response and resolution targets." options={policyOptions} value={values.slaPolicyId} onChange={(value) => set("slaPolicyId", value)} error={errors.slaPolicyId} />
          <Select label="Default priority" hint="Optional. Used when a request has no priority." options={priorityOptions} value={values.defaultPriorityId} onChange={(value) => set("defaultPriorityId", value)} error={errors.defaultPriorityId} />
          <Select label="Approvers" hint="People who sign off before work starts." multiple searchable options={memberOptions} value={values.approverIds} onChange={(value) => set("approverIds", value)} error={errors.approverIds} placeholder="Choose approvers" />
          <div className="col-span-full flex flex-wrap gap-[20px]">
            <Switch checked={values.approvalRequired} onChange={(v) => set("approvalRequired", v)} label="Approval required" />
            <Switch checked={values.isActive} onChange={(v) => set("isActive", v)} label="Active" />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="col-span-full">
          <Input label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required maxLength={120} />
        </div>
        <div className="col-span-full">
          <Input as="textarea" label="Description" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        </div>
        <Input label="First response (minutes)" type="number" min="0" hint="Blank for no target" value={values.firstResponseMinutes} onChange={(e) => set("firstResponseMinutes", e.target.value)} error={errors["targets.firstResponseMinutes"]} />
        <Input label="Resolution (minutes)" type="number" min="0" hint="Blank for no target" value={values.resolutionMinutes} onChange={(e) => set("resolutionMinutes", e.target.value)} error={errors["targets.resolutionMinutes"]} />
        <div className="col-span-full">
          <Switch checked={values.isDefault} onChange={(v) => set("isDefault", v)} label="Default policy for new requests" />
        </div>
      </>
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${config.label}` : `New ${config.label}`}
      submitLabel="Save"
      initialValues={initialFor(entity, record)}
      onSubmit={submit}
      fields={fields}
    />
  );
}
