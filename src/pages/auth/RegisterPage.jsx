// feat(pages/auth/RegisterPage): create an account and sign the new user straight in.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import { toFieldErrors } from "../../utils/formErrors.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

export default function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useViewEntry(
    "register",
    ({ q }) => {
      fadeUp(q("[data-enter]"), { y: 14, stagger: 0.05 });
    },
    [],
  );

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    if (password !== confirm) {
      setFieldErrors({ confirm: "The passwords do not match." });
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await register({
        email: email.trim(),
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err?.status === 409) {
        setFieldErrors({ email: "This email is already registered." });
      } else if (err?.status === 422) {
        const map = toFieldErrors(err.errors);
        setFieldErrors(map);
        if (!Object.keys(map).length) setFormError("Check the highlighted fields.");
      } else if (err?.status === 429) {
        setFormError(err.message || "Too many attempts. Try again in a few minutes.");
      } else {
        setFormError(err?.message || "Could not create your account. Try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-[18px]">
      <Illustration name="auth" className="mx-auto w-[180px] w1000:hidden" />

      <header data-enter className="grid gap-[10px]">
        <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
          <Icon name="user" />
        </span>
        <h1 className="[font:600_22px_var(--display)] tracking-[-0.015em] text-text">Create account</h1>
        <p className="text-muted text-[14px]">Passwords need at least 8 characters.</p>
      </header>

      <form noValidate onSubmit={submit} className="grid gap-[14px]" data-enter>
        <Input
          label="Display name"
          name="displayName"
          autoComplete="name"
          hint="Optional. Shown to people you work with."
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={fieldErrors.displayName}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          hint="Use an address you can access."
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="At least 8 characters."
          required
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
          hint="Re-enter the same password."
          required
        />

        <p role="alert" className="text-bad text-[13px] font-semibold empty:hidden">
          {formError ?? ""}
        </p>

        <Button type="submit" variant="ember" loading={pending} className="w-full justify-center">
          Create account
        </Button>
      </form>

      <p data-enter className="text-center text-muted text-[14px]">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[color:var(--ember-t)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
