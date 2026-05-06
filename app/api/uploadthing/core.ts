import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const toNormalizedResponse = (
  file: {
    name: string;
    size: number;
    type: string;
    key: string;
    ufsUrl?: string;
    url?: string;
    appUrl?: string;
  },
  purpose: "student-id" | "image-consent" | "other",
) => ({
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  fileUrl: file.ufsUrl ?? file.url ?? file.appUrl ?? "",
  fileKey: file.key,
  uploadedAt: new Date().toISOString(),
  purpose,
  provider: "uploadthing" as const,
});

export const ourFileRouter = {
  studentIdUploader: f({
    image: { maxFileCount: 1, maxFileSize: "2MB", minFileCount: 1 },
    pdf: { maxFileCount: 1, maxFileSize: "2MB", minFileCount: 1 },
  }).onUploadComplete(({ file }) => toNormalizedResponse(file, "student-id")),

  consentUploader: f({
    // UploadThing v7 usa tamanos discretos y no acepta "3MB". Tomamos 4MB.
    image: { maxFileCount: 6, maxFileSize: "4MB", minFileCount: 1 },
    pdf: { maxFileCount: 6, maxFileSize: "4MB", minFileCount: 1 },
  }).onUploadComplete(({ file }) => toNormalizedResponse(file, "image-consent")),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
