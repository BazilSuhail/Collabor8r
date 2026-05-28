// feat(pages/budget/components/BudgetLineModal): create or edit a budget line with its category, planned and forecast amounts and currency.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createBudgetLine, updateBudgetLine } from "../../../libs/api/planning.js";

const amountText = (value) => (value === undefined || value === null ? "" : String(value));

const optionalAmount = (text) => (text.trim() === "" ? undefined : Number(text));

export default function BudgetLineModal({ open, onClose, projectId, line, onSaved }) {
  const toast = useToast();
  const initialValues = {
    name: line?.name ?? "",
    category: line?.category ?? "",
    planned: amountText(line?.planned ?? 0),
    forecast: amountText(line?.forecast ?? 0),
    currency: line?.currency ?? "USD",
  };

  const onSubmit = async (values) => {
    const body = {
      name: values.name.trim(),
      category: values.category.trim(),
      planned: optionalAmount(values.planned) ?? 0,
      forecast: optionalAmount(values.forecast) ?? 0,
      currency: values.currency.trim().toUpperCase(),
    };
    const saved = line
      ? await updateBudgetLine(projectId, line.lineId, body)
      : await createBudgetLine(projectId, body);
    toast.success("Line saved");
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={line ? "Edit budget line" : "New budget line"}
      description="Planned is the approved amount. Forecast is your current estimate."
      size="md"
      submitLabel="Save line"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="budget" />
            Line
          </p>
          <div className="col-span-full">
            <Input
              label="Name"
              hint="The name the team sees on the budget, up to 200 characters."
              value={values.name}
              maxLength={200}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
            />
          </div>
          <Input
            label="Category"
            hint="For example Travel or Equipment."
            value={values.category}
            maxLength={80}
            onChange={(e) => set("category", e.target.value)}
            error={errors.category}
          />
          <Input
            label="Currency"
            hint="Three letters, for example USD."
            value={values.currency}
            maxLength={3}
            onChange={(e) => set("currency", e.target.value)}
            error={errors.currency}
          />
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="dollar" />
            Amounts
          </p>
          <Input
            label="Planned"
            hint="The approved amount. Zero when blank."
            type="number"
            min="0"
            step="0.01"
            value={values.planned}
            onChange={(e) => set("planned", e.target.value)}
            error={errors.planned}
          />
          <Input
            label="Forecast"
            hint="Your current estimate. Zero when blank."
            type="number"
            min="0"
            step="0.01"
            value={values.forecast}
            onChange={(e) => set("forecast", e.target.value)}
            error={errors.forecast}
          />
        </div>
      )}
    />
  );
}
