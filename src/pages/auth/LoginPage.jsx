// feat(pages/auth/LoginPage): sign a user in with email and password and return them to the page they asked for.
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import { toFieldErrors } from "../../utils/formErrors.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

const DEFAULT_TARGET = "/dashboard";

// RequireAuth passes state.from as a location object. A plain string is accepted too.
function targetFrom(from) {
  if (!from) return DEFAULT_TARGET;
  if (typeof from === "string") return from;
  const path = `${from.pathname ?? ""}${from.search ?? ""}${from.hash ?? ""}`;
  return path && !path.startsWith("/login") ? path : DEFAULT_TARGET;
}

function loginMessage(err) {
  if (err?.status === 401) return "Invalid email or password.";
  if (err?.status === 403) return "This account is not active.";
  if (err?.status === 429) return err.message || "Too many attempts. Try again in a few minutes.";
  return err?.message || "Could not sign you in. Try again.";
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const target = targetFrom(location.state?.from);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useViewEntry(
    "login",
    ({ q }) => {
      fadeUp(q("[data-enter]"), { y: 14, stagger: 0.05 });
    },
    [],
  );

  if (status === "authenticated") return <Navigate to={target} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await login(email.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      if (err?.status === 422) {
        const map = toFieldErrors(err.errors);
        setFieldErrors(map);
        if (!Object.keys(map).length) setFormError("Check your email and password.");
      } else {
        setFormError(loginMessage(err));
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
          <Icon name="lock" />
        </span>
        <h1 className="[font:600_22px_var(--display)] tracking-[-0.015em] text-text">Sign in</h1>
        <p className="text-muted text-[14px]">Use your Collabor8r email and password.</p>
      </header>

      <form noValidate onSubmit={submit} className="grid gap-[14px]" data-enter>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          hint="Use the address you registered with."
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={reveal ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="Enter the password you set for this account."
            required
            className="pr-[48px]"
          />
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={reveal ? "eyeOff" : "eye"}
            pressed={reveal}
            aria-label={reveal ? "Hide password" : "Show password"}
            onClick={() => setReveal((r) => !r)}
            className="absolute right-[8px] bottom-[8px]"
          />
        </div>

        <p role="alert" className="text-bad text-[13px] font-semibold empty:hidden">
          {formError ?? ""}
        </p>

        <Button type="submit" variant="ember" loading={pending} className="w-full justify-center">
          Sign in
        </Button>
      </form>

      <p data-enter className="text-center text-muted text-[14px]">
        New to Collabor8r?{" "}
        <Link to="/register" className="font-semibold text-[color:var(--ember-t)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
