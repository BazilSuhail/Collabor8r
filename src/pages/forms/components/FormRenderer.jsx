// feat(pages/forms/components/FormRenderer): render intake form fields by type for the public page and the builder preview.
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import { cn } from "../../../utils/cn.js";

const isChoice = (type) => type === "select" || type === "multiSelect";
const isWide = (type) => type === "longText" || type === "multiSelect";

// Two columns on desktop by default; the builder preview passes columns={1} for its narrower card.
export default function FormRenderer({ fields = [], values = {}, errors = {}, onChange, disabled = false, idPrefix = "ff", columns = 2 }) {
  return (
    <div className={cn("grid gap-[var(--gap)]", columns === 2 ? "grid-cols-2 w1000:grid-cols-1" : "grid-cols-1")}>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.id}`;
        const value = values[f.id];
        const label = f.label;
        const error = errors[f.id];
        const hint = f.helpText || undefined;
        const span = isWide(f.type) ? "col-span-full" : undefined;

        if (f.type === "checkbox") {
          return (
            <div key={f.id} className="grid gap-[6px] content-start">
              <label htmlFor={id} className="flex items-center gap-[10px] text-text font-semibold text-[14px] cursor-pointer">
                <input
                  id={id}
                  type="checkbox"
                  className="check"
                  checked={value === true}
                  disabled={disabled}
                  required={f.required}
                  aria-invalid={error ? "true" : undefined}
                  onChange={(e) => onChange?.(f.id, e.target.checked)}
                />
                {label}
              </label>
              {hint ? <p className="text-muted text-[13px]">{hint}</p> : null}
              {error ? <p role="alert" className="text-bad text-[13px] font-semibold">{error}</p> : null}
            </div>
          );
        }

        if (isChoice(f.type)) {
          const options = (f.options ?? []).map((o) => ({ value: o, label: o }));
          return (
            <Select
              key={f.id}
              label={label}
              value={f.type === "multiSelect" ? (Array.isArray(value) ? value : []) : (value ?? "")}
              onChange={(next) => onChange?.(f.id, next)}
              options={options}
              multiple={f.type === "multiSelect"}
              placeholder="Choose"
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
              className={span}
            />
          );
        }

        if (f.type === "number") {
          return (
            <Input
              key={f.id}
              id={id}
              label={label}
              type="number"
              value={value ?? ""}
              onChange={(e) => onChange?.(f.id, e.target.value === "" ? "" : Number(e.target.value))}
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
            />
          );
        }

        if (f.type === "date") {
          return (
            <Input
              key={f.id}
              id={id}
              label={label}
              type="date"
              value={value ?? ""}
              onChange={(e) => onChange?.(f.id, e.target.value)}
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
            />
          );
        }

        return (
          <Input
            key={f.id}
            id={id}
            label={label}
            as={f.type === "longText" ? "textarea" : "input"}
            type={f.type === "email" ? "email" : "text"}
            value={value ?? ""}
            onChange={(e) => onChange?.(f.id, e.target.value)}
            hint={hint}
            error={error}
            disabled={disabled}
            required={f.required}
            className={span}
          />
        );
      })}
    </div>
  );
}
