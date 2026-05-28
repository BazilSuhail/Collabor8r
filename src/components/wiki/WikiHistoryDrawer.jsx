import { useState } from "react";
import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import MarkdownView from "./MarkdownView.jsx";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { getVersion, listVersions, restoreVersion } from "../../libs/api/wiki.js";
import { relativeTime } from "../../utils/format.js";

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: null, meta: null });

// Page version history. Restoring a version asks for confirmation first.
export default function WikiHistoryDrawer({ open, onClose, pid, pageId, canRestore = false, onRestored }) {
  const [picked, setPicked] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const versions = useResource(
    () => (open ? listVersions(pid, pageId, { limit: 50 }) : NONE),
    [open, pid, pageId],
  );
  const list = Array.isArray(versions.data) ? versions.data : [];
  const activeId = picked ?? (list[0] ? idOf(list[0]) : null);

  const detail = useResource(
    () => (open && activeId ? getVersion(pid, pageId, activeId) : NONE),
    [open, activeId, pid, pageId],
  );

  const restore = useMutation(
    async () => {
      await restoreVersion(pid, pageId, activeId);
      return true;
    },
    { success: "Version restored", error: (err) => err.message || "Could not restore this version" },
  );

  const doRestore = async () => {
    const done = await restore.run();
    if (done) {
      setConfirmOpen(false);
      onRestored?.();
      onClose?.();
    }
  };

  let content;
  if (versions.status === "loading") {
    content = <Skeleton variant="feed" count={4} />;
  } else if (versions.status === "error") {
    content = (
      <EmptyState
        tone="error"
        title="History did not load"
        text={versions.error?.message}
        onRetry={versions.reload}
      />
    );
  } else if (!list.length) {
    content = <EmptyState icon="history" title="No earlier versions" text="Versions appear here after the first edit." />;
  } else {
    content = (
      <div className="grid gap-[16px]">
        <ul aria-label="Versions" className="grid gap-[8px]">
          {list.map((version) => {
            const id = idOf(version);
            const selected = id === activeId;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPicked(id)}
                  className="w-full rounded-[12px] border border-line bg-surface px-[12px] py-[10px] text-left aria-[pressed=true]:bg-well aria-[pressed=true]:border-line-2"
                >
                  <span className="block text-[14px] font-semibold text-text">
                    Version {version.versionNo}
                    {version.changeSummary ? ` · ${version.changeSummary}` : ""}
                  </span>
                  <span className="block text-[12.5px] text-muted">
                    {version.authorName ?? "Unknown"}
                    {version.createdAt ? ` · ${relativeTime(version.createdAt)}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {detail.status === "loading" ? (
          <Skeleton variant="cards" count={1} />
        ) : detail.status === "error" ? (
          <EmptyState tone="error" title="This version did not load" text={detail.error?.message} onRetry={detail.reload} />
        ) : detail.data ? (
          <section aria-label="Version preview" className="grid gap-[12px] rounded-[12px] border border-line p-[14px]">
            <h3 className="[font:600_17px_var(--display)] tracking-[-0.015em]">{detail.data.title}</h3>
            <MarkdownView text={detail.data.body} />
            {canRestore ? (
              <div>
                <Button variant="soft" size="sm" icon="restore" onClick={() => setConfirmOpen(true)}>
                  Restore this version
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <SideModal open={open} onClose={onClose} title="Page history" subtitle="Earlier versions of this page">
        {content}
      </SideModal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Restore this version?"
        text="The page content goes back to this version."
        confirmLabel="Restore"
        tone="default"
        onConfirm={doRestore}
      />
    </>
  );
}
