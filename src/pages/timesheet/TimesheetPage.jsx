// feat(pages/timesheet/TimesheetPage): show logged time per issue and day for a chosen person and week.
import { useState } from "react";
import LogWorkModal from "../../components/issues/LogWorkModal.jsx";
import PageHead from "../../components/layout/PageHead.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useProject } from "../../context/ProjectContext.jsx";
import { getTimesheet } from "../../libs/api/issues.js";
import { searchUsers } from "../../libs/api/users.js";
import { cn } from "../../utils/cn.js";
import { formatDuration } from "../../utils/format.js";
import { bindLift, cardRise, fadeUp, useViewEntry } from "../../utils/motion.js";
import { useResource } from "../../utils/useResource.js";

const VIEW = "timesheet";
const DAY_MS = 86400000;
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const startOfWeek = (date) => addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -((date.getDay() + 6) % 7));
const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const isoDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const personOption = (u) => ({ value: u.id ?? u._id, label: u.displayName ?? u.email ?? "User" });

async function loadTimesheet(pid, params) {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await getTimesheet(pid, { limit: PAGE_LIMIT, ...params, ...(cursor ? { cursor } : {}) });
    items.push(...(res.data ?? []));
    cursor = res.meta?.nextCursor ?? null;
    pages += 1;
  } while (cursor && pages < MAX_PAGES);
  return { data: items, meta: { capped: Boolean(cursor) } };
}

// One row per issue, seven day cells Monday to Sunday.
function buildRows(worklogs, weekStart) {
  const rows = new Map();
  for (const w of worklogs) {
    const day = localDay(w.date);
    if (!day) continue;
    const index = Math.round((day - weekStart) / DAY_MS);
    if (index < 0 || index > 6) continue;
    const id = w.issueId ?? w.issue?.id ?? w.issue?._id ?? w.issueKey ?? "unknown";
    if (!rows.has(id)) {
      rows.set(id, {
        id,
        key: w.issueKey ?? w.issue?.key ?? "Issue",
        summary: w.issueSummary ?? w.issue?.summary ?? "",
        perDay: Array.from({ length: 7 }, () => 0),
        total: 0,
      });
    }
    const row = rows.get(id);
    row.perDay[index] += w.seconds ?? 0;
    row.total += w.seconds ?? 0;
  }
  return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export default function TimesheetPage() {
  const { projectId, can } = useProject();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [userId, setUserId] = useState("");
  const [people, setPeople] = useState([]);
  const [logOpen, setLogOpen] = useState(false);

  const from = isoDay(weekStart);
  const to = isoDay(addDays(weekStart, 6));
  const timesheet = useResource(
    () => loadTimesheet(projectId, { from, to, ...(userId ? { userId } : {}) }),
    [projectId, from, to, userId],
  );

  useViewEntry(
    VIEW,
    ({ q, root }) => {
      fadeUp(q(".head__sub"), { y: 8 });
      cardRise(q(".card"), { y: 22, stagger: 0.07 });
      return bindLift(root);
    },
    [timesheet.status === "success"],
  );

  const loadPeople = async (query) => {
    const res = await searchUsers(query);
    const list = (res.data ?? []).map(personOption);
    setPeople((prev) => [...prev, ...list.filter((o) => !prev.some((p) => p.value === o.value))]);
    return list;
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = isoDay(new Date());
  const rows = buildRows(timesheet.data ?? [], weekStart);
  const dayTotals = days.map((_, i) => rows.reduce((sum, r) => sum + r.perDay[i], 0));
  const grand = dayTotals.reduce((sum, s) => sum + s, 0);
  const weekLabel = `${addDays(weekStart, 0).toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${addDays(weekStart, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const shift = (n) => setWeekStart((d) => addDays(d, n * 7));

  return (
    <>
      <PageHead
        title="Timesheet"
        sub="Logged time per issue and day for the chosen person and week."
        actions={
          can("worklog.edit") ? (
            <Button variant="soft" icon="time" onClick={() => setLogOpen(true)}>
              Log work
            </Button>
          ) : null
        }
      />

      <div className="toolbar mb-[16px]">
        <div className="flex items-center gap-[6px]">
          <Button variant="ghost" iconOnly icon="chevL" aria-label="Previous week" onClick={() => shift(-1)} />
          <span className="tnum font-bold whitespace-nowrap px-[6px]">{weekLabel}</span>
          <Button variant="ghost" iconOnly icon="chevR" aria-label="Next week" onClick={() => shift(1)} />
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            This week
          </Button>
        </div>
        <span className="toolbar__spacer" />
        <Select
          variant="button"
          searchable
          label="Person"
          value={userId}
          onChange={setUserId}
          options={[{ value: "", label: "Everyone" }, ...people]}
          loadOptions={loadPeople}
        />
      </div>

      {timesheet.status === "error" ? (
        <div className="card">
          <EmptyState tone="error" title="Could not load the timesheet" onRetry={timesheet.reload} />
        </div>
      ) : null}
      {timesheet.status === "success" && !rows.length ? (
        <div className="card">
          <Illustration name="empty" alt="" className="mx-auto w-[180px] w1000:hidden" />
          <EmptyState icon="timesheet" title="No time logged this week" text="Pick another week or person, or log work on an issue." />
        </div>
      ) : null}

      {timesheet.status === "loading" || (timesheet.status === "success" && rows.length) ? (
        <div className="card overflow-x-auto p-[10px]">
          <table className="tbl w-full">
            <caption className="sr">Logged time for the selected week</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left">Issue</th>
                {days.map((d) => {
                  const key = isoDay(d);
                  return (
                    <th
                      key={key}
                      scope="col"
                      className={cn("text-right whitespace-nowrap", key === todayKey && "bg-surface-2")}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                    </th>
                  );
                })}
                <th scope="col" className="text-right">Total</th>
              </tr>
            </thead>
            {timesheet.status === "loading" ? (
              <Skeleton variant="rows" count={5} cols={9} />
            ) : (
              <>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} data-key={row.id}>
                      <th scope="row" className="text-left font-semibold">
                        <span className="text-muted mr-[6px]">{row.key}</span>
                        {row.summary}
                      </th>
                      {row.perDay.map((s, i) => {
                        const key = isoDay(days[i]);
                        return (
                          <td key={key} className={cn("text-right tabular-nums", key === todayKey && "bg-surface-2")}>
                            {s ? formatDuration(s) : <span className="text-faint">–</span>}
                          </td>
                        );
                      })}
                      <td className="text-right tabular-nums font-bold">{formatDuration(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" className="text-left font-bold">Total</th>
                    {dayTotals.map((s, i) => (
                      <td key={isoDay(days[i])} className="text-right tabular-nums font-bold">
                        {s ? formatDuration(s) : "–"}
                      </td>
                    ))}
                    <td className="text-right tabular-nums font-bold">{formatDuration(grand)}</td>
                  </tr>
                </tfoot>
              </>
            )}
          </table>
          {timesheet.meta?.capped ? (
            <p className="mt-[10px] text-muted text-[12.5px] font-semibold">
              Showing the first {PAGE_LIMIT * MAX_PAGES} entries for this week.
            </p>
          ) : null}
        </div>
      ) : null}

      {logOpen ? (
        <LogWorkModal open onClose={() => setLogOpen(false)} projectId={projectId} onSaved={() => timesheet.reload()} />
      ) : null}
    </>
  );
}
