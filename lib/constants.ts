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
export const UNIVERSITY_PRESENTIAL_DATE = "29 de agosto de 2026";

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
  { value: "amigo_companero", label: "Amigo o companero" },
  { value: "institucion", label: "Institucion educativa" },
  { value: "otro", label: "Otro" },
];

export const SCHOOL_RESPONSIBLE_ROLES: Array<{
  value: ResponsibleRole;
  label: string;
}> = [
  { value: "docente", label: "Docente" },
  { value: "coordinador_academico", label: "Coordinador academico" },
  { value: "director", label: "Director" },
  { value: "encargado_institucional", label: "Encargado institucional" },
  { value: "mentor", label: "Mentor" },
  { value: "otro", label: "Otro" },
];


export const REGISTRATION_STATUS_OPTIONS: Array<{
  value: RegistrationStatus;
  label: string;
}> = [
  { value: "recibida", label: "Recibida" },
  { value: "en_revision", label: "En revision" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "pendiente_correccion", label: "Pendiente de correccion" },
];

export const CATEGORY_OPTIONS: Array<{
  value: RegistrationCategory;
  label: string;
  description: string;
}> = [
  {
    value: "colegios",
    label: "Colegios",
    description: "Para equipos de educacion media.",
  },
  {
    value: "universidades",
    label: "Universidades",
    description: "Para equipos de educacion superior.",
  },
];
