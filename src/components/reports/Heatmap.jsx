const DAY = 864e5;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

// Calendar heatmap: weeks columns of 7 rows (Monday first). days: [{ date: "YYYY-MM-DD", value }].
export default function Heatmap({ label, days = [], weeks = 13 }) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = todayMs - (mondayOffset + (weeks - 1) * 7) * DAY;
  const byDay = new Map(days.map((d) => [d.date, d.value]));
  const peak = Math.max(0, ...days.map((d) => d.value));
  const total = days.reduce((n, d) => n + d.value, 0);

  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const t = start + i * DAY;
    const value = byDay.get(dayKey(t)) ?? 0;
    let level;
    if (t > todayMs) level = "f";
    else if (value <= 0 || peak <= 0) level = 0;
    else level = Math.min(4, Math.max(1, Math.ceil((value / peak) * 4)));
    return { i, level };
  });

  return (
    <div className="heat" role="img" aria-label={`${label}: ${total} in ${weeks} weeks`} style={{ "--weeks": weeks }}>
      <div className="heat__grid">
        {cells.map(({ i, level }) => (
          <span
            key={i}
            className={`heat__cell heat__cell--${level}`}
            style={{ gridArea: `${(i % 7) + 1} / ${Math.floor(i / 7) + 1}` }}
          />
        ))}
      </div>
      <div className="heat-key mt-[12px] [&_.heat\_\_cell--0]:bg-well">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heat__cell--${l}`} />
        ))}
        More
      </div>
    </div>
  );
}
