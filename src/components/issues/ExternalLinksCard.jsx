import { useState } from "react";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  createExternalLink,
  deleteExternalLink,
  listExternalLinks,
  listIntegrations,
} from "../../libs/api/automation.js";
import { useResource } from "../../utils/useResource.js";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import FormModal from "../ui/FormModal.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { Icon } from "../ui/Icon.jsx";

const TYPES = [
  { value: "commit", label: "Commit", icon: "commit" },
  { value: "pullRequest", label: "Pull request", icon: "pr" },
  { value: "build", label: "Build", icon: "build" },
  { value: "deploy", label: "Deploy", icon: "external" },
  { value: "message", label: "Message", icon: "chat" },
];
const TYPE_ICON = Object.fromEntries(TYPES.map((t) => [t.value, t.icon]));
const idOf = (item) => item?.id ?? item?._id ?? null;
const safeHref = (url) => (typeof url === "string" && /^https?:\/\//i.test(url) ? url : undefined);

// Linked items from connected integrations (commits, pull requests, builds) for one issue.
// The links list is loaded for every integration of the project; members without
// integration access pass can={false} and see the empty state instead.
export default function ExternalLinksCard({ projectId, issueId, can = false }) {
  const toast = useToast();
  const { can: canProject } = useProject();
  // The integrations list is admin only on the server; others would only get a 403 toast.
  const canList = can && canProject("integration.manage");
  const [adding, setAdding] = useState(false);
  const linked = useResource(async () => {
    if (!canList) return { data: { links: [], integrations: [] } };
    const res = await listIntegrations(projectId);
    const integrations = res.data ?? [];
    const lists = await Promise.all(
      integrations.map((i) => listExternalLinks(projectId, idOf(i), { issueId })),
    );
    const links = lists.flatMap((r, index) =>
      (r.data ?? []).map((l) => ({
        ...l,
        integrationId: idOf(integrations[index]),
        provider: integrations[index].displayName ?? integrations[index].name ?? integrations[index].provider ?? "Integration",
      })),
    );
    return { data: { links, integrations } };
  }, [projectId, issueId, canList]);

  const links = linked.data?.links ?? [];
  const integrations = linked.data?.integrations ?? [];

  const unlink = async (link) => {
    try {
      await deleteExternalLink(projectId, link.integrationId, idOf(link));
      toast.success("Unlinked");
      linked.reload();
    } catch {
      toast.error("Could not unlink");
    }
  };

  return (
    <section className="card p-[18px] grid gap-[12px]" aria-labelledby="iss-ext-t">
      <header className="card__head min-h-[32px]">
        <h2 className="card__title flex items-center gap-[8px] min-w-0" id="iss-ext-t">
          <Icon name="link" cls="shrink-0" />
          <span className="truncate">Linked items</span>
        </h2>
        {can ? (
          <div className="card__tools">
            <Button size="sm" variant="soft" icon="link" disabled={!integrations.length} onClick={() => setAdding(true)}>
              Link item
            </Button>
          </div>
        ) : null}
      </header>

      {linked.status === "loading" ? <Skeleton variant="feed" count={2} /> : null}
      {linked.status === "error" ? (
        <EmptyState tone="error" title="Could not load linked items" onRetry={linked.reload} />
      ) : null}
      {linked.status === "success" && !links.length ? (
        <EmptyState icon="link" title="Nothing linked yet" text={integrations.length ? undefined : "No integration is connected to this project."} />
      ) : null}

      {linked.status === "success" && links.length ? (
        <ul className="grid gap-[8px] list-none m-0 p-0">
          {links.map((l) => {
            const href = safeHref(l.url);
            const label = l.title ?? l.externalId ?? "Linked item";
            return (
              <li key={idOf(l)} className="flex items-center gap-[10px] p-[10px_12px] rounded-[14px] bg-surface-2 border border-line" data-key={idOf(l)}>
                <span className="kpi__ico shrink-0">
                  <Icon name={TYPE_ICON[l.externalType] ?? "external"} />
                </span>
                <div className="min-w-0 flex-1 grid gap-[2px]">
                  {href ? (
                    <a className="link font-bold whitespace-nowrap text-ellipsis overflow-hidden" href={href} target="_blank" rel="noopener noreferrer">
                      {label}
                    </a>
                  ) : (
                    <b className="font-bold whitespace-nowrap text-ellipsis overflow-hidden">{label}</b>
                  )}
                  <small className="text-muted text-[12px] font-semibold">
                    {l.provider} · {TYPES.find((t) => t.value === l.externalType)?.label ?? "Item"}
                    {l.status ? ` · ${l.status}` : ""}
                  </small>
                </div>
                {can ? (
                  <Button iconOnly variant="ghost" size="sm" icon="close" aria-label={`Unlink ${label}`} onClick={() => unlink(l)} />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <FormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Link an item"
        submitLabel="Link"
        initialValues={{ integrationId: "", externalType: "commit", externalId: "", title: "", url: "" }}
        onSubmit={async (values) => {
          await createExternalLink(projectId, values.integrationId, {
            issueId,
            externalType: values.externalType,
            externalId: values.externalId.trim(),
            ...(values.title.trim() ? { title: values.title.trim() } : {}),
            ...(values.url.trim() ? { url: values.url.trim() } : {}),
          });
          toast.success("Linked");
          linked.reload();
        }}
        fields={({ values, set, errors }) => (
          <>
            <div className="col-span-full">
              <Select
                label="Integration"
                value={values.integrationId}
                onChange={(next) => set("integrationId", next)}
                options={integrations.map((i) => ({ value: idOf(i), label: i.displayName ?? i.name ?? i.provider ?? "Integration" }))}
                error={errors.integrationId}
                hint={integrations.length ? "Only connected integrations are listed." : undefined}
                required
              />
            </div>
            <div className="col-span-full">
              <Select
                label="Type"
                value={values.externalType}
                onChange={(next) => set("externalType", next)}
                options={TYPES}
              />
            </div>
            <Input
              label="External id"
              hint="The id in the provider, such as a commit SHA or PR number."
              value={values.externalId}
              onChange={(e) => set("externalId", e.target.value)}
              error={errors.externalId}
              required
            />
            <Input
              label="Title"
              hint="Optional. Shown instead of the id."
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              error={errors.title}
            />
            <div className="col-span-full">
              <Input
                label="Link"
                type="url"
                hint="Optional. Must start with http:// or https://."
                value={values.url}
                onChange={(e) => set("url", e.target.value)}
                error={errors.url}
              />
            </div>
          </>
        )}
      />
    </section>
  );
}
