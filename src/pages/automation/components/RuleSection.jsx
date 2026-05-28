// feat(pages/automation/components/RuleSection): frame one When, If or Then block of the automation rule builder.
import { cn } from "../../../utils/cn.js";
import { Icon } from "../../../components/ui/Icon.jsx";

// Option lists shared by the rule list, the rule builder and the run views.
export const TRIGGER_TYPES = [
  { value: "itemCreated", label: "Item is created" },
  { value: "statusChanged", label: "Status changes" },
  { value: "fieldChanged", label: "Field changes" },
  { value: "commentAdded", label: "Comment is added" },
  { value: "prMerged", label: "Pull request is merged" },
  { value: "scheduled", label: "On a schedule" },
  { value: "dueSoon", label: "Due date is near" },
];

export const ACTION_TYPES = [
  { value: "setField", label: "Set a field" },
  { value: "transition", label: "Move to a status" },
  { value: "assign", label: "Assign to someone" },
  { value: "addComment", label: "Add a comment" },
  { value: "addLabel", label: "Add a label" },
  { value: "notify", label: "Notify people" },
  { value: "webhook", label: "Send a webhook" },
];

export const CONDITION_OPS = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "does not equal" },
  { value: "in", label: "is one of" },
  { value: "notIn", label: "is not one of" },
  { value: "contains", label: "contains" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];

export const triggerLabel = (type) => TRIGGER_TYPES.find((t) => t.value === type)?.label ?? "Custom trigger";

export default function RuleSection({ id, icon, title, text, action, className, children }) {
  return (
    <section aria-labelledby={id} className={cn("card grid gap-[16px]", className)}>
      <header className="flex items-center gap-[12px]">
        <span className="grid place-items-center flex-none w-[34px] h-[34px] rounded-ctl bg-well text-muted">
          <Icon name={icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={id} className="text-[15px] font-bold text-text">
            {title}
          </h2>
          {text ? <p className="card__sub">{text}</p> : null}
        </div>
        {action ? <div className="flex-none">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
