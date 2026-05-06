import {
  DiscoverySource,
  RegistrationCategory,
  RegistrationStatus,
  ResponsibleRole,
} from "@/lib/types";

export const EVENT_NAME = "Copa Salvadoreña de Programación 2026";
export const EVENT_SHORT_NAME = "CSP 2026";

export const ONLINE_PHASE_DATE = "1 de agosto de 2026";
export const SCHOOL_PRESENTIAL_DATE = "15 de agosto de 2026";
export const UNIVERSITY_PRESENTIAL_DATE = "5 de septiembre de 2026";

export const DISCOVERY_SOURCE_OPTIONS: Array<{
  value: DiscoverySource;
  label: string;
}> = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "c3", label: "C3" },
  { value: "esen", label: "ESEN" },
  { value: "omegaup", label: "OmegaUp" },
  { value: "profesor", label: "Profesor / docente" },
  { value: "amigo_companero", label: "Amigo o compañero" },
  { value: "institucion", label: "Institución educativa" },
  { value: "otro", label: "Otro" },
];

export const SCHOOL_RESPONSIBLE_ROLES: Array<{
  value: ResponsibleRole;
  label: string;
}> = [
  { value: "docente", label: "Docente" },
  { value: "coordinador_academico", label: "Coordinador académico" },
  { value: "director", label: "Director" },
  { value: "encargado_institucional", label: "Encargado institucional" },
  { value: "mentor", label: "Mentor" },
  { value: "otro", label: "Otro" },
];

export const UNIVERSITY_RESPONSIBLE_ROLES: Array<{
  value: ResponsibleRole;
  label: string;
}> = [
  { value: "docente", label: "Docente" },
  { value: "entrenador", label: "Entrenador" },
  { value: "mentor", label: "Mentor" },
  { value: "delegado", label: "Delegado estudiantil" },
  { value: "representante_estudiantil", label: "Representante de club" },
  { value: "coordinador", label: "Coordinador" },
  { value: "otro", label: "Otro" },
];

export const REGISTRATION_STATUS_OPTIONS: Array<{
  value: RegistrationStatus;
  label: string;
}> = [
  { value: "recibida", label: "Recibida" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "pendiente_correccion", label: "Pendiente de corrección" },
];

export const CATEGORY_OPTIONS: Array<{
  value: RegistrationCategory;
  label: string;
  description: string;
}> = [
  {
    value: "colegios",
    label: "Colegios",
    description: "Para equipos de educación media.",
  },
  {
    value: "universidades",
    label: "Universidades",
    description: "Para equipos de educación superior.",
  },
];

export const REGISTRATION_STEPS = [
  "Equipo",
  "Miembro 1",
  "Miembro 2",
  "Miembro 3",
  "Responsable",
  "Confirmación",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

// Temporal para pruebas sin Firebase Storage.
// Cambiar a false para reactivar validaciones y subida de archivos.
export const TEMP_DISABLE_FILE_UPLOADS = true;
