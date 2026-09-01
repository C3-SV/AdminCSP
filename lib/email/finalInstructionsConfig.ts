import type { KnownRegistrationCategory } from "@/types/admin/registration";

export type FinalInstructionsScheduleAttachment = {
  fileName: string;
  relativePath: string;
  contentType: "image/png";
};

export type FinalInstructionsCategoryConfig = {
  categoryLabel: string;
  finalDate: string;
  arrivalTime: string;
  arrivalLocation: string;
  endTime: string;
  scheduleAttachment?: FinalInstructionsScheduleAttachment;
};

/**
 * Category-specific logistics for Indicaciones Finales. Keeping this mapping
 * centralized prevents dates and arrival times from drifting between email
 * content, validation and the admin preview.
 */
export const FINAL_INSTRUCTIONS_CONFIG: Partial<Record<KnownRegistrationCategory, FinalInstructionsCategoryConfig>> = {
  colegios: {
    categoryLabel: "Colegios",
    finalDate: "sábado 15 de agosto de 2026",
    arrivalTime: "7:15 a. m.",
    arrivalLocation: "la zona de los auditorios de ESEN",
    endTime: "3:30 p. m.",
  },
  universidades: {
    categoryLabel: "Universidades",
    finalDate: "sábado 5 de septiembre de 2026",
    arrivalTime: "6:30 a. m.",
    arrivalLocation: "la zona de los auditorios de ESEN",
    endTime: "3:45 p. m.",
    scheduleAttachment: {
      fileName: "cronograma-universidades.png",
      relativePath: "assets/final-instructions/cronograma-universidades.png",
      contentType: "image/png",
    },
  },
  ade: {
    categoryLabel: "AdE",
    finalDate: "sábado 5 de septiembre de 2026",
    arrivalTime: "6:30 a. m.",
    arrivalLocation: "la zona de los auditorios de ESEN",
    endTime: "3:45 p. m.",
    scheduleAttachment: {
      fileName: "cronograma-universidades.png",
      relativePath: "assets/final-instructions/cronograma-universidades.png",
      contentType: "image/png",
    },
  },
};

export function getFinalInstructionsConfig(category: KnownRegistrationCategory | "desconocida") {
  if (category === "desconocida") return undefined;
  return FINAL_INSTRUCTIONS_CONFIG[category];
}
