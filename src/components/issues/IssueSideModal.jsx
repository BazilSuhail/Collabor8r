import { useState } from "react";
import { Link } from "react-router-dom";
import { ProjectProvider, useProject } from "../../context/ProjectContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getIssue, transitionIssue, updateIssue } from "../../libs/api/issues.js";
import { paths } from "../../routes/paths.js";
import { useResource } from "../../utils/useResource.js";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Input from "../ui/Input.jsx";
import SegmentedControl from "../ui/SegmentedControl.jsx";
import SideModal from "../ui/SideModal.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import CommentStream from "./CommentStream.jsx";
import { IssueHistory } from "./HistoryList.jsx";
import IssueFields from "./IssueFields.jsx";
import { idOf, useIssueOptions } from "./IssueSelects.jsx";

const TABS = [
  { value: "comments", label: "Comments" },
  { value: "history", label: "History" },
];

// One side panel for the whole app. Opening another issue while it is open swaps the content of this
// same SideModal (the parent changes issueId, the panel refetches and keeps its place). No second layer.
export default function IssueSideModal({ open, onClose, projectId, issueId, canEdit = false }) {
  const res = useResource(
    () => (open && projectId && issueId ? getIssue(projectId, issueId) : Promise.resolve({ data: null, meta: null })),
    [open, projectId, issueId],
  );
  const issue = res.data;

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title={issue?.key ?? "Issue"}
      subtitle={issue?.typeName}
      headerActions={
        issue ? (
          <Button as={Link} to={paths.issue(projectId, issue.key)} variant="soft" size="sm" icon="external">
            Open full page
          </Button>
        ) : null
      }
    >
      {res.status === "loading" ? <Skeleton variant="cards" count={2} /> : null}
      {res.status === "error" ? (
        <EmptyState tone="error" title="Could not load this issue" text={res.error?.message} onRetry={res.reload} />
      ) : null}
      {res.status === "success" && issue ? (
        <SideBody
          key={idOf(issue)}
          issue={issue}
          projectId={projectId}
          canEdit={canEdit}
          setIssue={res.setData}
          reload={res.reload}
        />
      ) : null}
    </SideModal>
  );
}

// For pages outside a project route (dashboard, my work, calendar): loads the issue's project role and
// passes canEdit from the shared permission helper. No role yet (loading or none) means read only.
export function ProjectIssueSideModal(props) {
  return (
    <ProjectProvider projectId={props.projectId}>
      <RoleGatedModal {...props} />
    </ProjectProvider>
  );
}

function RoleGatedModal(props) {
  const { can } = useProject();
  return <IssueSideModal {...props} canEdit={can("issue.edit")} />;
}

// Body for one issue. Remounted per issue (key), so drafts and the open tab reset on swap.
function SideBody({ issue, projectId, canEdit, setIssue, reload }) {
  const toast = useToast();
  const options = useIssueOptions(projectId, true);
  const [tab, setTab] = useState("comments");
  const [titleDraft, setTitleDraft] = useState(issue.title ?? "");
  const [saveError, setSaveError] = useState(null);
  const id = idOf(issue);

  // Merges a server response into the loaded issue so the next PATCH carries the new version.
  const merge = (updated) => setIssue((cur) => ({ ...cur, ...updated }));

  const handleError = (err, fallback) => {
    if (err?.status === 409) {
      toast.warning("Changed by someone else. Reloaded.");
      reload();
      return;
    }
    setSaveError(err?.message ?? fallback);
  };

  const patchIssue = async (patch) => {
    setSaveError(null);
    try {
      const updated = await updateIssue(projectId, id, { ...patch, version: issue.version });
      merge(updated.data);
      toast.success("Saved");
    } catch (err) {
      handleError(err, "Could not save this change.");
    }
  };

  const moveTo = async (toStatus) => {
    const previous = issue.statusId;
    setSaveError(null);
    try {
      const moved = await transitionIssue(projectId, id, { toStatus });
      merge(moved.data);
      toast.success(`Moved to ${moved.data?.statusName ?? "new status"}`, {
        undo: async () => {
          try {
            const back = await transitionIssue(projectId, id, { toStatus: previous });
            merge(back.data);
          } catch {
            toast.error("Could not undo the move");
          }
        },
      });
    } catch (err) {
      handleError(err, "Could not move this issue.");
    }
  };

  const commitTitle = () => {
    const next = titleDraft.trim();
    if (!next) {
      setTitleDraft(issue.title ?? "");
      return;
    }
    if (next !== issue.title) patchIssue({ title: next });
  };

  return (
    <>
      <div className="grid gap-[6px]">
        <Input
          label="Summary"
          maxLength={255}
          hint={canEdit ? "Saves when you leave the field." : undefined}
          disabled={!canEdit}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
        />
      </div>
      {saveError ? (
        <p role="alert" className="text-bad text-[13px] font-semibold">
          {saveError}
        </p>
      ) : null}
      {options.status === "loading" ? (
        <Skeleton variant="cards" count={1} />
      ) : (
        <IssueFields
          key={id}
          issue={issue}
          options={options.options}
          projectId={projectId}
          disabled={!canEdit}
          onPatch={patchIssue}
          onStatus={moveTo}
        />
      )}
      <SegmentedControl label="Activity" value={tab} onChange={setTab} options={TABS} size="sm" />
      {tab === "comments" ? (
        <CommentStream pid={projectId} issueId={id} canComment={canEdit} />
      ) : (
        <IssueHistory projectId={projectId} issueId={id} />
      )}
    </>
  );
}
