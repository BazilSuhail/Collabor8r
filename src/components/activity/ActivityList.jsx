import Avatar from "../ui/Avatar.jsx";
import { relativeTime } from "../../utils/format.js";

const KIND_TEXT = {
  issueCreated: "created",
  issueUpdated: "updated",
  statusChanged: "moved",
  commentAdded: "commented on",
  sprintStarted: "started a sprint",
  sprintClosed: "closed a sprint",
  memberAdded: "added a member",
  memberRemoved: "removed a member",
  releaseShipped: "shipped a release",
  pageUpdated: "updated a wiki page",
};

// Project activity feed rows. Read only.
export default function ActivityList({ items }) {
  return (
    <ol className="grid gap-[4px]" aria-label="Recent activity">
      {items.map((a) => {
        const id = a.id ?? a._id ?? `${a.at}-${a.kind}-${a.itemKey ?? ""}`;
        return (
          <li key={id} data-key={id} className="flex items-start gap-[12px] rounded-[14px] p-[12px] hover:bg-surface-2">
            <Avatar name={a.actorName ?? "Someone"} src={a.actorAvatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-text">
                <b className="font-semibold">{a.actorName ?? "Someone"}</b> {a.summary ?? KIND_TEXT[a.kind] ?? "changed"}
                {a.itemKey ? ` ${a.itemKey}` : ""}
              </p>
              {a.itemTitle && <p className="text-[13px] text-muted truncate">{a.itemTitle}</p>}
              <p className="text-[12px] text-faint mt-[2px]">
                <time dateTime={a.at}>{relativeTime(a.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
