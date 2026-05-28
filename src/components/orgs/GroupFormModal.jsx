import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";

// Create or edit an org group. group is null for create. onSubmit(values) belongs to the page and throws on failure.
export default function GroupFormModal({ open, onClose, group, onSubmit }) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={group ? "Edit group" : "New group"}
      submitLabel={group ? "Save" : "Create group"}
      initialValues={{ name: group?.name ?? "", description: group?.description ?? "" }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            wide
            label="Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            hint="Shown to admins when they manage members."
          />
          <Input
            wide
            as="textarea"
            label="Description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            hint="Optional. Say who belongs in this group."
          />
        </>
      )}
    />
  );
}
