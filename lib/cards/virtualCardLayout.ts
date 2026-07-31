import type { RegistrationDocument } from "@/types/admin/registration";
import { getInstitutionDisplay } from "@/lib/admin/registrationPresentation";

export const VIRTUAL_CARD_WIDTH = 1400;
export const VIRTUAL_CARD_HEIGHT = 1750;

export type VirtualCardTextBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  maxFontSize: number;
  minFontSize: number;
  maxLines: number;
};

/** All placement values are in the source template's native 1400x1750 coordinate system. */
export const VIRTUAL_CARD_TEXT_BOXES = {
  teamName: { x: 175, y: 530, width: 1050, height: 175, maxFontSize: 80, minFontSize: 34, maxLines: 2 },
  institution: { x: 190, y: 830, width: 1020, height: 100, maxFontSize: 54, minFontSize: 25, maxLines: 2 },
  member1: { x: 190, y: 1008, width: 1020, height: 56, maxFontSize: 44, minFontSize: 22, maxLines: 1 },
  member2: { x: 190, y: 1087, width: 1020, height: 56, maxFontSize: 44, minFontSize: 22, maxLines: 1 },
  member3: { x: 190, y: 1166, width: 1020, height: 56, maxFontSize: 44, minFontSize: 22, maxLines: 1 },
} satisfies Record<string, VirtualCardTextBox>;

export class VirtualCardValidationError extends Error {}

export function compactVirtualCardText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fullName(firstName: string, lastName: string) {
  return compactVirtualCardText(`${firstName} ${lastName}`);
}

export function getVirtualCardInput(registration: RegistrationDocument) {
  const teamName = compactVirtualCardText(registration.teamName);
  const institution = getInstitutionDisplay(registration);
  const members = registration.members
    .map((member) => fullName(member.firstName, member.lastName))
    .filter(Boolean)
    .slice(0, 3);

  if (!teamName || institution === "-" || !members.length) {
    throw new VirtualCardValidationError(
      "El equipo debe tener nombre, institución/AdE y al menos un integrante con nombre para generar la tarjeta.",
    );
  }
  return { teamName, institution, members };
}

export function getVirtualCardFileName(teamName: string) {
  const safeTeam = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "equipo";
  return `CSP-2026-fase-virtual-${safeTeam}.png`;
}
