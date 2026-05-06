import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="text-sm font-medium text-csp-black" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        className={cn(
          "h-11 w-full rounded-md border border-csp-neutral/70 bg-csp-white px-3 text-sm text-csp-black outline-none transition focus:border-csp-blue focus:ring-2 focus:ring-csp-blue/25",
          error && "border-csp-error focus:border-csp-error focus:ring-csp-error/20",
          className,
        )}
        id={id}
        {...props}
      />
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
