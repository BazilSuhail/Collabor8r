// feat(pages/risks/components/RiskFormModal): create or edit a risk with its probability, impact, owner, status and mitigation.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createRisk, updateRisk } from "../../../libs/api/planning.js";

const SCORE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "mitigating", label: "Mitigating" },
  { value: "accepted", label: "Accepted" },
  { value: "closed", label: "Closed" },
];

export default function RiskFormModal({ open, onClose, projectId, risk, members = [], onSaved }) {
  const toast = useToast();
  const ownerOptions = [
    { value: "", label: "No owner" },
    ...members.map((m) => ({ value: m.userId, label: m.userName ?? "Member" })),
  ];
  const initialValues = {
    title: risk?.title ?? "",
    category: risk?.category ?? "",
    probability: String(risk?.probability ?? 3),
    impact: String(risk?.impact ?? 3),
    status: risk?.status ?? "open",
    ownerId: risk?.ownerId ? String(risk.ownerId) : "",
    mitigation: risk?.mitigation ?? "",
  };

  const onSubmit = async (values) => {
    const body = {
      title: values.title.trim(),
      category: values.category.trim(),
      probability: Number(values.probability),
      impact: Number(values.impact),
      status: values.status,
      ownerId: values.ownerId || null,
      mitigation: values.mitigation.trim(),
    };
    const saved = risk ? await updateRisk(projectId, risk.id, body) : await createRisk(projectId, body);
    toast.success("Risk saved");
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={risk ? "Edit risk" : "New risk"}
      description="Score is probability times impact, from 1 to 25."
      size="md"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="risk" />
            Risk
          </p>
          <div className="col-span-full">
            <Input
              label="Title"
              hint="Describe the event, not its cause."
              value={values.title}
              maxLength={200}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
            />
          </div>
          <Input
            label="Category"
            hint="For example Schedule, Budget or Vendor."
            value={values.category}
            maxLength={80}
            onChange={(e) => set("category", e.target.value)}
            error={errors.category}
          />
          <Select
            label="Status"
            hint="Accepted risks are watched but not worked."
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(v) => set("status", v)}
            error={errors.status}
          />
          <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
            <Select
              label="Probability"
              hint="1 is rare, 5 is almost certain."
              value={values.probability}
              options={SCORE_OPTIONS}
              onChange={(v) => set("probability", v)}
              error={errors.probability}
            />
            <Select
              label="Impact"
              hint="1 is minor, 5 is severe."
              value={values.impact}
              options={SCORE_OPTIONS}
              onChange={(v) => set("impact", v)}
              error={errors.impact}
            />
          </div>
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="shield" />
            Response
          </p>
          <div className="col-span-full">
            <Select
              label="Owner"
              hint="The person who watches this risk."
              value={values.ownerId}
              options={ownerOptions}
              onChange={(v) => set("ownerId", v)}
              error={errors.ownerId}
            />
          </div>
          <div className="col-span-full">
            <Input
              as="textarea"
              label="Mitigation"
              hint="The steps that reduce the probability or impact."
              value={values.mitigation}
              maxLength={5000}
              onChange={(e) => set("mitigation", e.target.value)}
              error={errors.mitigation}
            />
          </div>
        </div>
      )}
    />
  );
}
