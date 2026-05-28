// feat(pages/forms/FormsPage): list a project's intake forms, share their public links and review submissions.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHead from "../../components/layout/PageHead.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { deleteForm, listForms } from "../../libs/api/forms.js";
import { EMPTY } from "../../metadata/empty.js";
import { paths } from "../../routes/paths.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { usePaged } from "../../utils/usePaged.js";
import SubmissionsDrawer from "./components/SubmissionsDrawer.jsx";

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchForms = ({ pid, ...p }) => listForms(pid, p).then(withIds);
const publicUrl = (token) => `${window.location.origin}/f/${token}`;

export default function FormsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const navigate = useNavigate();
  const forms = usePaged(fetchForms, { pid: projectId });
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsFor, setSubsFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const canManage = can("form.manage");
  const canReview = can("issue.edit");
  const ready = forms.status === "success";

  useViewEntry(
 "forms",
  ({ q, root }) => {
  fadeUp(q(".head__sub"), { y: 8 });
  cardRise(q(".card"), { y: 26 });
  return bindLift(root);
  },
  [ready],
  );

  const copyLink = async (form) => {
  if (!form.publicToken) return;
  try {
  await navigator.clipboard.writeText(publicUrl(form.publicToken));
  toast.success("Link copied");
  } catch {
  toast.error("Could not copy the link");
  }
  };

  const confirmDelete = async () => {
  try {
  await deleteForm(projectId, deleting.id);
  toast.success("Form deleted");
  setDeleting(null);
  forms.reload();
  } catch {
  // The API layer shows the failure. The dialog stays open so the user can retry.
  }
  };

  const openSubmissions = (form) => {
  setSubsFor(form);
  setSubsOpen(true);
  };

  const rowMenu = (row) => [
  ...(canManage ? [{ id: "edit", label: "Edit", icon: "edit", onSelect: () => navigate(paths.form(projectId, row.id)) }] : []),
  ...(canReview ? [{ id: "subs", label: "Submissions", icon: "documents", onSelect: () => openSubmissions(row) }] : []),
  ...(row.publicToken ? [{ id: "copy", label: "Copy link", icon: "link", onSelect: () => copyLink(row) }] : []),
  ...(canManage
  ? ["separator", { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleting(row) }]
  : []),
  ];

  const columns = [
  {
  key: "name",
  label: "Form",
  render: (row) =>
  canManage ? (
  <Link to={paths.form(projectId, row.id)} className="font-semibold text-text hover:underline">
  {row.name}
  </Link>
  ) : (
  <span className="font-semibold text-text">{row.name}</span>
  ),
  },
  {
  key: "link",
  label: "Public link",
  render: (row) =>
  row.publicToken ? (
  <span className="flex items-center gap-[8px] min-w-0">
  <span className="text-muted truncate ">/f/{row.publicToken}</span>
  <Button iconOnly variant="ghost" size="sm" icon="share" aria-label={`Copy public link for ${row.name}`} onClick={() => copyLink(row)} />
  </span>
  ) : (
  <span className="text-faint">No link</span>
  ),
  },
  { key: "submissionCount", label: "Submissions", align: "right", render: (row) => row.submissionCount ?? 0 },
  {
  key: "isPublic",
  label: "Status",
  render: (row) => (
  <Badge variant="status" tone={row.isPublic ? "spruce" : "plain"}>
  {row.isPublic ? "Active" : "Paused"}
  </Badge>
  ),
  },
  ];

  return (
  <>
  <PageHead
  title="Forms"
  sub="Intake forms turn outside requests into project issues."
  actions={
  canManage ? (
  <Button as={Link} to={paths.formNew(projectId)} variant="ember" icon="plus" magnetic>
  New form
  </Button>
  ) : null
  }
  />
  <DataTable
  label="Forms"
  columns={columns}
  rows={forms.items}
  status={forms.status}
  error={forms.error}
  onRetry={forms.reload}
  empty={{ ...EMPTY.forms, action: canManage ? <Button as={Link} to={paths.formNew(projectId)} variant="ember" size="sm" icon="plus">New form</Button> : null }}
  rowMenu={rowMenu}
  hasMore={forms.hasMore}
  onLoadMore={forms.loadMore}
  loadingMore={forms.loadingMore}
  />
  <SubmissionsDrawer open={subsOpen} onClose={() => setSubsOpen(false)} projectId={projectId} form={subsFor} />
  <ConfirmDialog
  open={!!deleting}
  onClose={() => setDeleting(null)}
  title="Delete form?"
  text={`"${deleting?.name ?? ""}" and its public link stop working.`}
  confirmLabel="Delete"
  tone="danger"
  onConfirm={confirmDelete}
  />
  </>
  );
}
