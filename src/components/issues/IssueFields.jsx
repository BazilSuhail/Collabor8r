import { useState } from "react";
import Input from "../ui/Input.jsx";
import { formatDuration, parseDuration } from "../../utils/format.js";
import {
  AssigneeSelect,
  LabelSelect,
  PrioritySelect,
  ReleaseSelect,
  SprintSelect,
  StatusSelect,
} from "./IssueSelects.jsx";

// Fact fields in the issue side panel. Every change goes through onPatch or onStatus, which the
// parent (IssueSideModal) saves with the loaded version. Type is not editable after create.
// Mount with key={idOf(issue)} so the local estimate and points drafts reset when the panel swaps issues.
export default function IssueFields({ issue, options, projectId, disabled = false, onPatch, onStatus }) {
  const [estimate, setEstimate] = useState(() => (issue.estimateSec ? formatDuration(issue.estimateSec) : ""));
  const [estimateError, setEstimateError] = useState(null);
  const [points, setPoints] = useState(issue.storyPoints ?? "");

  const commitEstimate = () => {
    const raw = estimate.trim();
    if (!raw) {
      setEstimateError(null);
      if (issue.estimateSec) onPatch({ estimateSec: null });
      return;
    }
    const seconds = parseDuration(raw);
    if (seconds == null) {
      setEstimateError("Use a time like 1h 30m or 2d.");
      return;
    }
    setEstimateError(null);
    if (seconds !== issue.estimateSec) onPatch({ estimateSec: seconds });
  };

  const commitPoints = () => {
    const next = points === "" ? null : Number(points);
    if (next !== (issue.storyPoints ?? null)) onPatch({ storyPoints: next });
  };

  const assignee = issue.assigneeId
    ? { id: issue.assigneeId, name: issue.assignee?.name ?? "Assigned" }
    : null;

  return (
    <div className="grid gap-[14px]">
      <StatusSelect
        value={issue.statusId}
        statuses={options.statuses}
        onChange={(next) => next && next !== issue.statusId && onStatus(next)}
        disabled={disabled}
      />
      <AssigneeSelect
        value={issue.assigneeId ?? ""}
        current={assignee}
        disabled={disabled}
        onChange={(next) => next !== (issue.assigneeId ?? null) && onPatch({ assigneeId: next })}
      />
      <PrioritySelect
        value={issue.priorityId ?? ""}
        priorities={options.priorities}
        disabled={disabled}
        onChange={(next) => (next || null) !== (issue.priorityId ?? null) && onPatch({ priorityId: next || null })}
      />
      <SprintSelect
        projectId={projectId}
        value={issue.sprintId ?? ""}
        disabled={disabled}
        onChange={(next) => next !== (issue.sprintId ?? null) && onPatch({ sprintId: next })}
      />
      <ReleaseSelect
        projectId={projectId}
        value={issue.releaseIds ?? []}
        disabled={disabled}
        onChange={(next) => onPatch({ releaseIds: next })}
      />
      <LabelSelect
        value={issue.labels ?? []}
        labels={options.labels}
        disabled={disabled}
        onChange={(next) => onPatch({ labels: next })}
      />
      <Input
        type="date"
        label="Due date"
        hint="Leave empty to clear."
        disabled={disabled}
        value={issue.dueDate ? String(issue.dueDate).slice(0, 10) : ""}
        onChange={(e) => onPatch({ dueDate: e.target.value || null })}
      />
      <Input
        label="Estimate"
        hint="For example 1h 30m or 2d."
        disabled={disabled}
        value={estimate}
        error={estimateError ?? undefined}
        onChange={(e) => setEstimate(e.target.value)}
        onBlur={commitEstimate}
      />
      <Input
        type="number"
        min="0"
        step="0.5"
        label="Story points"
        hint="Half steps such as 0.5 are fine. Leave empty to clear."
        disabled={disabled}
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        onBlur={commitPoints}
      />
    </div>
  );
}

