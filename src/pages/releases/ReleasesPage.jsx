// feat(pages/releases/ReleasesPage): plan project releases, track their progress and ship them.
import { useRef, useState } from "react";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteRelease, listReleases, shipRelease } from "../../libs/api/boards.js";
import { formatDate } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useEntry, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import ReleaseFormModal from "./components/ReleaseFormModal.jsx";

const VIEW = "releases";
const idOf = (item) => item?.id ?? item?._id ?? null;
const isShipped = (release) => release.status === "shipped" || Boolean(release.shippedAt);

// Issue progress for one release, from the counts the server returns with it (F.12 meter).
function Progress({ counts }) {
  const total = counts?.items ?? 0;
  const done = counts?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
  <div className="grid gap-[4px] min-w-[120px]">
  <div className="meter">
  <span className="meter__fill meter__fill--spruce block h-full" data-fill="" style={{ width: `${pct}%` }} />
  </div>
  <small className="tnum text-muted text-[12px] font-semibold">
  {total ? `${done} of ${total} done` : "No issues linked"}
  </small>
  </div>
  );
}

export default function ReleasesPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const manage = can("release.manage");
  const releases = usePaged((params) => listReleases(projectId, params));
  const tableRef = useRef(null);
  const [editing, setEditing] = useState(null); // null | "new" | release
  const [shipping, setShipping] = useState(null);
  const [removing, setRemoving] = useState(null);

  useViewEntry(
  VIEW,
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 22, stagger: 0.07 });
  return bindLift(root);
  },
  [releases.status === "success"],
  );

  useEntry(
  tableRef,
  ({ gsap, q, reduced }) => {
  gsap.fromTo(
  q("[data-fill]"),
  { scaleX: 0 },
  { scaleX: 1, transformOrigin: "left", duration: reduced ? 0 : 0.9, ease: "power3.out", clearProps: "transform" },
  );
  },
  [releases.status],
  );

  const rows = releases.items.map((r) => ({ ...r, id: idOf(r) }));

  const columns = [
  { key: "name", label: "Release", render: (r) => <b className="block  truncate font-bold" title={r.name}>{r.name}</b> },
  {
  key: "status",
  label: "Status",
  render: (r) => (
  <Badge variant="status" tone={isShipped(r) ? "spruce" : "plain"} icon={isShipped(r) ? "shipped" : "clock"}>
  {isShipped(r) ? "Shipped" : "Unreleased"}
  </Badge>
  ),
  },
  {
  key: "startDate",
  label: "Start",
  render: (r) => (r.startDate ? formatDate(r.startDate) : <span className="text-muted">Not set</span>),
  },
  {
  key: "releaseDate",
  label: "Release date",
  render: (r) => (r.releaseDate ? formatDate(r.releaseDate) : <span className="text-muted">Not set</span>),
  },
  { key: "progress", label: "Progress", render: (r) => <Progress counts={r.counts} /> },
  ];

  const menu = (row) =>
  manage
  ? [
  { id: "edit", label: "Edit", icon: "edit", onSelect: () => setEditing(row) },
  ...(isShipped(row) ? [] : [{ id: "ship", label: "Ship", icon: "shipped", onSelect: () => setShipping(row) }]),
 "separator",
  { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setRemoving(row) },
  ]
  : [];

  const ship = async () => {
  try {
  await shipRelease(projectId, idOf(shipping));
  toast.success("Release shipped");
  releases.reload();
  } catch {
  // The API client reports failures.
  }
  setShipping(null);
  };

  const remove = async () => {
  try {
  await deleteRelease(projectId, idOf(removing));
  toast.success("Release deleted");
  releases.reload();
  } catch {
  // The API client reports failures.
  }
  setRemoving(null);
  };

  return (
  <>
  <PageHead
  title="Releases"
  sub="Plan releases, follow their progress and ship them."
  actions={
  manage ? (
  <Button variant="ember" icon="plus" onClick={() => setEditing("new")}>
  New release
  </Button>
  ) : null
  }
  />

  <div ref={tableRef}>
  {releases.status === "success" && rows.length === 0 ? (
  <div className="grid justify-items-center">
  <Illustration name="empty" alt="" className="w-[160px] w1000:hidden" />
  </div>
  ) : null}
  <DataTable
  columns={columns}
  rows={rows}
  rowKey="id"
  status={releases.status}
  error={releases.error}
  onRetry={releases.reload}
  empty={{
  icon: "release",
  title: "No releases yet",
  text: "Plan a release, link issues to it and ship it.",
  action: manage ? (
  <Button variant="soft" size="sm" icon="plus" onClick={() => setEditing("new")}>
  New release
  </Button>
  ) : null,
  }}
  rowMenu={manage ? menu : undefined}
  hasMore={releases.hasMore}
  onLoadMore={releases.loadMore}
  loadingMore={releases.loadingMore}
  />
  </div>

  {editing ? (
  <ReleaseFormModal
  open
  onClose={() => setEditing(null)}
  projectId={projectId}
  release={editing === "new" ? null : editing}
  onSaved={() => releases.reload()}
  />
  ) : null}

  {shipping ? (
  <ConfirmDialog
  open
  onClose={() => setShipping(null)}
  title="Ship this release?"
  text={`${shipping.name} is marked as shipped. Its issues are not changed.`}
  confirmLabel="Ship"
  tone="default"
  onConfirm={ship}
  />
  ) : null}

  {removing ? (
  <ConfirmDialog
  open
  onClose={() => setRemoving(null)}
  title="Delete this release?"
  text={`${removing.name} is removed. Its issues stay in the project.`}
  confirmLabel="Delete"
  tone="danger"
  onConfirm={remove}
  />
  ) : null}
  </>
  );
}
