import { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  id: string;
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  error?: string;
  files?: File[];
  fileNames?: string[];
  onChange: (files: File[]) => void;
};

export function FileUpload({
  id,
  label,
  description,
  accept = ".pdf,.png,.jpg,.jpeg",
  multiple = false,
  error,
  files = [],
  fileNames = [],
  onChange,
}: FileUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    onChange(nextFiles);
  };

  const namesToRender = files.length
    ? files.map((file) => file.name)
    : fileNames.filter(Boolean);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-csp-black" htmlFor={id}>
        {label}
      </label>
      {description ? (
        <p className="text-xs text-csp-black/70">{description}</p>
      ) : null}
      <label
        className={cn(
          "flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-csp-neutral/60 bg-csp-white px-4 py-5 text-center text-sm text-csp-black/75 transition hover:border-csp-blue",
          error && "border-csp-error text-csp-error",
        )}
        htmlFor={id}
      >
        <span className="font-medium">Seleccionar archivo</span>
        <span className="mt-1 text-xs">PDF, PNG, JPG/JPEG · máximo 5MB</span>
      </label>
      <input
        accept={accept}
        className="sr-only"
        id={id}
        multiple={multiple}
        onChange={handleChange}
        type="file"
      />
      {namesToRender.length ? (
        <ul className="space-y-1 text-xs text-csp-black/75">
          {namesToRender.map((name) => (
            <li key={name} className="rounded bg-csp-soft px-2 py-1">
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
