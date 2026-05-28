import SideModal from "../ui/SideModal.jsx";
import Button from "../ui/Button.jsx";
import { Icon } from "../ui/Icon.jsx";

// Widget types the dashboard can render. Keys match the server widget enum.
export const WIDGET_TYPES = [
  { type: "stat", label: "Number", text: "One headline count: created, resolved or open items.", icon: "gauge" },
  { type: "lineChart", label: "Created vs resolved", text: "Daily created and resolved items over 90 days.", icon: "chartLine" },
  { type: "barChart", label: "Velocity", text: "Points finished in each closed sprint.", icon: "analytics" },
  { type: "donut", label: "Items by type", text: "How open and closed items split across types.", icon: "pie" },
  { type: "burndown", label: "Burndown", text: "Remaining points against the ideal line for a sprint.", icon: "trendDown" },
  { type: "workload", label: "Workload", text: "Open items per assignee.", icon: "users" },
  { type: "text", label: "Note", text: "A short note for the team.", icon: "edit" },
];

// Side panel that lists widget types. onPick(type) runs when one is chosen.
export default function WidgetPicker({ open, onClose, onPick }) {
  return (
    <SideModal open={open} onClose={onClose} title="Add widget" subtitle="Choose what to show on this dashboard.">
      <div className="grid gap-[10px]">
        {WIDGET_TYPES.map((w) => (
          <button
            key={w.type}
            type="button"
            onClick={() => onPick(w.type)}
            className="card flex items-start gap-[12px] p-[14px] text-left hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--ember-soft)]"
          >
            <span className="kpi__ico shrink-0" aria-hidden="true">
              <Icon name={w.icon} />
            </span>
            <span className="grid gap-[2px] min-w-0">
              <span className="font-bold">{w.label}</span>
              <span className="card__sub">{w.text}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </SideModal>
  );
}
