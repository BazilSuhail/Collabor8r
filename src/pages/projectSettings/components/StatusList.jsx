// feat(pages/projectSettings/components/StatusList): edit a workflow's statuses, their categories and their order.
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";

export const CATEGORY_OPTIONS = [
  { value: "todo", label: "To do", tone: "plain" },
  { value: "inprogress", label: "In progress", tone: "iris" },
  { value: "done", label: "Done", tone: "spruce" },
];

// Client ids for new statuses and transitions. The server accepts any 24 hex id, so references stay valid before save.
export const newId = () =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");

// Request shape for statuses. sortOrder follows the list order.
export const cleanStatuses = (statuses) =>
  statuses.map((s, index) => ({
    id: s.id,
    name: String(s.name ?? "").trim(),
    category: s.category,
    sortOrder: index,
    color: s.color ?? "",
    icon: s.icon ?? "",
    description: s.description ?? "",
  }));

export default function StatusList({ statuses, onChange, readOnly = false, errors = {} }) {
  const update = (index, patch) =>
    onChange(statuses.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= statuses.length) return;
    const next = [...statuses];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(statuses.filter((_, i) => i !== index));
  const add = () => onChange([...statuses, { id: newId(), name: "", category: "todo" }]);

  return (
    <div className="grid gap-[12px]">
      {statuses.length === 0 ? (
        <p className="text-muted text-[13.5px] rounded-[14px] border border-dashed border-line p-[14px] text-center">No statuses yet. Add at least one To do and one Done status.</p>
      ) : null}
      {statuses.map((s, index) => (
        <div key={s.id} className="grid gap-[6px]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto] items-end gap-[10px] w760:grid-cols-[minmax(0,1fr)]">
            <Input
              label="Status name"
              hideLabel
              value={s.name}
              disabled={readOnly}
              placeholder="Status name"
              onChange={(e) => update(index, { name: e.target.value })}
            />
            <Select
              label={`Category for ${s.name || "status"}`}
              hideLabel
              value={s.category}
              options={CATEGORY_OPTIONS}
              disabled={readOnly}
              onChange={(value) => update(index, { category: value })}
            />
            {readOnly ? null : (
              <div className="flex items-center gap-[4px]">
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="up"
                  aria-label={`Move ${s.name || "status"} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="down"
                  aria-label={`Move ${s.name || "status"} down`}
                  disabled={index === statuses.length - 1}
                  onClick={() => move(index, 1)}
                />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  aria-label={`Remove ${s.name || "status"}`}
                  onClick={() => remove(index)}
                />
              </div>
            )}
          </div>
          {errors[index] ? (
            <p role="alert" className="text-bad text-[13px] font-semibold">
              {errors[index]}
            </p>
          ) : null}
        </div>
      ))}
      {readOnly ? null : (
        <div>
          <Button variant="soft" size="sm" icon="plus" onClick={add}>
            Add status
          </Button>
          <p className="field__hint">Each status needs a name and a category.</p>
        </div>
      )}
    </div>
  );
}
