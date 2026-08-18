import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { compactVirtualCardText } from "@/lib/cards/virtualCardLayout";
import type { KnownRegistrationCategory, RegistrationDocumentMember } from "@/types/admin/registration";

export type DiplomaPhase = "virtual" | "presencial";

export const DIPLOMA_TEMPLATES: Record<KnownRegistrationCategory, Record<DiplomaPhase, { pageIndex: number }>> = {
  colegios: { virtual: { pageIndex: 0 }, presencial: { pageIndex: 1 } },
  universidades: { virtual: { pageIndex: 2 }, presencial: { pageIndex: 3 } },
  ade: { virtual: { pageIndex: 2 }, presencial: { pageIndex: 3 } },
};

/** The inset safe zone inside the 498.122 x 63.859 pt white name rectangle. */
export const DIPLOMA_NAME_AREA = {
  x: 191.884,
  y: 310.895,
  width: 458.122,
  height: 47.859,
  preferredFontSize: 32,
  minFontSize: 18,
} as const;

const TEMPLATE_PATH = path.join(process.cwd(), "assets", "diplomas", "DIPLOMAS VIRTUALES CSP 2026.pdf");
const FONT_PATH = path.join(process.cwd(), "assets", "virtual-card", "Poppins-SemiBold.ttf");
const TEMPLATE_PAGE_WIDTH = 842.25;
const TEMPLATE_PAGE_HEIGHT = 595.5;
let sourceAssets: Promise<{ template: Buffer; font: Buffer }> | undefined;

export class DiplomaValidationError extends Error {}

export type ParticipantDiploma = {
  fileName: string;
  buffer: Buffer;
  participantName: string;
};

export function getDiplomaTemplate(category: KnownRegistrationCategory, phase: DiplomaPhase) {
  return DIPLOMA_TEMPLATES[category][phase];
}

export function getParticipantFullName(member: Pick<RegistrationDocumentMember, "firstName" | "lastName">) {
  const firstName = compactVirtualCardText(member.firstName);
  const lastName = compactVirtualCardText(member.lastName);
  if (!firstName || !lastName) {
    throw new DiplomaValidationError("Cada integrante debe tener nombre y apellido para generar su diploma.");
  }
  return `${firstName} ${lastName}`;
}

export function getParticipantDiplomaFileName(name: string, phase: DiplomaPhase) {
  const slug = compactVirtualCardText(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase()
    .slice(0, 100) || "participante";
  return `${slug}-csp-2026-${phase === "virtual" ? "fase-virtual" : "final-presencial"}.pdf`;
}

export function fitParticipantName({
  text,
  font,
  maxWidth,
  preferredFontSize,
  minFontSize,
}: {
  text: string;
  font: PDFFont;
  maxWidth: number;
  preferredFontSize: number;
  minFontSize: number;
}) {
  for (let fontSize = preferredFontSize; fontSize >= minFontSize; fontSize -= 0.5) {
    if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return fontSize;
  }
  throw new DiplomaValidationError(`El nombre completo “${text}” no cabe en el diploma.`);
}

async function loadSourceAssets() {
  if (!sourceAssets) {
    sourceAssets = Promise.all([readFile(TEMPLATE_PATH), readFile(FONT_PATH)])
      .then(([template, font]) => ({ template, font }))
      .catch((error) => {
        sourceAssets = undefined;
        throw error;
      });
  }
  return sourceAssets;
}

export async function generateParticipantDiploma({
  participant,
  category,
  phase,
}: {
  participant: Pick<RegistrationDocumentMember, "firstName" | "lastName">;
  category: KnownRegistrationCategory;
  phase: DiplomaPhase;
}): Promise<ParticipantDiploma> {
  const participantName = getParticipantFullName(participant);
  const { template, font: fontBytes } = await loadSourceAssets();
  const source = await PDFDocument.load(template, { updateMetadata: false });
  if (source.getPageCount() !== 4) throw new DiplomaValidationError("La plantilla oficial de diplomas debe contener exactamente cuatro páginas.");
  const output = await PDFDocument.create();
  output.registerFontkit(fontkit);
  const [page] = await output.copyPages(source, [getDiplomaTemplate(category, phase).pageIndex]);
  output.addPage(page);
  if (Math.abs(page.getWidth() - TEMPLATE_PAGE_WIDTH) > 0.1 || Math.abs(page.getHeight() - TEMPLATE_PAGE_HEIGHT) > 0.1) {
    throw new DiplomaValidationError("La página de la plantilla oficial no tiene las dimensiones esperadas.");
  }
  const poppins = await output.embedFont(fontBytes, { subset: true });
  const fontSize = fitParticipantName({
    text: participantName,
    font: poppins,
    maxWidth: DIPLOMA_NAME_AREA.width,
    preferredFontSize: DIPLOMA_NAME_AREA.preferredFontSize,
    minFontSize: DIPLOMA_NAME_AREA.minFontSize,
  });
  const textWidth = poppins.widthOfTextAtSize(participantName, fontSize);
  const textHeight = poppins.heightAtSize(fontSize, { descender: true });
  page.drawText(participantName, {
    x: DIPLOMA_NAME_AREA.x + (DIPLOMA_NAME_AREA.width - textWidth) / 2,
    y: DIPLOMA_NAME_AREA.y + (DIPLOMA_NAME_AREA.height - textHeight) / 2,
    size: fontSize,
    font: poppins,
    color: rgb(0x33 / 255, 0xbe / 255, 0xac / 255),
  });
  return {
    participantName,
    fileName: getParticipantDiplomaFileName(participantName, phase),
    buffer: Buffer.from(await output.save({ useObjectStreams: false, updateFieldAppearances: false })),
  };
}

export async function generateTeamDiplomas({
  members,
  category,
  phase,
}: {
  members: RegistrationDocumentMember[];
  category: KnownRegistrationCategory;
  phase: DiplomaPhase;
}) {
  if (!members.length) throw new DiplomaValidationError("El equipo no tiene integrantes para generar diplomas.");
  return Promise.all(members.map((participant) => generateParticipantDiploma({ participant, category, phase })));
}
