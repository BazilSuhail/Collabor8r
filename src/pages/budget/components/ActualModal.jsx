// feat(pages/budget/components/ActualModal): record one actual spend against a budget line with amount, date, vendor and note.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createActual } from "../../../libs/api/planning.js";

const todayText = () => new Date().toISOString().slice(0, 10);

export default function ActualModal({ open, onClose, projectId, lines = [], defaultLineId = "", onSaved }) {
  const toast = useToast();
  const lineOptions = lines.map((l) => ({ value: l.lineId, label: l.name }));
  const initialValues = {
    budgetLineId: defaultLineId || lines[0]?.lineId || "",
    amount: "",
    incurredOn: todayText(),
    vendor: "",
    description: "",
  };

  const onSubmit = async (values) => {
    const body = {
      budgetLineId: values.budgetLineId,
      amount: Number(values.amount),
      incurredOn: values.incurredOn,
      vendor: values.vendor.trim(),
      description: values.description.trim(),
    };
    const saved = await createActual(projectId, body);
    toast.success("Actual recorded");
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record actual"
      description="Spend that has already happened, against one budget line."
      size="md"
      submitLabel="Record actual"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="coins" />
            Spend
          </p>
          <div className="col-span-full">
            <Select
              label="Budget line"
              hint="The line this spend is charged to."
              value={values.budgetLineId}
              options={lineOptions}
              placeholder="Pick a line"
              onChange={(v) => set("budgetLineId", v)}
              error={errors.budgetLineId}
            />
          </div>
          <Input
            label="Amount"
            hint="Enter the amount in the line currency."
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={errors.amount}
          />
          <Input
            label="Date"
            hint="When the cost was incurred."
            type="date"
            value={values.incurredOn}
            onChange={(e) => set("incurredOn", e.target.value)}
            error={errors.incurredOn}
          />
          <Input
            label="Vendor"
            hint="Who was paid. Optional."
            value={values.vendor}
            maxLength={200}
            onChange={(e) => set("vendor", e.target.value)}
            error={errors.vendor}
          />
          <div className="col-span-full">
            <Input
              as="textarea"
              label="Note"
              hint="What the spend was for. Up to 1000 characters."
              value={values.description}
              maxLength={1000}
              onChange={(e) => set("description", e.target.value)}
              error={errors.description}
            />
          </div>
        </div>
      )}
    />
  );
}
