import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import { createGoal, updateGoal } from "../../libs/api/reports.js";
import { useToast } from "../../context/ToastContext.jsx";
import { METRIC_LABEL } from "./GoalCard.jsx";

const METRIC_OPTIONS = Object.entries(METRIC_LABEL).map(([value, label]) => ({ value, label }));

// Create or edit a goal. goal is null to create. Errors are thrown so FormModal can show them.
export default function GoalFormModal({ open, onClose, projectId, goal, onSaved }) {
  const toast = useToast();
  const initialValues = {
    title: goal?.title ?? "",
    metric: goal?.metric ?? "itemCount",
    target: goal ? String(goal.target ?? 0) : "",
    unit: goal?.unit ?? "",
    dueDate: goal?.dueDate ? String(goal.dueDate).slice(0, 10) : "",
  };

  const onSubmit = async (v) => {
    const body = {
      title: v.title.trim(),
      metric: v.metric,
      target: Number(v.target),
      unit: v.unit.trim(),
      dueDate: v.dueDate ? new Date(`${v.dueDate}T00:00:00Z`).toISOString() : null,
    };
    const res = goal ? await updateGoal(projectId, goal.id ?? goal._id, body) : await createGoal(projectId, body);
    toast.success("Goal saved");
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={goal ? "Edit goal" : "New goal"}
      description="A number the project works toward. Linked work moves it on its own."
      submitLabel={goal ? "Save goal" : "Create goal"}
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <div className="col-span-full">
            <Input
              label="Name"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
              hint="Short and specific, up to 200 characters."
              required
              maxLength={200}
            />
          </div>
          <Select
            label="Metric"
            value={values.metric}
            onChange={(v) => set("metric", v)}
            options={METRIC_OPTIONS}
            error={errors.metric}
            hint="What the target counts. Linked work updates it."
          />
          <Input
            label="Target"
            type="number"
            min="0"
            step="any"
            value={values.target}
            onChange={(e) => set("target", e.target.value)}
            error={errors.target}
            hint="Required. The number the goal works toward."
            required
          />
          <Input
            label="Unit"
            value={values.unit}
            onChange={(e) => set("unit", e.target.value)}
            error={errors.unit}
            hint="Shown after the numbers, for example h or pts."
            maxLength={30}
          />
          <Input
            label="Due date"
            type="date"
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            error={errors.dueDate}
            hint="Optional. Leave empty for no deadline."
          />
        </>
      )}
    />
  );
}
