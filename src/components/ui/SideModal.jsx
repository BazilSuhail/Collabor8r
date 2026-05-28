import { useId } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { cn } from "../../utils/cn.js";
import { SCRIM } from "./Modal.jsx";

export default function SideModal({
  open,
  onClose,
  title,
  subtitle,
  side = "right",
  size = "md",
  headerActions,
  footer,
  initialFocus,
  onBeforeClose,
  children,
}) {
  const titleId = useId();
  const subId = useId();
  const width = size === "lg" ? "w-[min(720px,100vw_-_24px)]" : "w-[min(480px,100vw_-_24px)]";
  const edge = side === "left" ? "justify-start" : "justify-end";

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={subtitle ? subId : undefined}
      motion="side"
      scrimClass={cn(SCRIM, "w900:left-[var(--side-w)]")}
      side={side}
      placement={`side-${side}`}
      initialFocus={initialFocus}
      onBeforeClose={onBeforeClose}
      wrapClass={cn("items-stretch p-[12px] w760:items-end w760:p-0 w760:justify-center", edge)}
      panelClass={cn(
        "relative flex flex-col bg-float border border-line shadow-[var(--shadow-pop)] rounded-[15px] overflow-auto max-h-full h-[calc(100dvh-24px)]",
        width,
        "w760:w-full w760:h-auto w760:max-h-[88dvh] w760:rounded-[15px_15px_0_0] w760:border-b-0",
        "w760:before:content-[''] w760:before:block w760:before:w-[40px] w760:before:h-[4px] w760:before:rounded-full w760:before:bg-line-2 w760:before:mx-auto w760:before:mt-[8px]",
      )}
    >
      {({ close }) => (
        <>
          <div className="grid gap-[18px] p-[20px] w760:p-[16px] content-start flex-1 min-h-0">
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="close"
              aria-label="Close"
              className="absolute top-[18px] right-[18px] z-[1] w760:sticky w760:top-[14px] w760:justify-self-end"
              onClick={() => close()}
            />
            <div className="grid gap-[6px]">
              <h2 id={titleId} className="[font:700_23px_var(--display)] tracking-[-0.02em] pr-[52px]">
                {title}
              </h2>
              {subtitle ? (
                <p id={subId} className="card__sub">
                  {subtitle}
                </p>
              ) : null}
              {headerActions ? <div className="flex flex-wrap gap-[8px]">{headerActions}</div> : null}
            </div>
            <div
              className={cn(
                "grid gap-[18px] content-start",
              )}
            >
              {children}
            </div>
          </div>
          {footer ? (
            <div className="sticky bottom-0 flex flex-wrap justify-end gap-[10px] px-[24px] py-[14px] bg-float border-t border-line w760:pb-[calc(14px+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}
