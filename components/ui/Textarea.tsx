import { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/admin";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-sm font-medium text-csp-black" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        className={cn(
          "w-full rounded-md border border-csp-neutral/70 bg-csp-white px-3 py-2 text-sm text-csp-black outline-none transition focus:border-csp-blue focus:ring-2 focus:ring-csp-blue/25",
          error && "border-csp-error focus:border-csp-error focus:ring-csp-error/20",
          className,
        )}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        id={id}
        {...props}
      />
      {error ? (
        <p className="form-error flex items-start gap-1" id={errorId}>
          <span aria-hidden="true" className="font-semibold">!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

