import { useRef } from "react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Dropdown from "../ui/Dropdown.jsx";
import { formatDate, formatNumber } from "../../utils/format.js";
import { gsap, scaled, useEntry } from "../../utils/motion.js";

export const METRIC_LABEL = {
  itemCount: "Items done",
  points: "Points done",
  timeSpent: "Hours logged",
  custom: "Custom",
};

export const GOAL_STATUS = {
  on_track: { label: "On track", tone: "spruce" },
  at_risk: { label: "At risk", tone: "saffron" },
  off_track: { label: "Off track", tone: "ember" },
  done: { label: "Done", tone: "spruce" },
};

// One goal: gauge, current against target, due date and an action menu.
export default function GoalCard({ goal, canProgress, canManage, onProgress, onEdit, onDelete }) {
  const ref = useRef(null);
  const progress = Math.max(0, Math.min(100, goal.progress ?? 0));
  const tier = progress >= 70 ? "hi" : progress >= 40 ? "mid" : "lo";
  const status = GOAL_STATUS[goal.status] ?? GOAL_STATUS.on_track;
  const unit = goal.unit ? ` ${goal.unit}` : "";

  useEntry(
    ref,
    ({ q }) => {
      gsap.fromTo(
        q(".dial__v"),
        { strokeDasharray: "0 100" },
        { strokeDasharray: `${progress} 100`, duration: scaled(1), ease: "power3.out" },
      );
    },
    [progress],
  );

  const items = [
    canProgress && { id: "progress", label: "Record progress", icon: "gauge", onSelect: () => onProgress(goal) },
    canManage && { id: "edit", label: "Edit", icon: "edit", onSelect: () => onEdit(goal) },
    canManage && "separator",
    canManage && { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => onDelete(goal) },
  ].filter(Boolean);

  return (
    <article ref={ref} className="card p-[18px] flex flex-col gap-[14px] min-w-0" data-lift="">
      <header className="flex items-start gap-[12px] min-w-0">
        <span
          className={`dial dial--${tier} shrink-0`}
          role="img"
          aria-label={`${progress} percent of target`}
          style={{ "--v": progress }}
        >
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" />
            <circle className="dial__v" cx="18" cy="18" r="15" pathLength="100" />
          </svg>
          <b>{progress}</b>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="[font:600_16px/1.25_var(--display)] [letter-spacing:-0.01em] truncate">{goal.title}</h3>
          <p className="card__sub">{METRIC_LABEL[goal.metric] ?? goal.metric}</p>
        </div>
        {items.length > 0 && (
          <Dropdown
            label="Goal actions"
            items={items}
            trigger={(t) => <Button iconOnly variant="ghost" size="sm" icon="more" aria-label="Goal actions" {...t} />}
          />
        )}
      </header>
      <p className="num [font:600_clamp(22px,1.9vw,26px)/1.1_var(--display)] tracking-[-0.02em]">
        {formatNumber(goal.current ?? 0)}
        <span className="text-muted text-[14px] font-semibold tracking-normal">
          {` / ${formatNumber(goal.target ?? 0)}${unit}`}
        </span>
      </p>
      <footer className="flex flex-wrap items-center justify-between gap-[8px] mt-auto pt-[12px] border-t border-line">
        <span className="text-muted text-[12.5px] font-semibold">
          {goal.dueDate ? `Due ${formatDate(goal.dueDate)}` : "No due date"}
        </span>
        <Badge variant="status" tone={status.tone}>
          {status.label}
        </Badge>
      </footer>
    </article>
  );
}
