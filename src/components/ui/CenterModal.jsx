import { useId } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { Icon } from "./Icon.jsx";
import { cn } from "../../utils/cn.js";

const WIDTH = {
  sm: "w-[min(420px,100vw_-_24px)]",
  md: "w-[min(560px,100vw_-_24px)]",
  lg: "w-[min(720px,100vw_-_24px)]",
};

export default function CenterModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  position = "center",
  footer,
  tone = "default",
  onBeforeClose,
  initialFocus,
  dismissible = true,
  children,
}) {
  const titleId = useId();
  const descId = useId();
  const top = position === "top";

  return (
  <Modal
  open={open}
  onClose={onClose}
  labelledBy={titleId}
  describedBy={description ? descId : undefined}
  motion="center"
  placement={top ? "center-top" : "center"}
  initialFocus={initialFocus}
  onBeforeClose={onBeforeClose}
  dismissible={dismissible}
  wrapClass={cn(
 "justify-center p-[12px] w760:items-end w760:p-0",
  top ? "items-start pt-[12vh] w760:pt-0" : "items-center",
  )}
  panelClass={cn(
 "flex flex-col min-h-0 bg-float border border-line shadow-[var(--shadow-pop)] rounded-[15px] max-h-[min(86dvh,860px)]",
  WIDTH[size] ?? WIDTH.md,
 "w760:w-full  w760:max-h-[92dvh] w760:rounded-[15px_15px_0_0] w760:border-b-0",
 "w760:before:content-[''] w760:before:block w760:before:w-[40px] w760:before:h-[4px] w760:before:rounded-full w760:before:bg-line-2 w760:before:mx-auto w760:before:mt-[8px]",
  )}
  >
  {({ close }) => (
  <>
  <div className="flex items-start gap-[12px] px-[24px] pt-[22px] pb-[16px] border-b border-line">
  <div className="grid gap-[4px] min-w-0 flex-1">
  <h2
  id={titleId}
  className="flex items-center gap-[8px] [font:600_20px_var(--display)] tracking-[-0.015em]"
  >
  {tone === "danger" ? <Icon name="alert" cls="text-bad shrink-0" /> : null}
  <span className="min-w-0">{title}</span>
  </h2>
  {description ? (
  <p id={descId} className="card__sub">
  {description}
  </p>
  ) : null}
  </div>
  {dismissible ? (
  <Button
  iconOnly
  variant="ghost"
  size="sm"
  icon="close"
  aria-label="Close"
  onClick={() => close()}
  />
  ) : null}
  </div>
  <div className="px-[24px] py-[20px] overflow-auto min-h-0">{children}</div>
  {footer ? (
  <div className="flex flex-wrap items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-line w760:pb-[calc(16px+env(safe-area-inset-bottom))]">
  {typeof footer === "function" ? footer({ close }) : footer}
  </div>
  ) : null}
  </>
  )}
  </Modal>
  );
}
