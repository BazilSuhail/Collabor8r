// feat(pages/settings/components/TokenList): list personal API tokens, create one with its scopes and show it once, and revoke tokens.
import { useState } from "react";
import { createToken, listTokens, revokeToken } from "../../../libs/api/users.js";
import { useResource } from "../../../utils/useResource.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { relativeTime } from "../../../utils/format.js";
import { TOKEN_SCOPES } from "../../../metadata/settings.js";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import FormModal from "../../../components/ui/FormModal.jsx";
import Input from "../../../components/ui/Input.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import Select from "../../../components/ui/Select.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import SecretRevealModal from "../../../components/shared/SecretRevealModal.jsx";

const SCOPE_OPTIONS = TOKEN_SCOPES.map((s) => ({ value: s.id, label: s.label }));

// The date input gives YYYY-MM-DD. The server wants an ISO datetime in the future.
const toExpiry = (day) => (day ? new Date(`${day}T23:59:59Z`).toISOString() : null);

export default function TokenList() {
  const toast = useToast();
  const tokens = useResource(() => listTokens(), []);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [toRevoke, setToRevoke] = useState(null);

  const list = tokens.data ?? [];

  const create = async (values) => {
  const body = {
  name: values.name.trim(),
  scopes: values.scopes ?? [],
  expiresAt: toExpiry(values.expiresAt),
  };
  const res = await createToken(body);
  const { token, ...view } = res.data;
  tokens.setData((prev) => [view, ...(prev ?? [])]);
  setRevealed(token);
  toast.success("Token created. Copy it now.");
  };

  const revoke = async () => {
  const t = toRevoke;
  if (!t) return;
  await revokeToken(t.id);
  tokens.setData((prev) => (prev ?? []).filter((x) => x.id !== t.id));
  toast.success("Token revoked");
  };

  return (
  <section className="card p-[20px] grid gap-[16px] ">
  <div className="flex flex-wrap items-center justify-between gap-[12px]">
  <div className="flex items-start gap-[12px] min-w-0">
  <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
  <Icon name="key" />
  </span>
  <div className="min-w-0">
  <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-text">API tokens</h2>
  <p className="text-muted text-[13.5px]">Personal tokens for scripts. Each token only has the scopes you give it.</p>
  </div>
  </div>
  <Button variant="soft" icon="plus" onClick={() => setCreating(true)}>
  New token
  </Button>
  </div>

  {tokens.status === "loading" ? (
  <div aria-busy="true" className="grid gap-[12px]">
  <Skeleton variant="feed" count={3} />
  </div>
  ) : null}

  {tokens.status === "error" ? (
  <EmptyState tone="error" title="Tokens did not load" text={tokens.error?.message} onRetry={tokens.reload} />
  ) : null}

  {tokens.status === "success" && !list.length ? (
  <EmptyState icon="key" title="No API tokens" text="Create a token to call the API from scripts." />
  ) : null}

  {tokens.status === "success" && list.length ? (
  <ul className="grid">
  {list.map((t) => (
  <li
  key={t.id}
  data-key={t.id}
  className="flex flex-wrap items-center gap-[12px] py-[14px] not-first:border-t not-first:border-line"
  >
  <div className="flex-1 min-w-0">
  <p className="font-bold text-text truncate">{t.name}</p>
  <p className="text-muted text-[13px] mt-[2px]">
  <code className="font-mono">{t.tokenPrefix}…</code>
  {" · "}
  {t.lastUsedAt ? `Last used ${relativeTime(t.lastUsedAt)}` : "Never used"}
  </p>
  <div className="mt-[8px] flex flex-wrap gap-[6px]">
  {t.scopes?.length ? (
  t.scopes.map((s) => (
  <Badge key={s} tone="iris">{s}</Badge>
  ))
  ) : (
  <Badge tone="plain">No scopes</Badge>
  )}
  </div>
  </div>
  <Button size="sm" variant="ghost" icon="trash" onClick={() => setToRevoke(t)}>
  Revoke
  </Button>
  </li>
  ))}
  </ul>
  ) : null}

  <FormModal
  open={creating}
  onClose={() => setCreating(false)}
  title="New API token"
  description="Pick a name and the scopes this token may use."
  submitLabel="Create token"
  initialValues={{ name: "", scopes: [], expiresAt: "" }}
  onSubmit={create}
  fields={({ values, set, errors }) => (
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <div className="col-span-full">
  <Input
  label="Name"
  value={values.name}
  onChange={(e) => set("name", e.target.value)}
  error={errors.name}
  hint="Helps you recognise where the token is used."
  required
  />
  </div>
  <Select
  label="Scopes"
  multiple
  value={values.scopes}
  onChange={(next) => set("scopes", next)}
  options={SCOPE_OPTIONS}
  placeholder="No scopes"
  hint="Choose only what the script needs."
  />
  <Input
  label="Expires on"
  type="date"
  value={values.expiresAt}
  onChange={(e) => set("expiresAt", e.target.value)}
  error={errors.expiresAt}
  hint="Leave empty for no expiry."
  />
  </div>
  )}
  />

  <SecretRevealModal
  open={revealed !== null}
  onClose={() => setRevealed(null)}
  title="Your new API token"
  description="Copy it now. For your security it is shown only once."
  value={revealed ?? ""}
  label="API token"
  doneLabel="Done"
  />

  <ConfirmDialog
  open={toRevoke !== null}
  onClose={() => setToRevoke(null)}
  title={toRevoke ? `Revoke ${toRevoke.name}?` : "Revoke token?"}
  text="Scripts that use this token stop working straight away."
  confirmLabel="Revoke token"
  tone="danger"
  onConfirm={revoke}
  />
  </section>
  );
}
