// feat(pages/settings/components/SessionList): list the devices signed in to the account and let the user sign any of them out.
import { useState } from "react";
import { listSessions, revokeSession } from "../../../libs/api/users.js";
import { useResource } from "../../../utils/useResource.js";
import { useMutation } from "../../../utils/useMutation.js";
import { relativeTime } from "../../../utils/format.js";
import Button from "../../../components/ui/Button.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";

const isMobile = (s) => /mobile|phone|tablet|android|ios|iphone|ipad/i.test(`${s.device ?? ""} ${s.os ?? ""}`);

export default function SessionList() {
  const sessions = useResource(() => listSessions(), []);
  const [revokingId, setRevokingId] = useState(null);
  const revoke = useMutation(async (id) => {
    await revokeSession(id);
    return true;
  }, {
    success: "Session signed out",
    error: (err) => err?.message || "Could not sign that session out.",
  });

  const signOut = async (s) => {
    setRevokingId(s.id);
    const res = await revoke.run(s.id);
    setRevokingId(null);
    if (res === true) {
      sessions.setData((list) => (list ?? []).filter((x) => x.id !== s.id));
    }
  };

  const list = sessions.data ?? [];

  return (
    <section className="card p-[24px] grid gap-[16px]">
      <div>
        <h2 className="[font:600_17px_var(--display)] tracking-[-0.01em] text-text">Sessions</h2>
        <p className="text-muted text-[13.5px]">Devices where you are signed in. Sign one out to end its access.</p>
      </div>

      {sessions.status === "loading" ? (
        <div aria-busy="true">
          <Skeleton variant="feed" count={3} />
        </div>
      ) : null}

      {sessions.status === "error" ? (
        <EmptyState tone="error" title="Sessions did not load" text={sessions.error?.message} onRetry={sessions.reload} />
      ) : null}

      {sessions.status === "success" && !list.length ? (
        <EmptyState icon="laptop" title="No active sessions" text="Devices where you are signed in appear here." />
      ) : null}

      {sessions.status === "success" && list.length ? (
        <ul className="grid">
          {list.map((s) => {
            const title = `${s.os ?? "Unknown system"} · ${s.browser ?? s.device ?? "Browser"}`;
            const seen = relativeTime(s.lastSeenAt);
            const sub = [s.ip ?? "Unknown address", seen ? `Last active ${seen}` : null].filter(Boolean).join(" · ");
            return (
              <li
                key={s.id}
                data-key={s.id}
                className="flex items-center gap-[14px] py-[14px] not-first:border-t not-first:border-line w760:flex-wrap"
              >
                <span className="grid place-items-center size-[40px] flex-none rounded-[12px] bg-well text-text">
                  <Icon name={isMobile(s) ? "mobile" : "laptop"} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text truncate">{title}</p>
                  <p className="text-muted text-[13px] mt-[2px]">{sub}</p>
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  icon="logout"
                  loading={revokingId === s.id}
                  onClick={() => signOut(s)}
                  aria-label={`Sign out ${title}`}
                >
                  Sign out
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
