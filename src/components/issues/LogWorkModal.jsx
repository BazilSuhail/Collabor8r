import { useToast } from "../../context/ToastContext.jsx";
import { addWorklog, listIssues } from "../../libs/api/issues.js";
import { formatDuration, parseDuration } from "../../utils/format.js";
import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";

const todayIso = () => new Date().toISOString().slice(0, 10);

// Logs time on one issue. Time is typed as "1h 30m" and sent as seconds.
// Without an issueId (Timesheet), the user picks the issue in the form.
export default function LogWorkModal({ open, onClose, projectId, issueId, onSaved }) {
  const toast = useToast();

  const submit = async (values) => {
    const seconds = parseDuration(values.time);
    if (!seconds || seconds < 1) throw new Error("Enter a time like 1h 30m.");
    const target = issueId ?? values.issueId;
    if (!target) throw new Error("Pick an issue.");
    const res = await addWorklog(projectId, target, {
      seconds,
      date: values.date || todayIso(),
      comment: values.comment?.trim() ?? "",
    });
    toast.success(`Logged ${formatDuration(seconds)}`);
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Log work"
      description={issueId ? "Record time spent on this issue." : "Record time spent on an issue."}
      submitLabel="Log work"
      initialValues={{ issueId: "", time: "", date: todayIso(), comment: "" }}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          {!issueId ? (
            <Select
              label="Issue"
              required
              searchable
              className="col-span-full"
              placeholder="Search issues"
              value={values.issueId}
              onChange={(v) => set("issueId", v || "")}
              options={[]}
              loadOptions={(q) =>
                listIssues(projectId, { q, limit: 10 }).then((res) =>
                  (res.data ?? []).map((i) => ({ value: String(i.id ?? i._id), label: `${i.key} ${i.title}` })),
                )
              }
            />
          ) : null}
          <Input
            label="Time spent"
            required
            hint="For example 1h 30m. Enter a time greater than zero."
            className="col-span-full"
            value={values.time}
            onChange={(e) => set("time", e.target.value)}
            error={errors.seconds}
          />
          <Input
            type="date"
            label="Date"
            hint="Defaults to today."
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
            error={errors.date}
          />
          <Input
            as="textarea"
            label="Comment"
            hint="Optional. Describe what the time was spent on."
            className="col-span-full"
            value={values.comment}
            onChange={(e) => set("comment", e.target.value)}
            error={errors.comment}
          />
        </>
      )}
    />
  );
}
