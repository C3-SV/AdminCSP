import type { TransactionalEmailType } from "@/lib/email/transactionalEmail";
import type { CompetitivePhase, CompetitiveStatus } from "@/types/admin/registration";

export const COMPETITIVE_ACTION_KEYS = [
  "online",
  "clasificar_presencial",
  "no_clasificado",
  "finalista",
  "ganador",
  "eliminado",
] as const;

export type CompetitiveActionKey = (typeof COMPETITIVE_ACTION_KEYS)[number];

export type CompetitiveAction = {
  label: string;
  faseActual: CompetitivePhase;
  estadoCompetitivo: CompetitiveStatus;
  emailType?: Extract<
    TransactionalEmailType,
    "classified_to_onsite" | "not_classified" | "finalist" | "winner"
  >;
};

export const COMPETITIVE_ACTIONS: Record<CompetitiveActionKey, CompetitiveAction> = {
  online: {
    label: "Marcar en fase online",
    faseActual: "online",
    estadoCompetitivo: "participando",
  },
  clasificar_presencial: {
    label: "Clasificar a presencial",
    faseActual: "presencial",
    estadoCompetitivo: "clasificado",
    emailType: "classified_to_onsite",
  },
  no_clasificado: {
    label: "Marcar como no clasificado",
    faseActual: "cerrado",
    estadoCompetitivo: "no_clasificado",
    emailType: "not_classified",
  },
  finalista: {
    label: "Marcar como finalista",
    faseActual: "final",
    estadoCompetitivo: "finalista",
    emailType: "finalist",
  },
  ganador: {
    label: "Marcar como ganador",
    faseActual: "cerrado",
    estadoCompetitivo: "ganador",
    emailType: "winner",
  },
  eliminado: {
    label: "Marcar como eliminado",
    faseActual: "cerrado",
    estadoCompetitivo: "eliminado",
  },
};

export function isCompetitiveActionKey(value: unknown): value is CompetitiveActionKey {
  return typeof value === "string" && COMPETITIVE_ACTION_KEYS.includes(value as CompetitiveActionKey);
}
