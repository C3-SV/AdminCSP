import type { CompetitiveStatus } from "@/types/admin/registration";

const VIRTUAL_RESULT_STATES = new Set<CompetitiveStatus>([
  "clasificado",
  "no_clasificado",
  "finalista",
  "ganador",
  "eliminado",
]);

/** Scores and completed virtual-result decisions are authoritative evidence of participation. */
export function resolveParticipationStatus({
  puntajeOnline,
  puntajePresencial,
  participacionVirtual,
  participacionPresencial,
  estadoCompetitivo,
}: {
  puntajeOnline: number | null;
  puntajePresencial: number | null;
  participacionVirtual: boolean;
  participacionPresencial: boolean;
  estadoCompetitivo: CompetitiveStatus;
}) {
  return {
    participacionVirtual: participacionVirtual || puntajeOnline !== null || VIRTUAL_RESULT_STATES.has(estadoCompetitivo),
    // Classification alone never proves attendance at the onsite final.
    participacionPresencial: participacionPresencial || puntajePresencial !== null,
  };
}
