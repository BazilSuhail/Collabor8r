import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";

// Create an organization. The server derives the slug from the name, so no slug field is sent.
// onSubmit(values) belongs to the page and throws on failure so the modal stays open.
export default function OrgFormModal({ open, onClose, onSubmit }) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New organization"
      description="Members can be invited once the organization exists."
      submitLabel="Create organization"
      initialValues={{ name: "", description: "" }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            wide
            label="Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            hint="2 to 80 characters."
          />
          <Input
            wide
            as="textarea"
            label="Description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            hint="Optional. Shown on the organization card."
          />
        </>
      )}
    />
  );
}
