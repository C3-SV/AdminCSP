"use client";

import { useMemo, useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { UploadedFileMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

type FileUploadEndpoint = "studentIdUploader" | "consentUploader";

type FileUploadProps = {
  endpoint: FileUploadEndpoint;
  value?: UploadedFileMetadata | UploadedFileMetadata[] | null;
  multiple?: boolean;
  label: string;
  description?: string;
  error?: string;
  onChange: (files: UploadedFileMetadata | UploadedFileMetadata[] | null) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

type UploadthingClientFile = {
  name: string;
  size: number;
  type: string;
  key: string;
  url?: string;
  appUrl?: string;
  ufsUrl?: string;
  serverData?: Partial<UploadedFileMetadata>;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeUploadedFile(file: UploadthingClientFile): UploadedFileMetadata {
  return {
    fileName: file.serverData?.fileName ?? file.name,
    fileSize: file.serverData?.fileSize ?? file.size,
    fileType: file.serverData?.fileType ?? file.type,
    fileUrl: file.serverData?.fileUrl ?? file.ufsUrl ?? file.url ?? file.appUrl ?? "",
    fileKey: file.serverData?.fileKey ?? file.key,
    uploadedAt: file.serverData?.uploadedAt ?? new Date().toISOString(),
    purpose: file.serverData?.purpose ?? "other",
    provider: "uploadthing",
  };
}

export function FileUpload({
  endpoint,
  value = null,
  multiple = false,
  label,
  description,
  error,
  onChange,
  onError,
  onUploadingChange,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const maxBytes = endpoint === "studentIdUploader" ? 2 * 1024 * 1024 : 3 * 1024 * 1024;

  const files = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  const handleUploadingState = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-csp-black">{label}</label>
        {isUploading ? (
          <span className="text-xs font-medium text-csp-blue">Subiendo archivo...</span>
        ) : null}
      </div>

      {description ? <p className="text-xs text-csp-black/70">{description}</p> : null}

      <div
        className={cn(
          "rounded-md border-2 border-dashed border-csp-neutral/70 bg-csp-soft p-3",
          "focus-within:border-csp-blue",
          (error || localError) && "border-csp-error",
          files.length > 0 && "border-csp-accent/70",
        )}
      >
        <UploadDropzone
          appearance={{
            button:
              "ut-ready:bg-csp-blue ut-uploading:bg-csp-primary ut-ready:text-csp-white ut-uploading:text-csp-white ut-ready:hover:bg-csp-primary",
            container:
              "w-full border-0 bg-transparent p-0 ut-uploading:cursor-not-allowed",
            label: "text-csp-black",
            allowedContent: "text-csp-black/70",
          }}
          content={{
            allowedContent: multiple
              ? "PDF, PNG, JPG/JPEG - maximo 3MB por archivo."
              : "PDF, PNG, JPG/JPEG - maximo 2MB.",
            button: files.length > 0 ? "Reemplazar archivo" : "Seleccionar archivo",
            label: multiple
              ? "Arrastra o selecciona los consentimientos."
              : "Arrastra o selecciona el documento.",
          }}
          endpoint={endpoint}
          onClientUploadComplete={(result) => {
            const normalized = result.map((item) =>
              normalizeUploadedFile(item as unknown as UploadthingClientFile),
            );
            const nextValue = multiple ? normalized : (normalized[0] ?? null);
            onChange(nextValue);
            setLocalError("");
            handleUploadingState(false);
          }}
          onBeforeUploadBegin={(selectedFiles) => {
            const oversize = selectedFiles.find((file) => file.size > maxBytes);
            if (!oversize) return selectedFiles;

            const maxLabel = endpoint === "studentIdUploader" ? "2MB" : "3MB";
            const message = `El archivo ${oversize.name} supera el limite de ${maxLabel}.`;
            setLocalError(message);
            onError?.(message);
            handleUploadingState(false);
            return [];
          }}
          onUploadBegin={() => {
            setLocalError("");
            handleUploadingState(true);
          }}
          onUploadError={(uploadError) => {
            const message = uploadError.message || "No fue posible subir el archivo.";
            setLocalError(message);
            onError?.(message);
            handleUploadingState(false);
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-1 rounded-md bg-csp-white p-2 text-xs text-csp-black/80">
          {files.map((file) => (
            <li key={file.fileKey} className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{file.fileName}</span>
              <span className="shrink-0 text-csp-black/60">{formatBytes(file.fileSize)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {localError ? <p className="form-error">{localError}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
