// feat(pages/tests/components/TestCaseFormModal): create or edit a test case with its precondition, priority, status and steps.
import FormModal from "../../../components/ui/FormModal.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import { createTestCase, updateTestCase } from "../../../libs/api/tests.js";
import { useToast } from "../../../context/ToastContext.jsx";

const PRIORITY_OPTIONS = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "deprecated", label: "Deprecated" },
];

// One step per line. Write "action | expected result" to add the expected part.
const stepsToText = (steps = []) =>
  steps.map((s) => (s.expected ? `${s.action} | ${s.expected}` : s.action)).join("\n");

const textToSteps = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [action, ...rest] = line.split("|");
      const expected = rest.join("|").trim();
      return expected ? { action: action.trim(), expected } : { action: action.trim() };
    });

export default function TestCaseFormModal({ open, onClose, projectId, testCase, onSaved }) {
  const toast = useToast();
  const initialValues = {
    title: testCase?.title ?? "",
    priority: testCase?.priority ?? "Medium",
    status: testCase?.status ?? "draft",
    precondition: testCase?.precondition ?? "",
    steps: stepsToText(testCase?.steps),
  };

  const onSubmit = async (values) => {
    const body = {
      title: values.title.trim(),
      priority: values.priority,
      status: values.status,
      precondition: values.precondition.trim(),
      steps: textToSteps(values.steps),
    };
    const saved = testCase
      ? await updateTestCase(projectId, testCase.id, body)
      : await createTestCase(projectId, body);
    toast.success("Test case saved");
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={testCase ? "Edit test case" : "New test case"}
      description="Steps are read in order by whoever runs the test."
      size="lg"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <div className="col-span-full grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="file" />
            Details
          </p>
          <div className="col-span-full">
            <Input
              label="Title"
              hint="Name what the test proves, up to 300 characters."
              value={values.title}
              maxLength={300}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
            />
          </div>
          <Select
            label="Priority"
            hint="How serious a failure is."
            value={values.priority}
            options={PRIORITY_OPTIONS}
            onChange={(v) => set("priority", v)}
            error={errors.priority}
          />
          <Select
            label="Status"
            hint="Draft cases are still being written."
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(v) => set("status", v)}
            error={errors.status}
          />
          <div className="col-span-full">
            <Input
              as="textarea"
              label="Preconditions"
              hint="What must be true before the first step. Leave blank if none."
              value={values.precondition}
              maxLength={2000}
              onChange={(e) => set("precondition", e.target.value)}
              error={errors.precondition}
            />
          </div>
          <p className="col-span-full flex items-center gap-[8px] text-text font-semibold text-[14px]">
            <Icon name="list" />
            Procedure
          </p>
          <div className="col-span-full">
            <Input
              as="textarea"
              label="Steps"
              hint="One step per line. Add the expected result after a bar, for example: Open the login page | Form shows."
              value={values.steps}
              onChange={(e) => set("steps", e.target.value)}
              error={errors.steps}
            />
          </div>
        </div>
      )}
    />
  );
}
