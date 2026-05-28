// feat(pages/settings/components/ChangePasswordForm): change the password, which signs every session out and sends the user to sign in again.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useMutation } from "../../../utils/useMutation.js";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";

export default function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [clientError, setClientError] = useState(null);
  // No toast options here: AuthContext already toasts "Password changed. Sign in again."
  // The wrapper resolves to true so a successful run is told apart from a failed one.
  const mutation = useMutation(async (body) => {
  await changePassword(body);
  return true;
  });

  const reset = () => {
  setCurrent("");
  setNext("");
  setConfirm("");
  };

  const submit = async (e) => {
  e.preventDefault();
  if (mutation.pending) return;
  setClientError(null);
  if (next.length < 8) {
  setClientError("The new password needs at least 8 characters.");
  return;
  }
  if (next !== confirm) {
  setClientError("The new passwords do not match.");
  return;
  }
  const res = await mutation.run({ currentPassword: current, newPassword: next });
  if (res === true) {
  reset();
  // Forced re-login: the tokens are already cleared, so go to sign in.
  navigate("/login", { replace: true });
  }
  };

  const fieldErrors = mutation.fieldErrors ?? {};
  const serverMessage = mutation.error && !Object.keys(fieldErrors).length ? mutation.error.message : null;
  const message = clientError ?? serverMessage;

  return (
  <section className="card p-[20px] grid gap-[16px] ">
  <div className="flex items-start gap-[12px]">
  <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
  <Icon name="lock" />
  </span>
  <div className="min-w-0">
  <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-text">Password</h2>
  <p className="text-muted text-[13.5px]">
  Changing your password signs you out everywhere. Sign in again with the new password.
  </p>
  </div>
  </div>

  <form noValidate onSubmit={submit} className="grid gap-[14px]">
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <div className="col-span-full">
  <Input
  label="Current password"
  type="password"
  name="currentPassword"
  autoComplete="current-password"
  value={current}
  onChange={(e) => setCurrent(e.target.value)}
  error={fieldErrors.currentPassword}
  hint="Needed to confirm it is you."
  required
  />
  </div>
  <Input
  label="New password"
  type="password"
  name="newPassword"
  autoComplete="new-password"
  hint="At least 8 characters."
  value={next}
  onChange={(e) => setNext(e.target.value)}
  error={fieldErrors.newPassword}
  required
  />
  <Input
  label="Confirm new password"
  type="password"
  name="confirmPassword"
  autoComplete="new-password"
  hint="Re-enter the new password."
  value={confirm}
  onChange={(e) => setConfirm(e.target.value)}
  required
  />
  </div>

  <p role="alert" className="text-bad text-[13px] font-semibold empty:hidden">
  {message ?? ""}
  </p>

  <div className="flex flex-wrap items-center justify-end gap-[10px]">
  <Button type="submit" variant="ember" loading={mutation.pending} disabled={!current || !next || !confirm}>
  Change password
  </Button>
  </div>
  </form>
  </section>
  );
}
