import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import LinkPickerModal from "./LinkPickerModal.jsx";
import { deleteLink, listLinks } from "../../libs/api/issues.js";
import { useResource } from "../../utils/useResource.js";
import { useMutation } from "../../utils/useMutation.js";
import { paths } from "../../routes/paths.js";

const idOf = (item) => String(item?.id ?? item?._id);

const TYPE_LABEL = {
  blocks: "Blocks",
  isBlockedBy: "Is blocked by",
  relates: "Relates to",
  duplicates: "Duplicates",
  isDuplicatedBy: "Is duplicated by",
  clones: "Clones",
};

// Links from this issue to others in the project. Unlinking asks first.
export default function LinkedIssues({ pid, issueId, canEdit = false }) {
  const links = useResource(() => listLinks(pid, issueId), [pid, issueId]);
  const items = Array.isArray(links.data) ? links.data : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const remove = useMutation(
    async (linkId) => {
      await deleteLink(pid, issueId, linkId);
      return true;
    },
    { success: "Unlinked", error: (err) => err.message || "Could not remove this link" },
  );

  const confirmRemove = async () => {
    const done = await remove.run(pendingRemove);
    if (done) {
      setPendingRemove(null);
      links.reload();
    }
  };

  let list;
  if (links.status === "loading") {
    list = <Skeleton variant="feed" count={2} />;
  } else if (links.status === "error") {
    list = <EmptyState tone="error" title="Links did not load" text={links.error?.message} onRetry={links.reload} />;
  } else if (!items.length) {
    list = <EmptyState icon="issueLink" title="No linked issues" text="Link related or blocking work to this issue." />;
  } else {
    list = (
      <ul aria-label="Linked issues" className="grid gap-[8px]">
        {items.map((link) => {
          const id = idOf(link);
          return (
            <li key={id} className="flex flex-wrap items-center gap-[10px] rounded-[12px] border border-line bg-surface px-[12px] py-[8px]">
              <Badge variant="badge" tone="plain">
                {TYPE_LABEL[link.type] ?? link.type}
              </Badge>
              <Link
                to={paths.issue(pid, link.key)}
                className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text hover:underline"
              >
                <span className="mr-[6px] text-muted tabular-nums">{link.key}</span>
                {link.title}
              </Link>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="unlink"
                  aria-label={`Remove link to ${link.key}`}
                  onClick={() => setPendingRemove(id)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="grid gap-[12px]">
      <div className="flex items-center justify-between gap-[10px]">
        <h3 className="text-[14px] font-semibold text-text">Linked issues</h3>
        {canEdit ? (
          <Button variant="soft" size="sm" icon="issueLink" onClick={() => setPickerOpen(true)}>
            Link issue
          </Button>
        ) : null}
      </div>
      {list}
      <LinkPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pid={pid}
        issueId={issueId}
        onLinked={links.reload}
      />
      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        title="Remove this link?"
        text="The two issues stay as they are. Only the link goes."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
