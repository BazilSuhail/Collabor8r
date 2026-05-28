// feat(pages/serviceDesk/components/SlaCountdown): show an SLA timer's time left and pause or resume its clock.
import { useEffect, useState } from "react";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Tooltip from "../../../components/ui/Tooltip.jsx";
import { formatDuration } from "../../../utils/format.js";

const HOUR_MS = 60 * 60 * 1000;

// A paused timer freezes at its pause moment. A running timer counts down to dueAt.
function remainingMs(timer, now) {
  const due = new Date(timer.dueAt).getTime();
  if (timer.status === "paused" && timer.pausedAt) return due - new Date(timer.pausedAt).getTime();
  return due - now;
}

const spanText = (ms) => formatDuration(Math.round(Math.abs(ms) / 1000));

export default function SlaCountdown({ timer, canAct = false, busy = false, onToggle }) {
  const running = timer.status === "running";
  const [now, setNow] = useState(() => Date.now());

  // Only a running timer ticks. The interval is cleared when the timer stops or the row unmounts.
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running, timer.id, timer.dueAt]);

  if (timer.status === "met") return <Badge tone="spruce">Met</Badge>;
  if (timer.status === "breached") return <Badge tone="ember">Breached</Badge>;

  const paused = timer.status === "paused";
  const left = remainingMs(timer, now);
  const overdue = left <= 0;
  const tone = overdue ? "ember" : left < HOUR_MS ? "saffron" : "spruce";
  let text;
  if (overdue) text = `Overdue ${spanText(left)}`;
  else if (paused) text = `Paused, ${spanText(left)} left`;
  else text = `${spanText(left)} left`;

  return (
    <span className="inline-flex flex-wrap items-center gap-[8px]">
      <Badge tone={tone} variant="status">
        {text}
      </Badge>
      {canAct ? (
        <Tooltip content={paused ? "Resume the SLA clock" : "Pause the SLA clock"} mode="label">
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={paused ? "play" : "pause"}
            aria-label={paused ? "Resume SLA timer" : "Pause SLA timer"}
            loading={busy}
            disabled={busy}
            onClick={() => onToggle?.(timer)}
          />
        </Tooltip>
      ) : null}
    </span>
  );
}
