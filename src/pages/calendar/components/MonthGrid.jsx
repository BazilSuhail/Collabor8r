// feat(pages/calendar/components/MonthGrid): lay out one month as a Monday-first grid of day cells with event chips.
import { cn } from "../../../utils/cn.js";
import Tooltip from "../../../components/ui/Tooltip.jsx";

// Event kinds: the tone sets the --k variables in calendar.css (cal-ev--<tone>).
export const KIND = {
  issue: { tone: "iris", label: "Due" },
  overdue: { tone: "ember", label: "Overdue" },
  sprint: { tone: "spruce", label: "Sprint" },
  release: { tone: "saffron", label: "Release" },
};

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local calendar day as YYYY-MM-DD. Used as the key for every day map.
export function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

// Six Monday-first weeks that cover the month.
export function buildGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i),
  );
}

function EventChip({ ev, onOpen }) {
  const cls = cn(
    "cal-ev flex w-full min-w-0 h-[22px] items-center gap-[5px] px-[7px] rounded-[7px] text-left whitespace-nowrap text-[11.5px] font-bold",
    "bg-[color:var(--k-soft)] text-[color:var(--k-t)]",
    `cal-ev--${ev.tone}`,
    ev.done && "is-done opacity-[0.55] line-through",
  );
  const label = (
    <span className="min-w-0 overflow-hidden text-ellipsis font-semibold text-text">{ev.title}</span>
  );

  if (!ev.issueRef) return <span className={cls}>{label}</span>;

  return (
    <Tooltip content={ev.key ? `${ev.key} · ${ev.title}` : ev.title}>
      <button type="button" className={cn(cls, "cursor-pointer")} data-ev={ev.id} onClick={() => onOpen(ev)}>
        {label}
      </button>
    </Tooltip>
  );
}

// events: Map of dayKey -> [{ id, title, key?, tone, done?, issueRef? }]. Only issue events are clickable.
export default function MonthGrid({ month, events, todayKey, onOpen, gridRef, label }) {
  const cells = buildGrid(month);
  const current = month.getMonth();

  return (
    <div className="cal-month grid gap-[6px]">
      <div
        className="cal-dow grid grid-cols-[repeat(7,minmax(0,1fr))] gap-[6px] text-[12px] font-bold text-muted w760:gap-[4px] w760:text-center w760:text-[11px]"
        aria-hidden="true"
      >
        {DAY_NAMES.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div
        className="cal-cells grid grid-cols-[repeat(7,minmax(0,1fr))] auto-rows-[112px] gap-[6px] w1360:auto-rows-[106px] w760:auto-rows-[88px] w760:gap-[4px]"
        role="group"
        aria-label={label}
        ref={gridRef}
      >
        {cells.map((day) => {
          const key = dayKey(day);
          const list = events.get(key) ?? [];
          const outside = day.getMonth() !== current;
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              data-day={key}
              className={cn(
                "cal-day bg-surface-2 border border-line rounded-[14px] p-[6px_5px_5px] min-w-0 flex flex-col gap-[3px] overflow-hidden",
                outside && "is-out opacity-[0.55]",
                isToday && "is-today [box-shadow:inset_0_0_0_1.5px_var(--ember)]",
              )}
            >
              <span
                className={cn(
                  "cal-day__num self-start rounded-full grid place-items-center min-w-[26px] h-[26px] px-[4px] text-[13px] font-bold tnum",
                  isToday ? "bg-ember text-[color:var(--on-ember)]" : outside ? "text-faint" : "text-text",
                )}
              >
                {day.getDate()}
              </span>
              <div className="cal-day__evs grid min-w-0 gap-[3px] overflow-y-auto">
                {list.map((ev) => (
                  <EventChip key={ev.id} ev={ev} onOpen={onOpen} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
