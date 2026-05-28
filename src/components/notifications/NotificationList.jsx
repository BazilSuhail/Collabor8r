import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";
import { cn } from "../../utils/cn.js";
import { relativeTime } from "../../utils/format.js";

const KIND_ICON = {
  mention: "mention",
  assigned: "userCheck",
  commented: "chat",
  statusChanged: "workflow",
  dueSoon: "calendar",
  overdue: "alert",
  approval: "approval",
  slaBreach: "sla",
  invite: "mail",
  joinDecision: "userCheck",
  achievement: "trophy",
  digest: "inbox",
};

// Rows for the notifications drawer and page. Unread rows get a dot and a mark-as-read button.
export default function NotificationList({ items, onRead, busyId }) {
  return (
    <ul className="grid gap-[4px]" aria-label="Notifications">
      {items.map((n) => {
        const id = n.id ?? n._id;
        const unread = !n.readAt;
        return (
          <li key={id} data-key={id} className="flex items-start gap-[12px] rounded-[14px] p-[12px] hover:bg-surface-2">
            <span className="grid place-items-center flex-none w-[32px] h-[32px] rounded-[10px] bg-well text-muted">
              <Icon name={KIND_ICON[n.kind] ?? "bell"} cls="w-[16px] h-[16px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[14px] text-text", unread ? "font-bold" : "font-semibold")}>{n.title || n.body}</p>
              {n.title && n.body && <p className="text-[13px] text-muted">{n.body}</p>}
              <p className="text-[12px] text-faint mt-[2px]">
                <time dateTime={n.createdAt}>{relativeTime(n.createdAt)}</time>
                {n.actorName ? ` · ${n.actorName}` : ""}
              </p>
            </div>
            {unread && (
              <>
                <span className="sr">Unread</span>
                <span className="w-[8px] h-[8px] mt-[7px] flex-none rounded-[50%] bg-ember" aria-hidden="true" />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="check"
                  aria-label="Mark as read"
                  loading={busyId === id}
                  onClick={() => onRead(id)}
                />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
