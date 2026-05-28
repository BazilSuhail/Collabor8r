// feat(pages/releases/components/ReleaseFormModal): create or edit a release with its name, description and planned dates.
import { useToast } from "../../../context/ToastContext.jsx";
import { createRelease, updateRelease } from "../../../libs/api/boards.js";
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";

const idOf = (item) => item?.id ?? item?._id ?? null;
const dateValue = (value) => (value ? String(value).slice(0, 10) : "");

// Mounted only while open, so every opening starts from the release's current values.
export default function ReleaseFormModal({ open, onClose, projectId, release = null, onSaved }) {
  const toast = useToast();
  const edit = Boolean(release);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={edit ? "Edit release" : "New release"}
      submitLabel={edit ? "Save" : "Create release"}
      initialValues={{
        name: release?.name ?? "",
        description: release?.description ?? "",
        startDate: dateValue(release?.startDate),
        releaseDate: dateValue(release?.releaseDate),
      }}
      onSubmit={async (values) => {
        const body = {
          name: values.name.trim(),
          description: values.description.trim(),
          ...(values.startDate ? { startDate: values.startDate } : {}),
          ...(values.releaseDate ? { releaseDate: values.releaseDate } : {}),
        };
        const res = edit
          ? await updateRelease(projectId, idOf(release), body)
          : await createRelease(projectId, body);
        toast.success("Saved");
        onSaved?.(res.data);
      }}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            hint="Required. Shown on the releases list."
            wide
            required
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />
          <Input
            as="textarea"
            label="Description"
            hint="Optional. What this release includes."
            wide
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
          />
          <Input
            type="date"
            label="Start date"
            hint="Optional. When work on it begins."
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            error={errors.startDate}
          />
          <Input
            type="date"
            label="Release date"
            hint="Optional. The planned ship day."
            value={values.releaseDate}
            onChange={(e) => set("releaseDate", e.target.value)}
            error={errors.releaseDate}
          />
        </>
      )}
    />
  );
}
