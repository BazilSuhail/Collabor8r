// feat(pages/integrations/components/IntegrationCard): show one provider's connection state with its connect, configure and more actions.
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Dropdown from "../../../components/ui/Dropdown.jsx";
import Highlight from "../../../components/ui/Highlight.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import { relativeTime } from "../../../utils/format.js";

// Provider catalog (E.3 icons). Shared by the page, the card and the form modal.
export const PROVIDERS = [
  { key: "github", name: "GitHub", desc: "Link commits and pull requests to issues.", cat: "Code", icon: "github" },
  { key: "gitlab", name: "GitLab", desc: "Link merge requests and pipelines to issues.", cat: "Code", icon: "gitlab" },
  { key: "bitbucket", name: "Bitbucket", desc: "Track commits and pull requests from Bitbucket.", cat: "Code", icon: "code" },
  { key: "slack", name: "Slack", desc: "Post issue updates to a channel.", cat: "Chat", icon: "slack" },
  { key: "teams", name: "Microsoft Teams", desc: "Send issue updates to a Teams channel.", cat: "Chat", icon: "chat" },
  { key: "google", name: "Google Workspace", desc: "Link Drive documents and Chat spaces to issues.", cat: "Chat", icon: "web" },
  { key: "jira_import", name: "Jira import", desc: "Bring issues across from a Jira export.", cat: "Import", icon: "import" },
];

export const PROVIDER_BY_KEY = Object.fromEntries(PROVIDERS.map((p) => [p.key, p]));
export const CATEGORIES = ["Code", "Chat", "Import"];

const STATUS = {
  connected: { tone: "spruce", label: "Connected" },
  error: { tone: "ember", label: "Connection error" },
  disconnected: { tone: "plain", label: "Not connected" },
};

export default function IntegrationCard({ item, integration, query = "", canManage, busy = false, onPrimary, menuItems, cardKey }) {
  const status = integration?.status ?? "disconnected";
  const meta = STATUS[status] ?? STATUS.disconnected;
  const connected = status === "connected";
  const name = integration?.displayName || item.name;

  let detail = meta.label;
  if (connected && integration.lastSyncAt) detail = `Connected, synced ${relativeTime(integration.lastSyncAt)}`;
  if (status === "error" && integration.lastError) detail = integration.lastError;

  return (
    <article className="card flex flex-col gap-[12px] pt-[18px] px-[18px] pb-[16px]" data-key={cardKey} data-lift="">
      <header className="flex items-start justify-between gap-[10px]">
        <span className="grid place-items-center flex-none w-[46px] h-[46px] rounded-[15px] bg-well text-text">
          <Icon name={item.icon} cls="w-[22px] h-[22px]" />
        </span>
        <Badge tone="plain">{item.cat}</Badge>
      </header>

      <div className="min-w-0">
        <h3 className="font-display font-semibold text-[16.5px] leading-[1.25] tracking-[-0.01em] break-words">
          <Highlight text={name} query={query} />
        </h3>
        <p className="mt-[4px] text-[13px] leading-[1.5] text-muted">
          <Highlight text={item.desc} query={query} />
        </p>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-[10px] pt-[14px] border-t border-line">
        <span className="inline-flex min-w-0 items-center gap-[8px] text-[12.5px] font-semibold text-muted">
          <Badge variant="dot" tone={meta.tone} />
          <span role="status" className="min-w-0 truncate">
            {detail}
          </span>
        </span>

        {canManage ? (
          <span className="inline-flex items-center gap-[6px]">
            <Button
              size="sm"
              variant={connected ? "ghost" : "ember"}
              icon={connected ? "gear" : "plug"}
              loading={busy}
              onClick={onPrimary}
            >
              {connected ? "Configure" : "Connect"}
            </Button>
            {menuItems ? (
              <Dropdown
                label={`More actions for ${name}`}
                items={menuItems}
                trigger={(p) => (
                  <Button iconOnly variant="ghost" size="sm" icon="more" aria-label={`More actions for ${name}`} {...p} />
                )}
              />
            ) : null}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
