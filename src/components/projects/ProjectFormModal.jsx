import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Switch from "../ui/Switch.jsx";
import ThemePicker from "./ThemePicker.jsx";

const VISIBILITY = [
  { value: "private", label: "Private" },
  { value: "request", label: "Request to join" },
  { value: "open", label: "Open to the organization" },
];

// Create a project. allowPersonal shows the personal switch (personal projects have no org).
// onSubmit(values) belongs to the page: values.personal picks the endpoint. It throws on failure.
export default function ProjectFormModal({ open, onClose, allowPersonal = false, onSubmit }) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New project"
      description="Issues, boards and reports belong to a project."
      size="lg"
      submitLabel="Create project"
      initialValues={{ name: "", key: "", description: "", visibility: "private", themeKey: null, personal: false }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            hint="The name people see across the workspace."
          />
          <Input
            label="Key"
            value={values.key}
            onChange={(e) => set("key", e.target.value)}
            error={errors.key}
            hint="2 to 10 letters, used in issue keys."
          />
          <Input
            wide
            as="textarea"
            className="col-span-full"
            label="Description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            hint="Optional. Shown on the project card."
          />
          <div>
            <Select
              label="Visibility"
              value={values.visibility}
              onChange={(v) => set("visibility", v)}
              options={VISIBILITY}
              error={errors.visibility}
            />
            <p className="field__hint">Controls who can find and join this project.</p>
          </div>
          <div className="col-span-full">
            <ThemePicker
              value={values.themeKey}
              onChange={(key) => set("themeKey", key)}
            />
          </div>
          {allowPersonal ? (
            <Switch
              className="col-span-full"
              label="Personal project"
              checked={values.personal}
              onChange={(v) => set("personal", v)}
            />
          ) : null}
        </>
      )}
    />
  );
}
