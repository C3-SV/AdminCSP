import {
  CompetitivePhase,
  CompetitiveStatus,
  KnownRegistrationCategory,
  RegistrationStatus,
} from "@/types/admin/registration";

export const EVENT_NAME = "Copa Salvadoreña de Programacion 2026";
export const EVENT_SHORT_NAME = "CSP 2026";

export const ONLINE_PHASE_DATE = "1 de agosto de 2026";
export const SCHOOL_PRESENTIAL_DATE = "15 de agosto de 2026";
export const UNIVERSITY_PRESENTIAL_DATE = "5 de septiembre de 2026";
export const ADE_PRESENTIAL_DATE = "5 de septiembre de 2026";

export const REGISTRATION_CATEGORY_OPTIONS: Array<{
  value: KnownRegistrationCategory;
  label: string;
}> = [
  { value: "colegios", label: "Colegios" },
  { value: "universidades", label: "Universidades" },
  { value: "ade", label: "AdE" },
];

export const REGISTRATION_CATEGORY_LABELS: Record<
  KnownRegistrationCategory | "desconocida",
  string
> = {
  colegios: "Colegios",
  universidades: "Universidades",
  ade: "AdE",
  desconocida: "No reconocida",
};

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

export const COMPETITIVE_PHASE_OPTIONS: Array<{
  value: CompetitivePhase;
  label: string;
}> = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
  { value: "cerrado", label: "Cerrado" },
];

export const COMPETITIVE_STATUS_OPTIONS: Array<{
  value: CompetitiveStatus;
  label: string;
}> = [
  { value: "pendiente", label: "Pendiente" },
  { value: "clasificado", label: "Clasificado" },
  { value: "no_clasificado", label: "No clasificado" },
];

export const COMPETITIVE_PHASE_LABELS: Record<CompetitivePhase, string> = {
  online: "Online",
  presencial: "Presencial",
  final: "Presencial",
  cerrado: "Cerrado",
};

export const COMPETITIVE_STATUS_LABELS: Record<CompetitiveStatus, string> = {
  pendiente: "Pendiente",
  participando: "Pendiente",
  clasificado: "Clasificado",
  no_clasificado: "No clasificado",
  finalista: "Clasificado",
  ganador: "Clasificado",
  eliminado: "No clasificado",
};
