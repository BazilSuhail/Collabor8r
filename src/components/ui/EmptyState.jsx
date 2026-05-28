import { cn } from "../../utils/cn.js";
import Button from "./Button.jsx";
import { Icon } from "./Icon.jsx";

export default function EmptyState({
  icon = "inbox",
  title,
  text,
  action,
  tone = "empty",
  onRetry,
  className,
  ...rest
}) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : undefined}
      className={cn("empty", className)}
      {...rest}
    >
      <Icon name={icon} />
      <p className={cn("empty__title", isError && "text-bad")}>{title}</p>
      {text ? <p className="empty__text">{text}</p> : null}
      {action || (isError && onRetry) ? (
        <div className="mt-[8px] flex flex-wrap justify-center gap-[8px]">
          {action}
          {isError && onRetry ? (
            <Button variant="ghost" size="sm" icon="refresh" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
