import type { KnownRegistrationCategory } from "@/types/admin/registration";
import type { VirtualCardTextBox } from "@/lib/cards/virtualCardLayout";
import { ADE_PRESENTIAL_DATE, SCHOOL_PRESENTIAL_DATE, UNIVERSITY_PRESENTIAL_DATE } from "@/constants/admin";

export const ONSITE_FINALIST_CARD_WIDTH = 1080;
export const ONSITE_FINALIST_CARD_HEIGHT = 1350;

export type OnsiteFinalistCardConfig = {
  template: string;
  categoryLabel: string;
  finalDate: string;
  boxes: {
    teamName: VirtualCardTextBox;
    institution: VirtualCardTextBox;
    member1: VirtualCardTextBox;
    member2: VirtualCardTextBox;
    member3: VirtualCardTextBox;
  };
};

const boxes = {
  teamName: { x: 135, y: 465, width: 810, height: 150, maxFontSize: 66, minFontSize: 28, maxLines: 2 },
  institution: { x: 150, y: 693, width: 780, height: 72, maxFontSize: 38, minFontSize: 19, maxLines: 2 },
  member1: { x: 150, y: 826, width: 780, height: 46, maxFontSize: 37, minFontSize: 19, maxLines: 1 },
  member2: { x: 150, y: 878, width: 780, height: 46, maxFontSize: 37, minFontSize: 19, maxLines: 1 },
  member3: { x: 150, y: 930, width: 780, height: 46, maxFontSize: 37, minFontSize: 19, maxLines: 1 },
} satisfies OnsiteFinalistCardConfig["boxes"];

/** Central mapping for the three final-presential templates and dates. */
export const ONSITE_FINALIST_CARD_CONFIG: Record<KnownRegistrationCategory, OnsiteFinalistCardConfig> = {
  colegios: { template: "colegios", categoryLabel: "Colegios", finalDate: SCHOOL_PRESENTIAL_DATE, boxes },
  universidades: { template: "universidades", categoryLabel: "Universidades", finalDate: UNIVERSITY_PRESENTIAL_DATE, boxes },
  ade: { template: "ade", categoryLabel: "AdE", finalDate: ADE_PRESENTIAL_DATE, boxes },
};

export function getOnsiteFinalistFileName(teamName: string) {
  const safeTeam = teamName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "equipo";
  return `CSP-2026-final-presencial-${safeTeam}.png`;
}
