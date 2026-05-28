// feat(pages/integrations/components/WebhookFormModal): create or edit a webhook's URL, events and active state.
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { createWebhook, updateWebhook } from "../../../libs/api/automation.js";

// Mirrors the server EVENT_TYPES list. Creating a webhook needs at least one event.
export const WEBHOOK_EVENTS = [
  { value: "issue.created", label: "Issue created" },
  { value: "issue.updated", label: "Issue updated" },
  { value: "issue.transitioned", label: "Issue status changed" },
  { value: "issue.deleted", label: "Issue deleted" },
  { value: "comment.added", label: "Comment added" },
  { value: "sprint.started", label: "Sprint started" },
  { value: "sprint.completed", label: "Sprint completed" },
  { value: "member.added", label: "Member added" },
  { value: "member.removed", label: "Member removed" },
  { value: "release.shipped", label: "Release shipped" },
  { value: "page.updated", label: "Wiki page updated" },
  { value: "form.submitted", label: "Form submitted" },
  { value: "approval.decided", label: "Approval decided" },
];

const idOf = (row) => String(row?.id ?? row?._id ?? "");

// onCreated receives the new webhook, which carries its signing secret once.
export default function WebhookFormModal({ open, onClose, pid, webhook, onSaved, onCreated }) {
  const toast = useToast();
  const editing = Boolean(webhook);

  const initialValues = {
    name: webhook?.name ?? "",
    url: webhook?.url ?? "",
    events: webhook?.events ?? [],
    active: webhook ? Boolean(webhook.active) : true,
  };

  const submit = async (values) => {
    const body = {
      name: values.name.trim(),
      url: values.url.trim(),
      events: values.events,
      active: values.active,
    };
    if (editing) {
      const res = await updateWebhook(pid, idOf(webhook), body);
      toast.success("Webhook saved");
      onSaved?.(res.data);
      return;
    }
    const res = await createWebhook(pid, body);
    toast.success("Webhook saved");
    onCreated?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? "Edit webhook" : "New webhook"}
      description="Events are sent as signed JSON posts to the URL."
      size="lg"
      submitLabel={editing ? "Save" : "Create webhook"}
      initialValues={initialValues}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            hint="Shown in the webhook list."
            required
            maxLength={120}
          />
          <div className="self-end pb-[10px]">
            <Switch checked={values.active} onChange={(v) => set("active", v)} label="Active" />
            <p className="field__hint">Inactive webhooks send nothing.</p>
          </div>
          <div className="col-span-full">
            <Input
              label="Endpoint URL"
              type="url"
              placeholder="https://example.com/hooks/collabor8r"
              value={values.url}
              onChange={(e) => set("url", e.target.value)}
              error={errors.url}
              hint="Use an https address that accepts POST requests."
              required
            />
          </div>
          <div className="col-span-full">
            <Select
              label="Events"
              multiple
              options={WEBHOOK_EVENTS}
              value={values.events}
              onChange={(value) => set("events", value)}
              placeholder="Choose events"
              error={errors.events}
              required
            />
            <p className="field__hint">Pick at least one event to send.</p>
          </div>
        </>
      )}
    />
  );
}
