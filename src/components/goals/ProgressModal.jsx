import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";
import { recordProgress } from "../../libs/api/reports.js";
import { useToast } from "../../context/ToastContext.jsx";

// Records the current value of a custom goal. Errors are thrown so FormModal can show them.
export default function ProgressModal({ open, onClose, projectId, goal, onSaved }) {
  const toast = useToast();

  const onSubmit = async (v) => {
    const res = await recordProgress(projectId, goal.id ?? goal._id, { current: Number(v.current) });
    toast.success("Progress recorded");
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record progress"
      description={goal ? `${goal.title}: target ${goal.target ?? 0}${goal.unit ? ` ${goal.unit}` : ""}.` : undefined}
      size="sm"
      submitLabel="Record"
      initialValues={{ current: goal ? String(goal.current ?? 0) : "0" }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full">
          <Input
            label="Current value"
            type="number"
            min="0"
            step="any"
            value={values.current}
            onChange={(e) => set("current", e.target.value)}
            error={errors.current}
            hint={goal?.metric === "custom" ? "Enter the value you have reached." : "Goals with linked work show their linked total instead."}
            required
          />
        </div>
      )}
    />
  );
}
