import { useRef, useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import Switch from "../ui/Switch.jsx";
import MarkdownView from "../wiki/MarkdownView.jsx";
import { addComment, deleteComment, listComments, updateComment } from "../../libs/api/issues.js";
import { searchUsers } from "../../libs/api/users.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePaged } from "../../utils/usePaged.js";
import { useMutation } from "../../utils/useMutation.js";
import { relativeTime } from "../../utils/format.js";
import { useEntry, fadeUp } from "../../utils/motion.js";

const idOf = (item) => String(item?.id ?? item?._id);

// Comment thread for one issue. Authors edit their own comments; leads can delete any.
// Internal notes are offered only when canInternal is set (developer and above).
export default function CommentStream({ pid, issueId, canComment = false, canInternal = false, canModerate = false }) {
  const { user } = useAuth();
  const me = user ? idOf(user) : null;
  const thread = usePaged((params) => listComments(pid, issueId, { limit: params.limit, cursor: params.cursor }), {
    issueId,
  });
  const listRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEntry(listRef, ({ q }) => {
    fadeUp(q(".feed__item"), { y: 10, stagger: 0.035, delay: 0.14 });
  }, [thread.status]);

  const add = useMutation(
    () =>
      addComment(pid, issueId, {
        body: draft.trim(),
        ...(canInternal && internal ? { internal: true } : {}),
      }),
    { success: "Comment added", error: (err) => err.message || "Could not add the comment" },
  );
  const save = useMutation((id, body) => updateComment(pid, issueId, id, { body }), {
    success: "Saved",
    error: (err) => err.message || "Could not save the comment",
  });
  const remove = useMutation(
    async (id) => {
      await deleteComment(pid, issueId, id);
      return true;
    },
    { success: "Comment deleted", error: (err) => err.message || "Could not delete the comment" },
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const res = await add.run();
    if (res) {
      thread.setItems((prev) => [...prev, res.data]);
      setDraft("");
      setInternal(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.body.trim()) return;
    const res = await save.run(editing.id, editing.body.trim());
    if (res) {
      thread.setItems((prev) =>
        prev.map((item) => (idOf(item) === editing.id ? { ...item, ...res.data } : item)),
      );
      setEditing(null);
    }
  };

  const confirmDelete = async () => {
    const id = pendingDelete;
    const done = await remove.run(id);
    if (done) {
      thread.setItems((prev) => prev.filter((item) => idOf(item) !== id));
      setPendingDelete(null);
    }
  };

  const mention = (uid) => setDraft((text) => `${text}${text && !/\s$/.test(text) ? " " : ""}@[${uid}] `);

  let list;
  if (thread.status === "loading") {
    list = <Skeleton variant="feed" count={3} />;
  } else if (thread.status === "error") {
    list = <EmptyState tone="error" title="Comments did not load" text={thread.error?.message} onRetry={thread.reload} />;
  } else if (!thread.items.length) {
    list = <EmptyState icon="chat" title="No comments yet" text={canComment ? "Start the conversation below." : undefined} />;
  } else {
    list = (
      <ul ref={listRef} className="feed grid gap-[4px]">
        {thread.items.map((comment) => {
          const id = idOf(comment);
          const mine = me !== null && String(comment.authorId) === me;
          const isEditing = editing?.id === id;
          return (
            <li key={id} className="feed__item flex gap-[12px] py-[12px]">
              <Avatar name={comment.authorName ?? "User"} src={comment.authorAvatar ?? undefined} size="sm" />
              <div className="min-w-0 flex-1 grid gap-[6px]">
                <div className="flex flex-wrap items-center gap-[8px]">
                  <span className="min-w-0 truncate text-[14px] font-semibold text-text">{comment.authorName ?? "Unknown"}</span>
                  <span className="text-[12.5px] text-muted">{relativeTime(comment.createdAt)}</span>
                  {comment.internal ? <Badge variant="badge" tone="saffron">Internal</Badge> : null}
                  <span className="ml-auto flex gap-[4px]">
                    {mine && !isEditing ? (
                      <Button variant="ghost" size="sm" icon="edit" aria-label="Edit comment" onClick={() => setEditing({ id, body: comment.body ?? "" })}>
                        Edit
                      </Button>
                    ) : null}
                    {(mine || canModerate) && !isEditing ? (
                      <Button variant="ghost" size="sm" icon="trash" aria-label="Delete comment" onClick={() => setPendingDelete(id)}>
                        Delete
                      </Button>
                    ) : null}
                  </span>
                </div>
                {isEditing ? (
                  <div className="grid gap-[8px]">
                    <Input
                      as="textarea"
                      label="Edit comment"
                      hideLabel
                      hint="Markdown works. Save applies your changes to this comment."
                      value={editing.body}
                      onChange={(event) => setEditing({ ...editing, body: event.target.value })}
                    />
                    <div className="flex justify-end gap-[8px]">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button variant="ink" size="sm" loading={save.pending} disabled={!editing.body.trim() || save.pending} onClick={saveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MarkdownView text={comment.body ?? ""} className="text-[14.5px]" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="grid gap-[12px]">
      {list}
      {thread.hasMore ? (
        <div>
          <Button variant="soft" size="sm" loading={thread.loadingMore} onClick={thread.loadMore}>
            Show more comments
          </Button>
        </div>
      ) : null}
      {canComment ? (
        <form noValidate onSubmit={submit} className="grid gap-[10px] border-t border-line pt-[14px]">
          <Input
            as="textarea"
            id={`comment-${issueId}`}
            label="Write a comment"
            hideLabel
            placeholder="Write a comment. Markdown works."
            hint={`${draft.length.toLocaleString()} of 20,000 characters`}
            value={draft}
            maxLength={20000}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <div className="flex flex-wrap items-center gap-[12px]">
              <Select
                label="Mention someone"
                hideLabel
                variant="button"
                searchable
                value={null}
                placeholder="Mention"
                options={[]}
                loadOptions={async (q) => {
                  if (!q.trim()) return [];
                  const res = await searchUsers(q.trim());
                  return (Array.isArray(res.data) ? res.data : []).map((u) => ({
                    value: idOf(u),
                    label: u.displayName ?? u.email,
                  }));
                }}
                onChange={mention}
              />
              {canInternal ? (
                <Switch checked={internal} onChange={setInternal} label="Internal note" />
              ) : null}
            </div>
            <Button type="submit" variant="ink" size="sm" loading={add.pending} disabled={!draft.trim()}>
              Comment
            </Button>
          </div>
        </form>
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this comment?"
        text="The comment is removed for everyone on this issue."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
