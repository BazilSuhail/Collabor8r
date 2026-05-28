import { useToast } from "../../context/ToastContext.jsx";
import { createSprint, updateSprint } from "../../libs/api/boards.js";
import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";

const dayOf = (value) => (value ? String(value).slice(0, 10) : "");

// Creates a sprint on boardId, or edits one when sprint is given. Dates are optional and may be cleared on edit.
export default function SprintFormModal({ open, onClose, projectId, boardId, sprint = null, onSaved }) {
  const toast = useToast();
  const edit = Boolean(sprint);

  const submit = async (values) => {
    const name = values.name.trim();
    const goal = values.goal.trim();
    if (edit) {
      const res = await updateSprint(projectId, sprint.id ?? sprint._id, {
        name,
        goal,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      });
      toast.success("Saved");
      onSaved?.(res.data);
      return;
    }
    const res = await createSprint(projectId, {
      boardId,
      name,
      goal,
      ...(values.startDate ? { startDate: values.startDate } : {}),
      ...(values.endDate ? { endDate: values.endDate } : {}),
    });
    toast.success("Sprint created");
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={edit ? "Edit sprint" : "New sprint"}
      submitLabel={edit ? "Save" : "Create sprint"}
      initialValues={{
        name: sprint?.name ?? "",
        goal: sprint?.goal ?? "",
        startDate: dayOf(sprint?.startDate),
        endDate: dayOf(sprint?.endDate),
      }}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            required
            maxLength={120}
            hint="Up to 120 characters."
            className="col-span-full"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />
          <Input
            as="textarea"
            label="Goal"
            hint="Optional. What the team aims to finish in this sprint."
            className="col-span-full"
            value={values.goal}
            onChange={(e) => set("goal", e.target.value)}
            error={errors.goal}
          />
          <Input
            type="date"
            label="Start date"
            hint="Optional."
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            error={errors.startDate}
          />
          <Input
            type="date"
            label="End date"
            hint="Optional. Clear it to remove the end date."
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            error={errors.endDate}
          />
        </>
      )}
    />
  );
}
