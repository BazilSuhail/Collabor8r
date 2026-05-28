// feat(pages/forms/PublicFormPage): render a project's public intake form and submit it without signing in.
import { useState } from "react";
import { useParams } from "react-router-dom";
import SplitTitle from "../../components/SplitTitle.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import { getPublicForm, submitPublicForm } from "../../libs/api/forms.js";
import { bindLift, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";
import FormRenderer from "./components/FormRenderer.jsx";

const isEmpty = (v) => v === undefined || v === null || v === "" || v === false || (Array.isArray(v) && v.length === 0);

export default function PublicFormPage() {
  const { publicKey } = useParams();
  const form = useResource(() => getPublicForm(publicKey), [publicKey]);
  const [values, setValues] = useState({});
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const ready = form.status === "success";

  useViewEntry(
 "public-form",
  ({ q, root }) => {
  fadeUp(q(".card > *"), { y: 14, stagger: 0.05 });
  return bindLift(root);
  },
  [ready, done],
  );

  const set = (id, value) => {
  setValues((prev) => ({ ...prev, [id]: value }));
  setErrors((prev) => {
  if (!prev[id]) return prev;
  const next = { ...prev };
  delete next[id];
  return next;
  });
  };

  const submit = async (e) => {
  e.preventDefault();
  if (pending) return;
  const fields = form.data?.fields ?? [];
  const nextErrors = {};
  fields.forEach((f) => {
  if (f.required && isEmpty(values[f.id])) nextErrors[f.id] = "This field is required";
  });
  setFormError(null);
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length) {
  setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
  return;
  }
  const answers = Object.fromEntries(Object.entries(values).filter(([, v]) => !isEmpty(v)));
  setPending(true);
  try {
  await submitPublicForm(publicKey, { answers, website });
  setDone(true);
  } catch (err) {
  if (err?.status === 429) {
  setFormError("Too many submissions from this network. Please wait a minute and try again.");
  } else if (err?.status === 422) {
  const mapped = {};
  (err.errors ?? []).forEach((item) => {
  const key = String(item.path ?? "").replace(/^answers\./, "");
  if (key && !mapped[key]) mapped[key] = item.message;
  });
  setErrors(mapped);
  if (!Object.keys(mapped).length) setFormError(err.message ?? "Check the highlighted fields.");
  } else if (err?.status === 404) {
  setFormError("This form is not available.");
  } else {
  setFormError("Something went wrong. Try again.");
  }
  } finally {
  setPending(false);
  }
  };

  if (form.status === "loading") {
  return (
  <section className="card p-[28px] grid gap-[14px]" aria-busy="true">
  <span className="sr">Loading</span>
  <span className="block h-[22px] w-[60%] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
  {[0, 1, 2, 3].map((i) => (
  <span key={i} className="block h-[12px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
  ))}
  </section>
  );
  }

  if (form.status === "error") {
  return (
  <section className="card p-[28px]">
  <EmptyState
  tone="error"
  icon="alert"
  title="This form is not available"
  text="The link may be wrong, or the form is no longer accepting answers."
  onRetry={form.reload}
  />
  </section>
  );
  }

  if (done) {
  return (
  <section className="card p-[28px]">
  <EmptyState icon="check" title="Thanks, we got it" text="Your answers were sent to the project team." />
  </section>
  );
  }

  const data = form.data ?? {};
  return (
  <section className="card p-[20px] grid gap-[16px]  mx-auto" aria-labelledby="public-form-title">
  <Illustration name="forms" alt="" className="w-[180px] justify-self-center w1000:hidden" />
  <div className="grid gap-[6px] min-w-0">
  <SplitTitle text={data.name ?? "Form"} as="h1" className="[font:700_22px_var(--display)] tracking-[-0.02em] text-text truncate" />
  {data.description ? <p className="card__sub">{data.description}</p> : null}
  </div>
  <form noValidate onSubmit={submit} className="grid gap-[16px]">
  <FormRenderer
  columns={1}
  fields={data.fields ?? []}
  values={values}
  errors={errors}
  onChange={set}
  disabled={pending}
  idPrefix="pf"
  />
  <input
  type="text"
  name="website"
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
  value={website}
  onChange={(e) => setWebsite(e.target.value)}
  className="sr"
  />
  {formError ? (
  <p role="alert" className="flex items-start gap-[8px] text-bad text-[13px] font-semibold">
  <Icon name="alert" cls="shrink-0 mt-[2px]" />
  {formError}
  </p>
  ) : null}
  <p className="text-muted text-[13px]">Fields marked required must be filled in before you submit.</p>
  <Button variant="ember" type="submit" loading={pending} disabled={pending} className="w-full">
  Submit
  </Button>
  </form>
  </section>
  );
}
