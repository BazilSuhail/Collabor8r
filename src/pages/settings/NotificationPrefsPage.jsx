// feat(pages/settings/NotificationPrefsPage): choose which notification kinds reach the user on each channel.
import { useEffect, useMemo, useRef, useState } from "react";
import { getPrefs, putPrefs } from "../../libs/api/users.js";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { useEntry, useViewEntry, fadeUp } from "../../utils/motion.js";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS } from "../../metadata/settings.js";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SettingsFoot } from "./components/SettingsNav.jsx";

const keyOf = (kind, channel) => `${kind}|${channel}`;

// Maps the server list to { "kind|channel": enabled } and keeps quiet hours for the PUT.
function toDraft(list) {
  const enabled = {};
  const quiet = {};
  (Array.isArray(list) ? list : []).forEach((p) => {
  enabled[keyOf(p.kind, p.channel)] = Boolean(p.enabled);
  quiet[keyOf(p.kind, p.channel)] = p.quietHours ?? null;
  });
  return { enabled, quiet };
}

export default function NotificationPrefsPage() {
  const prefs = useResource(() => getPrefs(), []);
  const save = useMutation(putPrefs, {
  success: "Preferences saved",
  error: (err) => err?.message || "Could not save your preferences.",
  });

  const [draft, setDraft] = useState({ enabled: {}, quiet: {} });
  const [baseline, setBaseline] = useState({ enabled: {}, quiet: {} });
  const rowsRef = useRef(null);

  useEffect(() => {
  if (prefs.status !== "success") return;
  const next = toDraft(prefs.data);
  setDraft(next);
  setBaseline(next);
  }, [prefs.status, prefs.data]);

  useViewEntry(
 "notification-prefs",
  ({ q }) => {
  fadeUp(q(".card"), { y: 20, stagger: 0.07 });
  },
  [prefs.status === "success"],
  );

  useEntry(
  rowsRef,
  ({ q }) => {
  fadeUp(q("[data-row]"), { y: 10, stagger: 0.03, delay: 0.1 });
  },
  [prefs.status === "success"],
  );

  const dirty = useMemo(
  () => JSON.stringify(draft.enabled) !== JSON.stringify(baseline.enabled),
  [draft, baseline],
  );

  const isOn = (kind, channel) => draft.enabled[keyOf(kind, channel)] !== false;

  const toggle = (kind, channel) => (next) =>
  setDraft((d) => ({ ...d, enabled: { ...d.enabled, [keyOf(kind, channel)]: next } }));

  const discard = () => setDraft(baseline);

  const totalPrefs = NOTIFICATION_KINDS.length * NOTIFICATION_CHANNELS.length;
  const onPrefs = NOTIFICATION_KINDS.reduce(
  (sum, k) => sum + NOTIFICATION_CHANNELS.filter((c) => isOn(k.id, c.id)).length,
  0,
  );

  const submit = async (e) => {
  e.preventDefault();
  if (!dirty || save.pending) return;
  const body = {
  prefs: NOTIFICATION_KINDS.flatMap((k) =>
  NOTIFICATION_CHANNELS.map((c) => {
  const key = keyOf(k.id, c.id);
  return {
  channel: c.id,
  kind: k.id,
  enabled: draft.enabled[key] !== false,
  quietHours: draft.quiet[key] ?? null,
  };
  }),
  ),
  };
  const res = await save.run(body);
  if (res) {
  const next = toDraft(res.data);
  setDraft(next);
  setBaseline(next);
  }
  };

  return (
  <>
  <PageHead title="Notifications" sub="Choose which kinds of notification reach you, and where." />

  {prefs.status === "loading" ? (
  <section className="card p-[20px] " aria-busy="true">
  <table className="tbl w-full">
  <Skeleton variant="rows" count={8} cols={3} />
  </table>
  </section>
  ) : null}

  {prefs.status === "error" ? (
  <section className="card p-[20px] ">
  <EmptyState tone="error" title="Preferences did not load" text={prefs.error?.message} onRetry={prefs.reload} />
  </section>
  ) : null}

  {prefs.status === "success" && NOTIFICATION_KINDS.length === 0 ? (
  <section className="card p-[20px] ">
  <EmptyState icon="bell" title="No notification kinds" text="There is nothing to configure yet." />
  </section>
  ) : null}

  {prefs.status === "success" && NOTIFICATION_KINDS.length > 0 ? (
  <form noValidate onSubmit={submit} className="card p-[20px]  grid gap-[16px]" data-enter>
  <header className="flex flex-wrap items-center justify-between gap-[12px]">
  <div className="flex items-center gap-[12px] min-w-0">
  <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
  <Icon name="bell" />
  </span>
  <h2 className="text-[15px] font-bold text-text">Channels by notification</h2>
  </div>
  <Badge tone="iris" className="tabular-nums">
  {onPrefs} of {totalPrefs} on
  </Badge>
  </header>
  <div className="overflow-x-auto" ref={rowsRef}>
  <table className="tbl w-full">
  <thead>
  <tr>
  <th scope="col" className="text-left">Notification</th>
  {NOTIFICATION_CHANNELS.map((c) => (
  <th scope="col" key={c.id} className="text-center">{c.label}</th>
  ))}
  </tr>
  </thead>
  <tbody>
  {NOTIFICATION_KINDS.map((k) => (
  <tr key={k.id} data-row data-key={k.id} className="hover:bg-surface-2">
  <th scope="row" className="text-left font-normal">
  <span className="block font-bold text-text">{k.label}</span>
  <span className="block text-muted text-[12.5px]">{k.desc}</span>
  </th>
  {NOTIFICATION_CHANNELS.map((c) => (
  <td key={c.id} className="text-center">
  <Switch
  checked={isOn(k.id, c.id)}
  onChange={toggle(k.id, c.id)}
  label={`${k.label} on ${c.label}`}
  hideLabel
  />
  </td>
  ))}
  </tr>
  ))}
  </tbody>
  </table>
  </div>

  <SettingsFoot dirty={dirty} pending={save.pending} onDiscard={discard} saveLabel="Save preferences" />
  </form>
  ) : null}
  </>
  );
}
