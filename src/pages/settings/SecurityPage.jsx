// feat(pages/settings/SecurityPage): change the password, review sessions, manage API tokens and sign out everywhere.
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useViewEntry, fadeUp } from "../../utils/motion.js";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import ChangePasswordForm from "./components/ChangePasswordForm.jsx";
import SessionList from "./components/SessionList.jsx";
import TokenList from "./components/TokenList.jsx";

export default function SecurityPage() {
  const { logoutAll } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useViewEntry(
    "security",
    ({ q }) => {
      fadeUp(q(".card"), { y: 20, stagger: 0.07 });
    },
    [],
  );

  return (
    <>
      <PageHead title="Security" sub="Password, signed-in devices and API tokens." />

      <div className="grid gap-[var(--gap)]">
        <ChangePasswordForm />
        <SessionList />
        <TokenList />

        <section className="card p-[24px] grid gap-[14px] border-[color:var(--bad)]">
          <div>
            <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-bad">Sign out everywhere</h2>
            <p className="text-muted text-[13.5px]">
              Every device signed in to your account is signed out, including this one.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="danger" icon="logout" onClick={() => setConfirmOpen(true)}>
              Sign out everywhere
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out everywhere?"
        text="Every device, including this one, will need to sign in again."
        confirmLabel="Sign out everywhere"
        tone="danger"
        onConfirm={() => logoutAll()}
      />
    </>
  );
}
