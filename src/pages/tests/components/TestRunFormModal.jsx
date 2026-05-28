// feat(pages/tests/components/TestRunFormModal): start a new test run with a name, environment and build version.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createTestRun } from "../../../libs/api/tests.js";

const initialValues = { name: "", environment: "", buildVersion: "" };

export default function TestRunFormModal({ open, onClose, projectId, onCreated }) {
  const toast = useToast();

  const onSubmit = async (values) => {
    const body = {
      name: values.name.trim(),
      environment: values.environment.trim(),
      buildVersion: values.buildVersion.trim(),
    };
    const created = await createTestRun(projectId, body);
    toast.success("Run created");
    onCreated?.(created.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New test run"
      description="Record results for each test case inside the run."
      size="md"
      submitLabel="Create run"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="tasks" />
            Run
          </p>
          <div className="col-span-full">
            <Input
              label="Run name"
              hint="Something the team recognises, up to 200 characters."
              value={values.name}
              maxLength={200}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
            />
          </div>
          <Input
            label="Environment"
            hint="Where the run executes, for example staging."
            value={values.environment}
            maxLength={120}
            onChange={(e) => set("environment", e.target.value)}
            error={errors.environment}
          />
          <Input
            label="Build version"
            hint="The build under test, for example 1.4.2."
            value={values.buildVersion}
            maxLength={120}
            onChange={(e) => set("buildVersion", e.target.value)}
            error={errors.buildVersion}
          />
        </div>
      )}
    />
  );
}
