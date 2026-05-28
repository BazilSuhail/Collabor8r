// feat(pages/issues/IssueDetailPage): show one issue in full and edit its fields, comments, attachments, links, time and approvals.
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import Input from "../../components/ui/Input.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Select from "../../components/ui/Select.jsx";
import SplitTitle from "../../components/SplitTitle.jsx";
// CONTRACT-GAP: the components below are owned by H07, H09 and H10. Props are assumed as noted in each line.
import CommentStream from "../../components/issues/CommentStream.jsx";
import { IssueHistory } from "../../components/issues/HistoryList.jsx";
import WorklogList from "../../components/issues/WorklogList.jsx"; // { projectId, issueId, onChanged }
import LogWorkModal from "../../components/issues/LogWorkModal.jsx"; // { open, onClose, projectId, issueId, onSaved }
import AttachmentStrip from "../../components/issues/AttachmentStrip.jsx"; // { projectId, issueId }
import LinkedIssues from "../../components/issues/LinkedIssues.jsx"; // { projectId, issueId }
import ApprovalsCard from "../../components/issues/ApprovalsCard.jsx"; // { projectId, issueId }
import ExternalLinksCard from "../../components/issues/ExternalLinksCard.jsx"; // { projectId, issueId }
import MarkdownEditor from "../../components/wiki/MarkdownEditor.jsx"; // { value, onChange }
import MarkdownView from "../../components/wiki/MarkdownView.jsx"; // { text }
import { useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listReleases, listSprints } from "../../libs/api/boards.js";
import { deleteIssue, getIssueByKey, listChildren, listWorklogs, transitionIssue, updateIssue } from "../../libs/api/issues.js";
import { searchUsers } from "../../libs/api/users.js";
import { paths } from "../../routes/paths.js";
import { formatDuration, parseDuration } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { priorityTone, statusTone, typeIcon } from "../../utils/issueVisuals.js";
import { useResource } from "../../utils/useResource.js";
import { usePaged } from "../../utils/usePaged.js";

const TABS = [
  { value: "comments", label: "Comments" },
  { value: "history", label: "History" },
  { value: "work", label: "Work log" },
];

const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });
const dateValue = (iso) => (iso ? String(iso).slice(0, 10) : "");
const textOf = (description) =>
  typeof description === "string" ? description : (description?.text ?? "");

export default function IssueDetailPage() {
  const { issueKey } = useParams();
  const navigate = useNavigate();
  const { projectId, statuses, priorities, labels, can } = useProject();
  const toast = useToast();
  const [tab, setTab] = useState("comments");
  const [logging, setLogging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [checkDraft, setCheckDraft] = useState("");
  const [pointsDraft, setPointsDraft] = useState(null);
  const [estimateDraft, setEstimateDraft] = useState(null);
  const [worklogTick, setWorklogTick] = useState(0);

  const fetchIssue = () => getIssueByKey(projectId, issueKey);
  const issueRes = useResource(fetchIssue, [projectId, issueKey]);
  const issue = useMemo(() => (issueRes.data ? withId(issueRes.data) : null), [issueRes.data]);
  const issueId = issue?.id ?? null;
  const ready = issueRes.status === "success";

  const children = useResource(
    () => (issueId ? listChildren(projectId, issueId) : Promise.resolve({ data: [], meta: null })),
    [projectId, issueId],
  );
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const releases = useResource(() => listReleases(projectId, { limit: 100 }), [projectId]);

  // Every field save sends the version read last. A 409 reloads and keeps the local draft.
  const save = async (patch, message = "Saved") => {
    if (!issue) return false;
    try {
      const res = await updateIssue(projectId, issue.id, { ...patch, version: issue.version });
      issueRes.setData(res.data);
      toast.success(message);
      return true;
    } catch (err) {
      if (err.status === 409) {
        toast.warning("Changed by someone else. Reloaded.");
        issueRes.reload();
        return false;
      }
      toast.error(err.errors?.[0]?.message ?? err.message ?? "Could not save");
      return false;
    }
  };

  // Status moves go through transition, which takes no version.
  const changeStatus = async (statusId) => {
    try {
      await transitionIssue(projectId, issue.id, { toStatus: statusId });
      const name = statuses.find((s) => idOf(s) === statusId)?.name ?? "the new status";
      toast.success(`Moved to ${name}`);
      issueRes.reload();
    } catch (err) {
      toast.error(err.message ?? "Could not move the issue");
    }
  };

  const commitTitle = async (event) => {
    event.preventDefault();
    const next = titleDraft.trim();
    if (!next) return;
    if (next === issue.title || (await save({ title: next }, "Title saved"))) setEditingTitle(false);
  };

  const commitDescription = async () => {
    if (await save({ description: descDraft }, "Description saved")) setEditingDesc(false);
  };

  const checklist = issue?.checklist ?? [];
  const saveChecklist = (items) =>
    save(
      {
        checklist: items.map((c) => ({ ...(c.id ? { id: String(c.id) } : {}), text: c.text, done: Boolean(c.done) })),
      },
      "Checklist saved",
    );

  const commitEstimate = async () => {
    if (estimateDraft === null) return;
    const seconds = parseDuration(estimateDraft);
    const value = Number.isFinite(seconds) ? seconds : null;
    setEstimateDraft(null);
    if (value !== (issue.estimateSec ?? null)) await save({ estimateSec: value });
  };

  const commitPoints = async () => {
    if (pointsDraft === null) return;
    const value = pointsDraft === "" ? null : Number(pointsDraft);
    setPointsDraft(null);
    if (value !== (issue.storyPoints ?? null)) await save({ storyPoints: value });
  };

  const loadUsers = async (text) => {
    const res = await searchUsers(text);
    return (res.data ?? []).map((u) => ({ value: idOf(u), label: u.displayName }));
  };

  const removeIssue = async () => {
    try {
      await deleteIssue(projectId, issue.id);
      toast.success(`Deleted ${issue.key}`);
      navigate(paths.issues(projectId));
    } catch (err) {
      toast.error(err.message ?? "Could not delete the issue");
      throw err;
    }
  };

  useViewEntry(
    "issue-detail",
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8, delay: 0.12 });
      cardRise(q(".card"), { y: 26, stagger: 0.07, delay: 0.14 });
      return bindLift(root);
    },
    [ready],
  );

  if (issueRes.status === "error") {
    const notFound = issueRes.error?.status === 404;
    return (
      <div className="card">
        {notFound ? (
          <EmptyState
            icon="task"
            title="Issue not found"
            text="It may have been deleted, or the key is wrong."
            action={
              <Button as={Link} to={paths.issues(projectId)} variant="ghost" size="sm" icon="chevL">
                Back to issues
              </Button>
            }
          />
        ) : (
          <EmptyState tone="error" title="Could not load this issue" onRetry={issueRes.reload} />
        )}
      </div>
    );
  }

  if (!issue) {
    return (
      <div aria-busy="true" className="grid gap-[var(--gap)] grid-cols-[minmax(0,1fr)_340px] w1100:grid-cols-[minmax(0,1fr)]">
        <span className="sr">Loading</span>
        <div className="card grid gap-[12px] p-[24px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[16px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none w-[60%]" />
          ))}
        </div>
        <div className="card grid gap-[12px] p-[24px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-[34px] rounded-[12px] bg-well animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    );
  }

  const statusOptions = statuses.map((s) => ({ value: idOf(s), label: s.name }));
  const priorityOptions = priorities.map((p) => ({ value: idOf(p), label: p.name }));
  const sprintOptions = [
    { value: "", label: "No sprint" },
    ...(sprints.data ?? []).filter((s) => s.state !== "closed").map((s) => ({ value: idOf(s), label: s.name })),
  ];
  const releaseOptions = (releases.data ?? []).map((r) => ({ value: idOf(r), label: r.name }));
  const labelOptions = labels.map((l) => ({ value: l.name, label: l.name }));
  const description = textOf(issue.description);

  return (
    <>
      <header className="head">
        <div className="head__lead">
          <Button as={Link} to={paths.issues(projectId)} variant="ghost" size="sm" icon="chevL">
            Issues
          </Button>
          <div className="head__text min-w-0">
            {editingTitle ? (
              <form onSubmit={commitTitle} className="grid gap-[8px]">
                <Input
                  label="Title"
                  hideLabel
                  hint="Press Save title to keep the change."
                  value={titleDraft}
                  maxLength={255}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-[8px]">
                  <Button type="submit" variant="ember" size="sm">
                    Save title
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTitle(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <SplitTitle text={issue.title} />
                <p className="head__sub flex flex-wrap items-center gap-[10px]">
                  <span className="tnum font-bold">{issue.key}</span>
                  <Badge variant="status" tone={statusTone(issue.statusCategory)}>
                    {issue.statusName}
                  </Badge>
                  {can("issue.edit") ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="pen"
                      onClick={() => {
                        setTitleDraft(issue.title);
                        setEditingTitle(true);
                      }}
                    >
                      Edit title
                    </Button>
                  ) : null}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="head__actions">
          {can("issue.delete") ? (
            <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-[var(--gap)] grid-cols-[minmax(0,1fr)_340px] w1100:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-[var(--gap)] min-w-0 content-start">
          <section className="card p-[20px] grid gap-[12px]" aria-labelledby="issue-desc">
            <div className="flex items-center justify-between gap-[10px]">
              <h2 id="issue-desc" className="flex items-center gap-[8px] text-[15px] font-bold">
                <Icon name="note" cls="text-muted" />
                Description
              </h2>
              {can("issue.edit") && !editingDesc ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="pen"
                  onClick={() => {
                    setDescDraft(description);
                    setEditingDesc(true);
                  }}
                >
                  Edit
                </Button>
              ) : null}
            </div>
            {editingDesc ? (
              <>
                <MarkdownEditor value={descDraft} onChange={setDescDraft} />
                <div className="flex justify-end gap-[10px]">
                  <Button variant="ghost" size="sm" onClick={() => setEditingDesc(false)}>
                    Cancel
                  </Button>
                  <Button variant="ember" size="sm" onClick={commitDescription}>
                    Save description
                  </Button>
                </div>
              </>
            ) : description ? (
              <MarkdownView text={description} />
            ) : (
              <p className="text-muted text-[13.5px]">No description yet.</p>
            )}
          </section>

          <section className="card p-[20px] grid gap-[10px]" aria-labelledby="issue-checklist">
            <h2 id="issue-checklist" className="flex items-center gap-[8px] text-[15px] font-bold">
              <Icon name="checklist" cls="text-muted" />
              Checklist
            </h2>
            {checklist.length === 0 ? (
              <EmptyState icon="checklist" title="No checklist items" text="Add steps below to track progress." />
            ) : null}
            <ul className="grid gap-[6px]">
              {checklist.map((item, index) => (
                <li key={item.id ?? index} className="flex items-center gap-[10px] min-w-0">
                  <input
                    type="checkbox"
                    className="w-[18px] h-[18px] accent-[color:var(--spruce)]"
                    checked={Boolean(item.done)}
                    disabled={!can("issue.edit")}
                    aria-label={`Mark ${item.text} as done`}
                    onChange={() =>
                      saveChecklist(checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c)))
                    }
                  />
                  <span className={`flex-1 min-w-0 text-[13.5px] ${item.done ? "text-muted line-through" : ""}`}>
                    {item.text}
                  </span>
                  {can("issue.edit") ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon="close"
                      aria-label={`Remove ${item.text}`}
                      onClick={() => saveChecklist(checklist.filter((_, i) => i !== index))}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
            {can("issue.edit") ? (
              <form
                className="flex gap-[8px]"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = checkDraft.trim();
                  if (!text) return;
                  if (await saveChecklist([...checklist, { text, done: false }])) setCheckDraft("");
                }}
              >
                <Input
                  label="New checklist item"
                  hideLabel
                  placeholder="Add an item"
                  value={checkDraft}
                  maxLength={500}
                  onChange={(e) => setCheckDraft(e.target.value)}
                />
                <Button type="submit" variant="soft" size="sm" icon="plus">
                  Add
                </Button>
              </form>
            ) : null}
          </section>

          {children.status === "success" && (children.data ?? []).length > 0 ? (
            <section className="card p-[20px] grid gap-[10px]" aria-labelledby="issue-children">
              <h2 id="issue-children" className="flex items-center gap-[8px] text-[15px] font-bold">
                <Icon name="subtask" cls="text-muted" />
                Child issues
              </h2>
              <ul className="grid gap-[4px]">
                {children.data.map((child) => (
                  <li key={idOf(child)}>
                    <Link
                      to={paths.issue(projectId, child.key)}
                      className="flex items-center gap-[10px] rounded-ctl py-[8px] px-[10px] hover:bg-well"
                    >
                      <Icon name={typeIcon({ icon: child.typeIcon, name: child.typeName, hierarchy: child.hierarchy })} cls="text-muted" />
                      <span className="tnum text-muted text-[12.5px] font-bold">{child.key}</span>
                      <span className="flex-1 min-w-0 truncate text-[13.5px] font-semibold">{child.title}</span>
                      <Badge variant="status" tone={statusTone(child.statusCategory)}>
                        {child.statusName}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-[12px] min-w-0">
            <SegmentedControl label="Activity" value={tab} onChange={setTab} options={TABS} />
            <div className="card p-[20px] min-w-0">
              {tab === "comments" ? (
                <CommentStream
                  pid={projectId}
                  issueId={issue.id}
                  canComment={can("comment.create")}
                  canInternal={can("issue.edit")}
                  canModerate={can("issue.delete")}
                />
              ) : null}
              {tab === "history" ? <IssueHistory projectId={projectId} issueId={issue.id} /> : null}
              {tab === "work" ? (
                <div className="grid gap-[12px]">
                  {can("worklog.edit") ? (
                    <div className="flex justify-end">
                      <Button variant="soft" size="sm" icon="plus" onClick={() => setLogging(true)}>
                        Log work
                      </Button>
                    </div>
                  ) : null}
                  <IssueWorklogs projectId={projectId} issueId={issue.id} reloadKey={worklogTick} />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="grid gap-[var(--gap)] content-start min-w-0">
          <section className="card p-[20px] grid gap-[14px]" aria-label="Issue fields">
            <Select
              label="Status"
              value={String(issue.statusId ?? "")}
              options={statusOptions}
              disabled={!can("issue.edit")}
              onChange={(v) => v && v !== String(issue.statusId) && changeStatus(v)}
            />
            <Select
              label="Assignee"
              placeholder="Unassigned"
              value={issue.assigneeId ? String(issue.assigneeId) : null}
              searchable
              loadOptions={loadUsers}
              disabled={!can("issue.edit")}
              onChange={(v) => save({ assigneeId: v || null })}
            />
            <Select
              label="Priority"
              placeholder="No priority"
              value={issue.priorityId ? String(issue.priorityId) : null}
              options={priorityOptions}
              disabled={!can("issue.edit")}
              onChange={(v) => save({ priorityId: v || null })}
            />
            <Select
              label="Sprint"
              value={issue.sprintId ? String(issue.sprintId) : ""}
              options={sprintOptions}
              disabled={!can("issue.edit")}
              onChange={(v) => save({ sprintId: v || null })}
            />
            <Select
              label="Releases"
              hint="Every release this work ships in."
              placeholder="No release"
              multiple
              value={(issue.releaseIds ?? []).map(String)}
              options={releaseOptions}
              disabled={!can("issue.edit")}
              onChange={(v) => save({ releaseIds: v })}
            />
            <Select
              label="Labels"
              hint="Pick one or more labels."
              placeholder="No labels"
              multiple
              value={issue.labels ?? []}
              options={labelOptions}
              disabled={!can("issue.edit")}
              onChange={(v) => save({ labels: v })}
            />
            <Input
              label="Due date"
              type="date"
              hint="Leave empty to clear."
              value={dateValue(issue.dueDate)}
              disabled={!can("issue.edit")}
              onChange={(e) =>
                save({ dueDate: e.target.value ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString() : null })
              }
            />
            <Input
              label="Estimate"
              hint="For example 1h 30m"
              value={estimateDraft ?? (issue.estimateSec ? formatDuration(issue.estimateSec) : "")}
              disabled={!can("issue.edit")}
              onChange={(e) => setEstimateDraft(e.target.value)}
              onBlur={commitEstimate}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <Input
              label="Story points"
              type="number"
              hint="Half steps such as 0.5 are fine."
              min="0"
              step="any"
              value={pointsDraft ?? (issue.storyPoints ?? "")}
              disabled={!can("issue.edit")}
              onChange={(e) => setPointsDraft(e.target.value)}
              onBlur={commitPoints}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
            <div className="grid gap-[4px]">
              <span className="field__label">Type</span>
              <span className="inline-flex items-center gap-[8px] text-[13.5px]">
                <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} cls="text-muted" />
                {issue.typeName}
              </span>
            </div>
            {issue.priorityName ? (
              <Badge variant="badge" tone={priorityTone(issue.priorityRank)}>
                {issue.priorityName}
              </Badge>
            ) : null}
          </section>

          <AttachmentStrip
            pid={projectId}
            issueId={issue.id}
            canUpload={can("attachment.edit")}
            canDelete={can("attachment.edit")}
          />
          <LinkedIssues pid={projectId} issueId={issue.id} canEdit={can("link.edit")} />
          <ApprovalsCard projectId={projectId} issueId={issue.id} can={can("issue.edit")} />
          <ExternalLinksCard projectId={projectId} issueId={issue.id} can={can("link.edit")} />
        </aside>
      </div>

      <LogWorkModal
        open={logging}
        onClose={() => setLogging(false)}
        projectId={projectId}
        issueId={issue.id}
        onSaved={() => {
          issueRes.reload();
          setWorklogTick((t) => t + 1);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${issue.key}?`}
        text="Deleted issues cannot be restored."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeIssue}
      />
    </>
  );
}

function IssueWorklogs({ projectId, issueId, reloadKey }) {
  const w = usePaged((p) => listWorklogs(projectId, issueId, p), { projectId, issueId, reloadKey });
  return (
    <WorklogList
      items={w.items}
      status={w.status}
      onRetry={w.reload}
      hasMore={w.hasMore}
      loadingMore={w.loadingMore}
      onLoadMore={w.loadMore}
      showIssue={false}
    />
  );
}
