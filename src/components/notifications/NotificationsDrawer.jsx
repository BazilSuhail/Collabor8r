import { useState } from "react";
import { Link } from "react-router-dom";
import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import NotificationList from "./NotificationList.jsx";
import { useShell } from "../../context/ShellContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listNotifications, markAllRead, markRead } from "../../libs/api/notifications.js";
import { useResource } from "../../utils/useResource.js";
import { paths } from "../../routes/paths.js";

const EMPTY = { data: [], meta: null };
const idOf = (n) => n.id ?? n._id;

// Opened from the Header bell. Loads only while open.
export default function NotificationsDrawer({ open, onClose }) {
  const { refreshUnread } = useShell();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const list = useResource(() => (open ? listNotifications({ limit: 20 }) : Promise.resolve(EMPTY)), [open]);
  const items = list.data ?? [];
  const hasUnread = items.some((n) => !n.readAt);
  const now = () => new Date().toISOString();

  const markOne = async (id) => {
    setBusy(id);
    try {
      await markRead(id);
      list.setData((prev) => (prev ?? []).map((n) => (idOf(n) === id ? { ...n, readAt: now() } : n)));
      refreshUnread();
    } finally {
      setBusy(null);
    }
  };

  const markEvery = async () => {
    setBusy("all");
    try {
      await markAllRead();
      list.setData((prev) => (prev ?? []).map((n) => ({ ...n, readAt: n.readAt ?? now() })));
      refreshUnread();
      toast.success("All caught up");
    } finally {
      setBusy(null);
    }
  };

  const footer = (
    <>
      <Button as={Link} to={paths.notifications()} variant="ghost" size="sm" onClick={onClose}>
        View all
      </Button>
      <Button variant="soft" size="sm" icon="readAll" loading={busy === "all"} disabled={!hasUnread} onClick={markEvery}>
        Mark all read
      </Button>
    </>
  );

  return (
    <SideModal open={open} onClose={onClose} title="Notifications" subtitle="Mentions, assignments and updates" footer={footer}>
      {list.status === "loading" && (
        <div aria-busy="true">
          <Skeleton variant="feed" count={5} />
        </div>
      )}
      {list.status === "error" && (
        <EmptyState tone="error" title="Could not load notifications" onRetry={list.reload} />
      )}
      {list.status === "success" && items.length === 0 && (
        <EmptyState icon="bellOff" title="You are all caught up" text="New mentions and updates will appear here." />
      )}
      {list.status === "success" && items.length > 0 && (
        <NotificationList items={items} busyId={busy} onRead={markOne} />
      )}
    </SideModal>
  );
}
