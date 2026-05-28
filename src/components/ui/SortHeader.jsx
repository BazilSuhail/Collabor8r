import { cn } from "../../utils/cn.js";
import { Icon } from "./Icon.jsx";

export default function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
  ...rest
}) {
  const active = sort?.key === sortKey;
  const dir = active ? sort.dir : null;
  const ariaSort = dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";
  const icon = dir === "asc" ? "up" : dir === "desc" ? "downArr" : "upDown";
  return (
    <th aria-sort={ariaSort} className={className} {...rest}>
      <button
        type="button"
        onClick={() => onSort?.(sortKey)}
        className={cn("inline-flex items-center gap-[4px]", active ? "text-text" : "text-muted")}
      >
        {label}
        <Icon name={icon} cls="w-[12px] h-[12px]" />
      </button>
    </th>
  );
}
