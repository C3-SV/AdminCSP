export type RegistrationCategory = "colegios" | "universidades";

export type RegistrationStatus =
  | "recibida"
  | "en_revision"
  | "aprobada"
  | "rechazada"
  | "pendiente_correccion";

export type CompetitivePhase = "online" | "presencial" | "final" | "cerrado";

export type CompetitiveStatus =
  | "pendiente"
  | "participando"
  | "clasificado"
  | "no_clasificado"
  | "finalista"
  | "ganador"
  | "eliminado";

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

export type RegistrationDocumentMember = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  whatsapp?: string;
  career?: string;
  universityYear?: string;
  schoolGrade?: string;
  about?: string;
  linkedin?: string;
  studentIdFile?: UploadedFileMetadata | null;
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
  faseActual?: CompetitivePhase | null;
  estadoCompetitivo?: CompetitiveStatus | null;
  puntajeOnline?: number | null;
  puntajePresencial?: number | null;
  puntajeFinal?: number | null;
  rankingOnline?: number | null;
  rankingPresencial?: number | null;
  posicionFinal?: number | null;
  fechaPresencial?: string | null;
  sedePresencial?: string | null;
  adminNotes: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};
