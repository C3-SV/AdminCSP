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

  const hasFiles = files.length > 0;
  const selectedLabel =
    files.length === 1
      ? `Archivo seleccionado: ${files[0].fileName}`
      : `${files.length} archivos seleccionados y cargados.`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-csp-black">{label}</label>
        {isUploading ? (
          <span className="text-xs font-medium text-csp-blue">Subiendo archivo...</span>
        ) : null}
      </div>

      <p className="text-xs text-csp-black/70">
        {description ?? "Adjunta el comprobante o archivo solicitado."}
      </p>

      {!hasFiles && !isUploading ? (
        <p className="text-xs text-csp-black/70">
          Selecciona un archivo desde tu dispositivo. La carga se realiza automáticamente.
        </p>
      ) : null}

      {isUploading ? (
        <p className="text-xs font-medium text-csp-primary">
          Estamos cargando tu archivo. Espera unos segundos para continuar.
        </p>
      ) : null}

      {hasFiles && !isUploading ? (
        <div className="rounded-md border border-csp-accent/40 bg-csp-white p-2 text-xs text-csp-black/80">
          <p className="font-medium text-csp-primary">{selectedLabel}</p>
          <p className="mt-1">Archivo cargado correctamente. Si lo necesitas, puedes cambiarlo.</p>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-md border-2 border-dashed border-csp-neutral/70 bg-csp-soft p-3",
          "focus-within:border-csp-blue",
          (error || localError) && "border-csp-error",
          hasFiles && "border-csp-accent/70",
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
              ? "PDF, PNG, JPG/JPEG - máximo 3MB por archivo."
              : "PDF, PNG, JPG/JPEG - máximo 2MB.",
            button: hasFiles ? "Cambiar archivo" : "Seleccionar archivo",
            label: multiple
              ? "Arrastra o selecciona los archivos."
              : "Arrastra o selecciona el archivo.",
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
            const message = `El archivo ${oversize.name} supera el límite de ${maxLabel}.`;
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

      {hasFiles ? (
        <ul className="space-y-1 rounded-md bg-csp-white p-2 text-xs text-csp-black/80">
          {files.map((file) => (
            <li key={file.fileKey} className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{file.fileName}</span>
              <span className="shrink-0 text-csp-black/60">{formatBytes(file.fileSize)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {localError ? (
        <p className="form-error flex items-start gap-1">
          <span aria-hidden="true" className="font-semibold">!</span>
          <span>{localError}</span>
        </p>
      ) : null}
      {error ? (
        <p className="form-error flex items-start gap-1">
          <span aria-hidden="true" className="font-semibold">!</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
