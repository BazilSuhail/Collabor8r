import { cn } from "../../utils/cn.js";

const BLOCK = "block rounded-[12px] bg-well animate-pulse motion-reduce:animate-none";
const CELL_WIDTHS = ["w-[55%]", "w-[35%]", "w-[45%]", "w-[25%]", "w-[40%]", "w-[30%]", "w-[50%]", "w-[20%]"];
const LOADING = <span className="sr">Loading</span>;

export default function Skeleton({ variant = "rows", count = 6, cols = 4 }) {
  const n = Math.max(1, count);

  if (variant === "rows") {
    const width = (c) => CELL_WIDTHS[c % CELL_WIDTHS.length];
    return (
      <tbody aria-busy="true">
        {Array.from({ length: n }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: Math.max(1, cols) }, (_, c) => (
              <td key={c}>
                {c === 0 && r === 0 ? LOADING : null}
                <span className={cn(BLOCK, "h-[12px]", width(c))} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (variant === "feed") {
    return (
      <div className="feed" aria-busy="true">
        {LOADING}
        {Array.from({ length: n }, (_, i) => (
          <div className="feed__item" key={i}>
            <span className={cn(BLOCK, "w-[28px] h-[28px] rounded-[50%] shrink-0")} />
            <div className="grid gap-[6px] flex-1 min-w-0">
              <span className={cn(BLOCK, "h-[12px] w-[70%]")} />
              <span className={cn(BLOCK, "h-[10px] w-[30%]")} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "kpi") {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[var(--gap)]" aria-busy="true">
        {LOADING}
        {Array.from({ length: n }, (_, i) => (
          <div className="card kpi grid gap-[10px] p-[18px]" key={i}>
            <span className={cn(BLOCK, "h-[12px] w-[45%]")} />
            <span className={cn(BLOCK, "h-[28px] w-[60%]")} />
            <span className={cn(BLOCK, "h-[10px] w-[35%]")} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[var(--gap)]" aria-busy="true">
      {LOADING}
      {Array.from({ length: n }, (_, i) => (
        <div className="card grid gap-[10px] p-[18px]" key={i}>
          <span className={cn(BLOCK, "h-[14px] w-[60%]")} />
          <span className={cn(BLOCK, "h-[12px] w-[40%]")} />
        </div>
      ))}
    </div>
  );
}
