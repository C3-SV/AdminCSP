export type RegistrationCategory = "colegios" | "universidades";

export type RegistrationStatus =
  | "recibida"
  | "en_revision"
  | "aprobada"
  | "rechazada"
  | "pendiente_correccion";

export type DiscoverySource =
  | "instagram"
  | "linkedin"
  | "c3"
  | "esen"
  | "omegaup"
  | "profesor"
  | "amigo_companero"
  | "institucion"
  | "otro";

export type UploadedFilePurpose = "student-id" | "image-consent" | "other";

export type UploadedFileMetadata = {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  fileKey: string;
  uploadedAt?: string;
  purpose?: UploadedFilePurpose;
  provider: "uploadthing";
};

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | "";
  email: string;
  whatsapp?: string;
  career?: string;
  universityYear?: string;
  schoolGrade?: string;
  about?: string;
  linkedin?: string;
  studentIdFile?: UploadedFileMetadata | null;
};

export type ResponsibleRole =
  | "docente"
  | "coordinador_academico"
  | "director"
  | "encargado_institucional"
  | "mentor"
  | "delegado"
  | "representante_estudiantil"
  | "entrenador"
  | "coordinador"
  | "otro";

export type Responsible = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  institution: string;
  role: ResponsibleRole | "";
  relationship: string;
  comments?: string;
};

export type RegistrationFormData = {
  category: RegistrationCategory;
  teamName: string;
  institution: string;
  discoverySource: DiscoverySource | "";
  discoverySourceOther?: string;
  teamDescription: string;
  teamOmegaUpUser: string;
  contactEmail?: string;
  members: [TeamMember, TeamMember, TeamMember];
  responsible: Responsible;
  universityImageConsentAccepted?: boolean;
  schoolImageConsentFiles?: UploadedFileMetadata[];
  dataReviewAccepted: boolean;
  privacyAccepted: boolean;
  status: RegistrationStatus;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RegistrationDocumentMember = Omit<TeamMember, "age"> & {
  age: number;
};

export type RegistrationDocument = {
  id: string;
  category: RegistrationCategory;
  teamName: string;
  institution: string;
  discoverySource: DiscoverySource | "";
  discoverySourceOther?: string;
  teamDescription: string;
  teamOmegaUpUser: string;
  contactEmail?: string;
  members: [RegistrationDocumentMember, RegistrationDocumentMember, RegistrationDocumentMember];
  responsible: Responsible;
  consents: {
    dataReviewAccepted: boolean;
    privacyAccepted: boolean;
    universityImageConsentAccepted?: boolean;
    schoolImageConsentFiles: UploadedFileMetadata[];
  };
  status: RegistrationStatus;
  adminNotes: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FieldErrors = Record<string, string>;
