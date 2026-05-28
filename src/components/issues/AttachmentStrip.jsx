import { useState } from "react";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { Icon } from "../ui/Icon.jsx";
import {
  deleteAttachment,
  getDownloadUrl,
  getUploadUrl,
  listAttachments,
  registerAttachment,
  uploadFile,
} from "../../libs/api/issues.js";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { useToast } from "../../context/ToastContext.jsx";
import { relativeTime } from "../../utils/format.js";
import { cn } from "../../utils/cn.js";

const MAX_BYTES = 25 * 1024 * 1024;
const idOf = (item) => String(item?.id ?? item?._id);

const formatSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Issue attachments. Upload runs getUploadUrl, then a PUT to the signed URL, then registerAttachment.
export default function AttachmentStrip({ pid, issueId, canUpload = false, canDelete = false }) {
  const toast = useToast();
  const attachments = useResource(() => listAttachments(pid, issueId, { limit: 100 }), [pid, issueId]);
  const items = Array.isArray(attachments.data) ? attachments.data : [];
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);

  const uploadOne = async (file) => {
    if (file.size > MAX_BYTES) {
      toast.error("That is too large");
      return;
    }
    const mime = file.type || "application/octet-stream";
    try {
      const { data: target } = await getUploadUrl(pid, issueId, { name: file.name, mime, size: file.size });
      await uploadFile(target.uploadUrl, file);
      await registerAttachment(pid, issueId, {
        storageKey: target.storageKey,
        name: file.name,
        mime,
        size: file.size,
      });
      toast.success(`Uploaded ${file.name}`);
    } catch (err) {
      toast.error(err.status === 413 ? "That is too large" : "Upload failed");
    }
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    setPending((n) => n + files.length);
    for (const file of files) {
      await uploadOne(file);
      setPending((n) => n - 1);
    }
    attachments.reload();
  };

  const download = useMutation((att) => getDownloadUrl(pid, issueId, idOf(att)), {
    error: (err) => err.message || "Could not open this file",
  });
  const openFile = async (att) => {
    const res = await download.run(att);
    if (res?.data?.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
  };

  const remove = useMutation(
    async (att) => {
      await deleteAttachment(pid, issueId, idOf(att));
      return true;
    },
    { success: "Attachment deleted", error: (err) => err.message || "Could not delete this attachment" },
  );
  const confirmDelete = async () => {
    const done = await remove.run(pendingDelete);
    if (done) {
      setPendingDelete(null);
      attachments.reload();
    }
  };

  let list;
  if (attachments.status === "loading") {
    list = (
      <div className="grid gap-[8px]" aria-busy="true">
        <span className="sr-only">Loading attachments</span>
        {[0, 1].map((n) => (
          <div key={n} className="h-[44px] animate-pulse rounded-[12px] bg-well motion-reduce:animate-none" />
        ))}
      </div>
    );
  } else if (attachments.status === "error") {
    list = (
      <EmptyState
        tone="error"
        title="Attachments did not load"
        text={attachments.error?.message}
        onRetry={attachments.reload}
      />
    );
  } else if (!items.length) {
    list = (
      <EmptyState
        icon="attach"
        title="No attachments"
        text={canUpload ? "Add a file to share context on this issue." : "Nothing is attached yet."}
      />
    );
  } else {
    list = (
      <ul aria-label="Attachments" className="grid gap-[8px]">
        {items.map((att) => (
          <li
            key={idOf(att)}
            className="flex items-center gap-[10px] rounded-[12px] border border-line bg-surface px-[12px] py-[8px]"
          >
            <Icon name="file" cls="text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-text">{att.name}</p>
              <p className="text-[12.5px] text-muted">
                {formatSize(att.size)}
                {att.createdAt ? ` · ${relativeTime(att.createdAt)}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="download" aria-label={`Download ${att.name}`} onClick={() => openFile(att)}>
              Download
            </Button>
            {canDelete ? (
              <Button variant="ghost" size="sm" icon="trash" aria-label={`Delete ${att.name}`} onClick={() => setPendingDelete(att)}>
                Delete
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-[12px]">
      {canUpload ? (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-wrap items-center justify-between gap-[10px] rounded-[12px] border border-dashed p-[12px] ease-[var(--ease)] transition-colors",
            dragging ? "border-ember bg-[color:var(--ember-soft)]" : "border-line-2 bg-surface-2",
          )}
        >
          <span className="text-[14px] text-muted">
            {pending > 0 ? `Uploading ${pending} file${pending === 1 ? "" : "s"}...` : "Drop files here or choose files. Up to 25 MB each."}
          </span>
          <span className="btn btn--ghost btn--sm">Choose files</span>
          <input
            type="file"
            multiple
            className="sr-only"
            disabled={pending > 0}
            aria-label="Choose files to attach"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      ) : null}
      {list}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this attachment?"
        text={`${pendingDelete?.name ?? "This file"} is removed from the issue.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
