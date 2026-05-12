import { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/admin";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-sm font-medium text-csp-black" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        className={cn(
          "h-11 w-full rounded-md border border-csp-neutral/70 bg-csp-white px-3 text-sm text-csp-black outline-none transition focus:border-csp-blue focus:ring-2 focus:ring-csp-blue/25",
          error && "border-csp-error focus:border-csp-error focus:ring-csp-error/20",
          className,
        )}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        id={id}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="form-error flex items-start gap-1" id={errorId}>
          <span aria-hidden="true" className="font-semibold">!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

