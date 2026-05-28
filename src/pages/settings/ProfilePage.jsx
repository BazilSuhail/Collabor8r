// feat(pages/settings/ProfilePage): let the user edit their name, job title, headline, avatar, timezone and locale.
import { useEffect, useMemo, useState } from "react";
import { getMe, updateMe } from "../../libs/api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import AvatarPickerModal from "../../components/users/AvatarPickerModal.jsx";
import { userAvatarSrc } from "../../utils/media.js";
import { Icon } from "../../components/ui/Icon.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SettingsFoot } from "./components/SettingsNav.jsx";

const FIELDS = ["displayName", "firstName", "lastName", "jobTitle", "headline", "timezone", "locale", "avatarUrl"];

const LOCALES = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
];

function timezoneList(current) {
  let zones = ["UTC"];
  try {
  if (typeof Intl.supportedValuesOf === "function") zones = Intl.supportedValuesOf("timeZone");
  } catch {
  zones = ["UTC"];
  }
  const set = new Set(zones);
  if (current && !set.has(current)) set.add(current);
  return [...set].map((z) => ({ value: z, label: z.replace(/_/g, " ") }));
}

const pick = (user) => {
  const out = {};
  FIELDS.forEach((f) => {
  out[f] = user?.[f] ?? "";
  });
  return out;
};

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const me = useResource(() => getMe(), []);
  const save = useMutation(updateMe, {
  success: "Profile saved",
  error: (err) => err?.message || "Could not save your profile.",
  });

  const [values, setValues] = useState(pick(null));
  const [baseline, setBaseline] = useState(pick(null));
  const [avatarOpen, setAvatarOpen] = useState(false);
  const user = me.data;

  const onAvatarSaved = () => {
  refreshUser().catch(() => {});
  me.reload();
  };

  useEffect(() => {
  if (!user) return;
  const next = pick(user);
  setValues(next);
  setBaseline(next);
  }, [user]);

  useViewEntry(
 "profile",
  ({ q }) => {
  fadeUp(q(".card"), { y: 20, stagger: 0.07 });
  },
  [me.status === "success"],
  );

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(baseline), [values, baseline]);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const setSelect = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));

  const discard = () => setValues(baseline);

  const submit = async (e) => {
  e.preventDefault();
  if (!dirty || save.pending) return;
  if (!values.displayName.trim()) return;
  const body = {
  displayName: values.displayName.trim(),
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  jobTitle: values.jobTitle.trim(),
  headline: values.headline.trim(),
  timezone: values.timezone,
  locale: values.locale,
  avatarUrl: values.avatarUrl.trim(),
  };
  const res = await save.run(body);
  if (res) {
  const next = pick({ ...user, ...body });
  setValues(next);
  setBaseline(next);
  await refreshUser().catch(() => {});
  me.reload();
  }
  };

  return (
  <>
  <PageHead title="Profile" sub="How you appear to people in Collabor8r." />

  {me.status === "loading" ? (
  <section className="card p-[20px] " aria-busy="true">
  <Skeleton variant="cards" count={2} />
  </section>
  ) : null}

  {me.status === "error" ? (
  <section className="card p-[20px] ">
  <EmptyState tone="error" title="Your profile did not load" text={me.error?.message} onRetry={me.reload} />
  </section>
  ) : null}

  {me.status === "success" ? (
  <form noValidate onSubmit={submit} className="card p-[20px] grid gap-[18px] " data-enter>
  <div className="flex items-center gap-[16px] min-w-0">
  <Avatar
  name={values.displayName || "You"}
  src={userAvatarSrc({ avatarKey: user?.avatarKey, avatarUrl: values.avatarUrl }) || undefined}
  size="xl"
  id={user?.id}
  />
  <div className="min-w-0">
  <p className="font-bold text-text truncate">{values.displayName || "Your name"}</p>
  <p className="text-muted text-[13px] truncate">{user?.email ?? ""}</p>
  </div>
  <Button variant="ghost" size="sm" icon="user" onClick={() => setAvatarOpen(true)} className="flex-none">
  Change avatar
  </Button>
  </div>

  <div className="flex items-center gap-[12px]">
  <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
  <Icon name="user" />
  </span>
  <h2 className="text-[15px] font-bold text-text">Profile details</h2>
  </div>

  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Input
  label="Display name"
  value={values.displayName}
  onChange={set("displayName")}
  hint="Required. This is the name people see."
  required
  />
  <Input label="Job title" value={values.jobTitle} onChange={set("jobTitle")} hint="Optional." />
  <Input label="First name" value={values.firstName} onChange={set("firstName")} hint="Optional." />
  <Input label="Last name" value={values.lastName} onChange={set("lastName")} hint="Optional." />
  <div className="col-span-full">
  <Input label="Headline" value={values.headline} onChange={set("headline")} hint="A short line under your name." />
  </div>
  <div className="col-span-full">
  <Input
  label="Avatar URL"
  value={values.avatarUrl}
  onChange={set("avatarUrl")}
  hint="Leave empty to show your initials."
  />
  </div>
  <Select
  label="Timezone"
  value={values.timezone}
  onChange={setSelect("timezone")}
  options={timezoneList(values.timezone)}
  searchable
  placeholder="Choose a timezone"
  hint="Used to show times in your local zone."
  />
  <Select
  label="Locale"
  value={values.locale}
  onChange={setSelect("locale")}
  options={LOCALES}
  placeholder="Choose a locale"
  hint="Sets the language of your interface."
  />
  </div>

  {save.fieldErrors && Object.keys(save.fieldErrors).length ? (
  <p role="alert" className="text-bad text-[13px] font-semibold">
  {Object.values(save.fieldErrors)[0]}
  </p>
  ) : null}

  <SettingsFoot dirty={dirty} pending={save.pending} onDiscard={discard} />
  </form>
  ) : null}

  <AvatarPickerModal
  open={avatarOpen}
  onClose={() => setAvatarOpen(false)}
  currentKey={user?.avatarKey ?? null}
  onSaved={onAvatarSaved}
  />
  </>
  );
}
