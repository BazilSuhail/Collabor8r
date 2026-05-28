// feat(pages/integrations/components/IntegrationFormModal): configure a code, chat or import integration and connect it.
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { connectIntegration, createIntegration, updateIntegration } from "../../../libs/api/automation.js";
import { PROVIDER_BY_KEY } from "./IntegrationCard.jsx";

// Config keys per provider. Keys that look secret are masked by the server on read.
const CONFIG_FIELDS = {
  github: [
    { key: "repo", label: "Repository", placeholder: "owner/name", hint: "The owner and repository name, as in the URL." },
    { key: "token", label: "Access token", secret: true, hint: "Needs read access to the repository." },
  ],
  gitlab: [
    { key: "project", label: "Project path", placeholder: "group/project", hint: "The group and project path, as in the URL." },
    { key: "token", label: "Access token", secret: true, hint: "Needs read access to the project." },
  ],
  bitbucket: [
    { key: "workspace", label: "Workspace", placeholder: "workspace-slug", hint: "The workspace slug from the URL." },
    { key: "token", label: "App password", secret: true, hint: "An app password with repository read access." },
  ],
  slack: [
    { key: "channel", label: "Channel", placeholder: "#releases", hint: "Where updates are posted." },
    { key: "webhookUrl", label: "Incoming webhook URL", type: "url", hint: "Created in your Slack app settings." },
  ],
  teams: [{ key: "webhookUrl", label: "Incoming webhook URL", type: "url", hint: "Created in your Teams channel connectors." }],
  google: [{ key: "space", label: "Chat space or folder ID", hint: "Found at the end of the space or folder URL." }],
  jira_import: [
    { key: "site", label: "Jira site URL", type: "url", placeholder: "https://example.atlassian.net", hint: "The base address of your Jira site." },
  ],
};

const idOf = (row) => String(row?.id ?? row?._id ?? "");

export default function IntegrationFormModal({ open, onClose, pid, provider, integration, onSaved }) {
  const toast = useToast();
  const meta = PROVIDER_BY_KEY[provider] ?? { name: provider, desc: "" };
  const fields = CONFIG_FIELDS[provider] ?? [];
  const editing = Boolean(integration);

  const initialValues = {
    displayName: integration?.displayName ?? meta.name,
    ...Object.fromEntries(fields.map((f) => [f.key, integration?.config?.[f.key] ?? ""])),
  };

  const submit = async (values) => {
    const config = Object.fromEntries(
      fields.map((f) => [f.key, values[f.key] ?? ""]).filter(([, v]) => v !== ""),
    );
    const displayName = values.displayName.trim();

    if (editing) {
      const res = await updateIntegration(pid, idOf(integration), { displayName, config });
      toast.success("Saved");
      onSaved?.(res.data);
      return;
    }

    const created = await createIntegration(pid, { provider, displayName, config });
    try {
      const connected = await connectIntegration(pid, idOf(created.data));
      toast.success(`Connected ${meta.name}`);
      onSaved?.(connected.data);
    } catch {
      // The integration exists but is not connected. The card offers Connect, so keep it and let the API layer show the error.
      onSaved?.(created.data);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? `Configure ${meta.name}` : `Connect ${meta.name}`}
      description={meta.desc}
      size="lg"
      submitLabel={editing ? "Save" : "Connect"}
      initialValues={initialValues}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          <div className="col-span-full">
            <Input
              label="Display name"
              value={values.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              error={errors.displayName}
              hint="Shown on the integration card."
              required
              maxLength={120}
            />
          </div>
          {fields.map((f) => (
            <div key={f.key} className={f.type === "url" ? "col-span-full" : undefined}>
              <Input
                label={f.label}
                type={f.secret ? "password" : f.type ?? "text"}
                autoComplete={f.secret ? "new-password" : "off"}
                placeholder={f.placeholder}
                hint={f.secret && editing ? "Saved values stay hidden. Type a new value to replace it." : f.hint}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                error={errors[f.key]}
              />
            </div>
          ))}
        </>
      )}
    />
  );
}
