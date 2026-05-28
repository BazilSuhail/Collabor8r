// feat(pages/calendar/components/AgendaList): list the month's events day by day, with a clear state when nothing is due.
import { cn } from "../../../utils/cn.js";
import { formatDate } from "../../../utils/format.js";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { KIND } from "./MonthGrid.jsx";

const ROW =
  "grid w-full text-left items-center gap-[12px] p-[10px_12px] bg-surface-2 border border-line rounded-[14px] [grid-template-columns:3px_minmax(0,1fr)] hover:border-line-2";

// days: [{ key, date, events: [{ id, title, key?, kind, tone, issueRef?, done? }] }], sorted by key.
export default function AgendaList({ days, todayKey, onOpen }) {
  if (!days.length) {
    return (
      <EmptyState
        icon="calendar"
        title="Nothing due this month"
        text="Issues, sprints and releases in this month show up here."
      />
    );
  }

  return (
    <div className="cal-ag grid gap-[18px]">
      {days.map((day) => {
        const isToday = day.key === todayKey;
        const weekday = day.date.toLocaleDateString("en-US", { weekday: "short" });
        return (
          <section key={day.key} className="cal-ag__day grid gap-[8px]" data-key={`ag-${day.key}`}>
            <header className="flex items-center gap-[12px]">
              <span
                className={cn(
                  "cal-ag__date bg-surface-2 border border-line rounded-[12px] grid justify-items-center w-[44px] py-[4px] leading-[1.1]",
                  isToday && "bg-ember text-[color:var(--on-ember)] border-transparent",
                )}
              >
                <b className="[font:600_18px_var(--display)]">{day.date.getDate()}</b>
                <small className="text-[10.5px] font-bold uppercase tracking-[0.04em]">{weekday}</small>
              </span>
              <h3 className="[font:600_16px_var(--display)] tracking-[-0.01em]">
                {isToday ? "Today" : formatDate(day.date, { dateStyle: "full" })}
              </h3>
              <span className="ml-auto text-muted text-[12.5px] font-semibold">
                {day.events.length} event{day.events.length === 1 ? "" : "s"}
              </span>
            </header>
            <ul className="cal-rows grid gap-[6px] pl-[56px] w760:pl-0 list-none m-0 p-0">
              {day.events.map((ev) => {
                const meta = KIND[ev.kind] ?? KIND.issue;
                const body = (
                  <>
                    <i
                      className={cn(
                        "cal-bar",
                        `cal-bar--${ev.tone}`,
                        "bg-[color:var(--k)] rounded-[3px] self-stretch w-[3px]",
                      )}
                      aria-hidden="true"
                    />
                    <span className="grid min-w-0 gap-[3px]">
                      <b
                        className={cn(
                          "whitespace-nowrap text-ellipsis overflow-hidden font-bold",
                          ev.done && "text-muted line-through",
                        )}
                      >
                        {ev.title}
                      </b>
                      <small className="text-muted text-[12px] font-semibold">
                        {ev.key ? `${ev.key} · ` : ""}
                        {meta.label}
                      </small>
                    </span>
                  </>
                );
                return (
                  <li key={ev.id} className={cn("cal-row", ev.done && "is-done")} data-key={`ev-${ev.id}`}>
                    {ev.issueRef ? (
                      <button type="button" className={cn(ROW, "cursor-pointer")} data-ev={ev.id} onClick={() => onOpen(ev)}>
                        {body}
                      </button>
                    ) : (
                      <div className={ROW}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
