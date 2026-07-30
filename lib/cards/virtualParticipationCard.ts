import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { RegistrationDocument } from "@/types/admin/registration";
import { getInstitutionDisplay } from "@/lib/admin/registrationPresentation";

const ASSET_DIR = path.join(process.cwd(), "assets", "virtual-card");
const TEMPLATE_PATH = path.join(ASSET_DIR, "participacion-virtual-template.png");
const FONT_PATH = path.join(ASSET_DIR, "Arial-Bold.ttf");
const CARD_WIDTH = 1400;
const CARD_HEIGHT = 1750;

type TextBox = {
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
} satisfies Record<string, TextBox>;

type TextLayout = { lines: string[]; fontSize: number };

export type GeneratedVirtualCard = {
  buffer: Buffer;
  fileName: string;
  sha256: string;
  teamName: string;
  institution: string;
  members: string[];
};

export class VirtualCardValidationError extends Error {}

function xml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wordsToLines(value: string, fontSize: number, box: TextBox) {
  const maxCharacters = Math.max(1, Math.floor(box.width / (fontSize * 0.58)));
  const words = compact(value).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (word.length > maxCharacters) return null;
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length <= box.maxLines ? lines : null;
}

function fitText(value: string, box: TextBox): TextLayout {
  const normalized = compact(value);
  if (!normalized) throw new VirtualCardValidationError("Hay un campo obligatorio vacío para la tarjeta.");
  for (let size = box.maxFontSize; size >= box.minFontSize; size -= 1) {
    const lines = wordsToLines(normalized, size, box);
    if (lines) return { lines, fontSize: size };
  }
  throw new VirtualCardValidationError(`El texto “${normalized}” no cabe en la tarjeta.`);
}

function fullName(firstName: string, lastName: string) {
  return compact(`${firstName} ${lastName}`);
}

export function getVirtualCardInput(registration: RegistrationDocument) {
  const teamName = compact(registration.teamName);
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

function textSvg(value: string, box: TextBox, debug: boolean) {
  const { lines, fontSize } = fitText(value, box);
  const lineHeight = Math.round(fontSize * 1.12);
  const firstBaseline = box.y + box.height / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  const text = lines
    .map(
      (line, index) =>
        `<text x="${box.x + box.width / 2}" y="${Math.round(firstBaseline + index * lineHeight)}" text-anchor="middle" font-family="CspCard" font-size="${fontSize}" fill="#FFFFFF">${xml(line)}</text>`,
    )
    .join("");
  const guide = debug
    ? `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="#ffea00" stroke-width="3"/><circle cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" r="7" fill="#ffea00"/>`
    : "";
  return `${guide}${text}`;
}

export function isVirtualCardDebugEnabled() {
  return process.env.CSP_VIRTUAL_CARD_DEBUG === "true" && process.env.NODE_ENV !== "production";
}

export async function generateVirtualParticipationCard(
  registration: RegistrationDocument,
  options: { debug?: boolean } = {},
): Promise<GeneratedVirtualCard> {
  const input = getVirtualCardInput(registration);
  const debug = Boolean(options.debug);
  const font = await readFile(FONT_PATH);
  const memberBoxes = [VIRTUAL_CARD_TEXT_BOXES.member1, VIRTUAL_CARD_TEXT_BOXES.member2, VIRTUAL_CARD_TEXT_BOXES.member3];
  const memberStart = Math.floor((memberBoxes.length - input.members.length) / 2);
  const renderedMembers = input.members
    .map((member, index) => textSvg(member, memberBoxes[memberStart + index], debug))
    .join("");
  const svg = `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><style>@font-face { font-family: CspCard; src: url(data:font/ttf;base64,${font.toString("base64")}) format('truetype'); }</style>${textSvg(input.teamName, VIRTUAL_CARD_TEXT_BOXES.teamName, debug)}${textSvg(input.institution, VIRTUAL_CARD_TEXT_BOXES.institution, debug)}${renderedMembers}</svg>`;
  const buffer = await sharp(TEMPLATE_PATH)
    .resize(CARD_WIDTH, CARD_HEIGHT, { fit: "fill" })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  const safeTeam = input.teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "equipo";
  return {
    buffer,
    fileName: `CSP-2026-fase-virtual-${safeTeam}.png`,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    ...input,
  };
}
