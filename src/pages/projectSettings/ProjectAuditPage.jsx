// feat(pages/projectSettings/ProjectAuditPage): let project admins review and filter the project audit log.
import { useEffect, useState } from "react";
import PageHead from "../../components/layout/PageHead.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Select from "../../components/ui/Select.jsx";
import SideModal from "../../components/ui/SideModal.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { emptyCopy } from "../../metadata/empty.js";
import { listProjectAudit } from "../../libs/api/projects.js";
import { searchUsers } from "../../libs/api/users.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { formatDateTime } from "../../utils/format.js";
import { usePaged } from "../../utils/usePaged.js";
import ProjectSettingsNav from "./components/ProjectSettingsNav.jsx";

const ALL = "";

export default function ProjectAuditPage() {
  const { projectId, status } = useProject();
  const ready = status === "success";

  useViewEntry(
 "project-audit",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26, stagger: 0.07 });
  return bindLift(root);
  },
  [ready],
  );

  const [action, setAction] = useState(ALL);
  const [actorId, setActorId] = useState(ALL);
  const [seenActions, setSeenActions] = useState([]);
  const [detail, setDetail] = useState(null);

  const audit = usePaged(
  (p) => listProjectAudit(projectId, p),
  { ...(action ? { action } : {}), ...(actorId ? { actorId } : {}) },
  );

  // Keeps every action seen so far in the filter, so choosing one does not drop the others.
  useEffect(() => {
  const incoming = audit.items.map((row) => row.action).filter(Boolean);
  if (!incoming.length) return;
  setSeenActions((prev) => {
  const next = [...new Set([...prev, ...incoming])].sort();
  return next.length === prev.length ? prev : next;
  });
  }, [audit.items]);

  const actionOptions = [
  { value: ALL, label: "All actions" },
  ...seenActions.map((a) => ({ value: a, label: a })),
  ];

  const columns = [
  { key: "at", label: "When", render: (row) => <span className="text-muted">{formatDateTime(row.at)}</span> },
  {
  key: "actor",
  label: "Actor",
  render: (row) => (
  <span className="inline-flex items-center gap-[8px] min-w-0">
  <Avatar name={row.actorName || "System"} size="xs" />
  <span className="text-text truncate">{row.actorName || "System"}</span>
  </span>
  ),
  },
  { key: "action", label: "Action", render: (row) => <Badge className=" truncate">{row.action}</Badge> },
  {
  key: "target",
  label: "Target",
  render: (row) => (
  <span className="grid min-w-0">
  <span className="text-text truncate">{row.targetName || row.targetType || "-"}</span>
  {row.targetType && row.targetName ? <span className="text-muted text-[12.5px]">{row.targetType}</span> : null}
  </span>
  ),
  },
  ];

  return (
  <>
  <PageHead title="Audit log" sub="Changes made in this project" />
  <ProjectSettingsNav active="audit" />

  <section className="card p-[20px] grid gap-[16px]" aria-label="Filters">
  <div className="grid grid-cols-2 gap-[var(--gap)] w1000:grid-cols-1">
  <Select label="Action" value={action} options={actionOptions} onChange={setAction} hint="Show one kind of change" />
  <Select
  label="Actor"
  value={actorId}
  searchable
  placeholder="Anyone"
  loadOptions={(q) =>
  searchUsers(q)
  .then((res) => [
  { value: ALL, label: "Anyone" },
  ...res.data.map((u) => ({ value: u.id, label: u.displayName, description: u.email })),
  ])
  .catch(() => [{ value: ALL, label: "Anyone" }])
  }
  hint="Show changes made by one person"
  onChange={setActorId}
  />
  </div>

  <DataTable
  label="Project audit log"
  rowKey="_id"
  columns={columns}
  rows={audit.items}
  status={audit.status}
  error={audit.error}
  onRetry={audit.reload}
  hasMore={audit.hasMore}
  onLoadMore={audit.loadMore}
  loadingMore={audit.loadingMore}
  onRowClick={(row) => setDetail(row)}
  empty={emptyCopy("project-audit")}
  />
  </section>

  <SideModal
  open={Boolean(detail)}
  onClose={() => setDetail(null)}
  title={detail?.action ?? "Audit entry"}
  subtitle={detail ? `${formatDateTime(detail.at)} by ${detail.actorName || "System"}` : undefined}
  >
  <div className="grid gap-[16px]">
  <section className="grid gap-[8px]">
  <h3 className="flex items-center gap-[6px] text-[13px] font-bold uppercase tracking-[.07em] text-muted"><Icon name="history" />Before</h3>
  <pre className="bg-surface-2 rounded-[14px] p-[12px] text-[12.5px] text-text overflow-auto whitespace-pre-wrap break-words">
  {JSON.stringify(detail?.before ?? null, null, 2)}
  </pre>
  </section>
  <section className="grid gap-[8px]">
  <h3 className="flex items-center gap-[6px] text-[13px] font-bold uppercase tracking-[.07em] text-muted"><Icon name="check" />After</h3>
  <pre className="bg-surface-2 rounded-[14px] p-[12px] text-[12.5px] text-text overflow-auto whitespace-pre-wrap break-words">
  {JSON.stringify(detail?.after ?? null, null, 2)}
  </pre>
  </section>
  </div>
  </SideModal>
  </>
  );
}
