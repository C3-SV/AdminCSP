import {
  VIRTUAL_CARD_HEIGHT,
  VIRTUAL_CARD_TEXT_BOXES,
  VIRTUAL_CARD_WIDTH,
  VirtualCardValidationError,
  compactVirtualCardText,
  getVirtualCardFileName,
  getVirtualCardInput,
  type VirtualCardTextBox,
} from "@/lib/cards/virtualCardLayout";
import {
  ONSITE_FINALIST_CARD_CONFIG,
  ONSITE_FINALIST_CARD_HEIGHT,
  ONSITE_FINALIST_CARD_WIDTH,
  ONSITE_FINALIST_STORY_CONFIG,
  ONSITE_FINALIST_STORY_HEIGHT,
  ONSITE_FINALIST_STORY_WIDTH,
  getOnsiteFinalistFileName,
  getOnsiteFinalistStoryFileName,
} from "@/lib/cards/onsiteFinalistCardLayout";
import type { KnownRegistrationCategory, RegistrationDocument } from "@/types/admin/registration";
import { getParticipantShortName } from "@/lib/admin/namePresentation";

type FirebaseSessionUser = { getIdToken: () => Promise<string> };

export type ClientVirtualCard = {
  fileName: string;
  content: string;
};

type CardAssets = {
  template: string;
  font: string;
  onsiteTemplates?: Partial<Record<KnownRegistrationCategory, string>>;
  onsiteStoryTemplates?: Partial<Record<KnownRegistrationCategory, string>>;
  competitorTemplate?: string;
};

const FONT_FAMILY = "CSP Virtual Card Poppins";
let assetsPromise: Promise<CardAssets> | undefined;
let fontPromise: Promise<void> | undefined;

function asDataUrl(contentType: string, content: string) {
  return `data:${contentType};base64,${content}`;
}

async function loadAssets(user: FirebaseSessionUser | null) {
  if (!user) throw new Error("Tu sesión administrativa no está disponible. Inicia sesión nuevamente.");
  if (!assetsPromise) {
    assetsPromise = (async () => {
      const response = await fetch("/api/admin/virtual-card-assets", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      const body = (await response.json().catch(() => ({}))) as Partial<CardAssets & { message: string }>;
      if (!response.ok || !body.template || !body.font) {
        throw new Error(body.message || "No fue posible cargar los recursos de la tarjeta.");
      }
      return { template: body.template, font: body.font, competitorTemplate: body.competitorTemplate, onsiteTemplates: body.onsiteTemplates, onsiteStoryTemplates: body.onsiteStoryTemplates };
    })().catch((error) => {
      assetsPromise = undefined;
      throw error;
    });
  }
  return assetsPromise;
}

async function loadFont(font: string) {
  if (!fontPromise) {
    fontPromise = (async () => {
      const face = new FontFace(FONT_FAMILY, `url(${asDataUrl("font/ttf", font)}) format("truetype")`, { weight: "600" });
      await face.load();
      document.fonts.add(face);
    })().catch((error) => {
      fontPromise = undefined;
      throw error;
    });
  }
  await fontPromise;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No fue posible cargar la plantilla de la tarjeta."));
    image.src = source;
  });
}

function splitText(context: CanvasRenderingContext2D, value: string, box: VirtualCardTextBox) {
  const words = compactVirtualCardText(value).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (context.measureText(word).width > box.width) return null;
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= box.width) line = candidate;
    else {
      if (!line) return null;
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length <= box.maxLines ? lines : null;
}

function drawFittedText(context: CanvasRenderingContext2D, value: string, box: VirtualCardTextBox) {
  const normalized = compactVirtualCardText(value);
  if (!normalized) throw new VirtualCardValidationError("Hay un campo obligatorio vacío para la tarjeta.");
  for (let fontSize = box.maxFontSize; fontSize >= box.minFontSize; fontSize -= 1) {
    context.font = `600 ${fontSize}px "${FONT_FAMILY}"`;
    const lines = splitText(context, normalized, box);
    if (!lines) continue;
    const lineHeight = Math.round(fontSize * 1.16);
    const blockHeight = lines.length * lineHeight;
    if (blockHeight > box.height) continue;
    const firstBaseline = box.y + (box.height - blockHeight) / 2 + fontSize;
    lines.forEach((line, index) => context.fillText(line, box.x + box.width / 2, firstBaseline + index * lineHeight));
    return;
  }
  throw new VirtualCardValidationError(`El texto “${normalized}” no cabe en la tarjeta.`);
}

function canvasPngBase64(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("El navegador no pudo exportar la tarjeta."));
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return reject(new Error("No fue posible codificar la tarjeta."));
        resolve(reader.result.split(",", 2)[1] ?? "");
      };
      reader.onerror = () => reject(new Error("No fue posible codificar la tarjeta."));
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

export async function generateVirtualParticipationCardInBrowser({
  user,
  registration,
}: {
  user: FirebaseSessionUser | null;
  registration: RegistrationDocument;
}): Promise<ClientVirtualCard> {
  const input = getVirtualCardInput(registration);
  const assets = await loadAssets(user);
  await loadFont(assets.font);
  await document.fonts.ready;
  const template = await loadImage(asDataUrl("image/png", assets.template));
  const canvas = document.createElement("canvas");
  canvas.width = VIRTUAL_CARD_WIDTH;
  canvas.height = VIRTUAL_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo crear la tarjeta.");
  context.drawImage(template, 0, 0, VIRTUAL_CARD_WIDTH, VIRTUAL_CARD_HEIGHT);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  drawFittedText(context, input.teamName, VIRTUAL_CARD_TEXT_BOXES.teamName);
  drawFittedText(context, input.institution, VIRTUAL_CARD_TEXT_BOXES.institution);
  const memberBoxes = [VIRTUAL_CARD_TEXT_BOXES.member1, VIRTUAL_CARD_TEXT_BOXES.member2, VIRTUAL_CARD_TEXT_BOXES.member3];
  const start = Math.floor((memberBoxes.length - input.members.length) / 2);
  input.members.forEach((member, index) => drawFittedText(context, member, memberBoxes[start + index]));
  return { fileName: getVirtualCardFileName(input.teamName), content: await canvasPngBase64(canvas) };
}

export async function generateOnsiteFinalistCardInBrowser({
  user,
  registration,
}: {
  user: FirebaseSessionUser | null;
  registration: RegistrationDocument;
}): Promise<ClientVirtualCard> {
  return generateOnsiteCard({ user, registration, format: "post" });
}

export async function generateOnsiteFinalistStoryInBrowser({
  user,
  registration,
}: {
  user: FirebaseSessionUser | null;
  registration: RegistrationDocument;
}): Promise<ClientVirtualCard> {
  return generateOnsiteCard({ user, registration, format: "story" });
}

async function generateOnsiteCard({
  user,
  registration,
  format,
}: {
  user: FirebaseSessionUser | null;
  registration: RegistrationDocument;
  format: "post" | "story";
}): Promise<ClientVirtualCard> {
  if (registration.category === "desconocida") throw new Error("La categoría del equipo no es válida para la tarjeta presencial.");
  const input = getVirtualCardInput(registration);
  const config = (format === "story" ? ONSITE_FINALIST_STORY_CONFIG : ONSITE_FINALIST_CARD_CONFIG)[registration.category];
  const assets = await loadAssets(user);
  const templateSource = (format === "story" ? assets.onsiteStoryTemplates : assets.onsiteTemplates)?.[registration.category];
  if (!templateSource) throw new Error("No se encontró la plantilla de clasificación presencial para esta categoría.");
  await loadFont(assets.font);
  await document.fonts.ready;
  const template = await loadImage(asDataUrl("image/png", templateSource));
  const canvas = document.createElement("canvas");
  const width = format === "story" ? ONSITE_FINALIST_STORY_WIDTH : ONSITE_FINALIST_CARD_WIDTH;
  const height = format === "story" ? ONSITE_FINALIST_STORY_HEIGHT : ONSITE_FINALIST_CARD_HEIGHT;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo crear la tarjeta.");
  context.drawImage(template, 0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  drawFittedText(context, input.teamName, config.boxes.teamName);
  context.fillStyle = "#89d7d1";
  drawFittedText(context, input.institution, config.boxes.institution);
  context.fillStyle = "#ffffff";
  const memberBoxes = [config.boxes.member1, config.boxes.member2, config.boxes.member3];
  const start = Math.floor((memberBoxes.length - input.members.length) / 2);
  input.members.forEach((member, index) => drawFittedText(context, member, memberBoxes[start + index]));
  return {
    fileName: format === "story" ? getOnsiteFinalistStoryFileName(input.teamName) : getOnsiteFinalistFileName(input.teamName),
    content: await canvasPngBase64(canvas),
  };
}

export class CompetitorCardGenerationError extends Error {}

const COMPETITOR_CARD_WIDTH = 862;
const COMPETITOR_CARD_HEIGHT = 1204;
export const COMPETITOR_CARD_PRINT_WIDTH_CM = 7.3;
export const COMPETITOR_CARD_PRINT_HEIGHT_CM = 10.2;
const COMPETITOR_CARD_BOXES = {
  // Long values retain the same two-line/minimum-size safety path in drawFittedText.
  name: { x: 72, y: 493, width: 500, height: 172, maxFontSize: 58, minFontSize: 22, maxLines: 2 },
  team: { x: 72, y: 728, width: 500, height: 132, maxFontSize: 52, minFontSize: 20, maxLines: 2 },
} satisfies Record<string, VirtualCardTextBox>;

type CompetitorPdfResult = { blob: Blob; fileName: string; cardCount: number; warnings: string[] };

function dataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(",", 2)[1] ?? "";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

function joinBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => { result.set(part, offset); offset += part.length; });
  return result;
}

/** Creates a letter portrait PDF with six physical-size cards per page (2 columns x 3 rows, rotated). */
export function buildSixUpLetterPdf(images: Uint8Array[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const pointsPerCentimeter = 72 / 2.54;
  const gapX = 8;
  const gapY = 8;
  // The source is portrait (7.3 x 10.2 cm); rotate it to fit 2 x 3 on letter.
  const cardWidth = COMPETITOR_CARD_PRINT_HEIGHT_CM * pointsPerCentimeter;
  const cardHeight = COMPETITOR_CARD_PRINT_WIDTH_CM * pointsPerCentimeter;
  const marginX = (pageWidth - cardWidth * 2 - gapX) / 2;
  const rowsHeight = cardHeight * 3 + gapY * 2;
  const marginY = (pageHeight - rowsHeight) / 2;
  const pageCount = Math.ceil(images.length / 6);
  const pageObjectNumbers = Array.from({ length: pageCount }, (_, index) => 3 + index * 8);
  const objects = new Map<number, Uint8Array>();
  const objectBody = (number: number, body: Uint8Array) => objects.set(number, joinBytes([textBytes(`${number} 0 obj\n`), body, textBytes("\nendobj\n")]));
  objectBody(1, textBytes("<< /Type /Catalog /Pages 2 0 R >>"));
  objectBody(2, textBytes(`<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageCount} >>`));

  for (let page = 0; page < pageCount; page += 1) {
    const pageObject = pageObjectNumbers[page];
    const contentObject = pageObject + 1;
    const pageImages = images.slice(page * 6, page * 6 + 6);
    const imageObjectNumbers = pageImages.map((_, index) => contentObject + 1 + index);
    const commands: string[] = [];
    pageImages.forEach((_, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = marginX + column * (cardWidth + gapX);
      const top = marginY + row * (cardHeight + gapY);
      const y = pageHeight - top - cardHeight;
      // Rotate clockwise while preserving the requested physical 7.3 x 10.2 cm size.
      commands.push(`q 0 -${cardHeight.toFixed(3)} ${cardWidth.toFixed(3)} 0 ${x.toFixed(3)} ${(y + cardHeight).toFixed(3)} cm /Im${index} Do Q`);
    });
    const content = textBytes(`<< /Length ${commands.join("\n").length} >>\nstream\n${commands.join("\n")}\nendstream`);
    objectBody(pageObject, textBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /ProcSet [/PDF /ImageC] /XObject << ${imageObjectNumbers.map((number, index) => `/Im${index} ${number} 0 R`).join(" ")} >> >> /Contents ${contentObject} 0 R >>`));
    objectBody(contentObject, content);
    pageImages.forEach((image, index) => {
      objectBody(imageObjectNumbers[index], joinBytes([
        textBytes(`<< /Type /XObject /Subtype /Image /Width ${COMPETITOR_CARD_WIDTH} /Height ${COMPETITOR_CARD_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
        image,
        textBytes("\nendstream"),
      ]));
    });
  }

  const header = textBytes("%PDF-1.4\n");
  const parts: Uint8Array[] = [header];
  const offsets: number[] = [0];
  let offset = header.length;
  const maxObject = Math.max(...objects.keys());
  for (let number = 1; number <= maxObject; number += 1) {
    const object = objects.get(number);
    if (!object) continue;
    offsets[number] = offset;
    parts.push(object);
    offset += object.length;
  }
  const xrefOffset = offset;
  const xref = [`xref`, `0 ${maxObject + 1}`, "0000000000 65535 f "];
  for (let number = 1; number <= maxObject; number += 1) xref.push(`${String(offsets[number] ?? 0).padStart(10, "0")} 00000 n `);
  xref.push(`trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  parts.push(textBytes(`${xref.join("\n")}\n`));
  return new Blob([joinBytes(parts)], { type: "application/pdf" });
}

function safePdfCategory(category: string) {
  return category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "categoria";
}

export async function generateCompetitorCardsPdfInBrowser({
  user,
  registrations,
  categoryLabel,
  onProgress,
}: {
  user: FirebaseSessionUser | null;
  registrations: RegistrationDocument[];
  categoryLabel: string;
  onProgress?: (completed: number, total: number) => void;
}): Promise<CompetitorPdfResult> {
  const finalistTeams = registrations
    .filter((registration) => registration.status === "aprobada" && registration.estadoCompetitivo === "clasificado")
    .sort((left, right) => left.teamName.localeCompare(right.teamName, "es", { sensitivity: "base" }));
  const warnings: string[] = [];
  const participantInputs: Array<{ name: string; team: string }> = [];
  finalistTeams.forEach((team) => {
    const teamName = team.teamName.replace(/\s+/g, " ").trim();
    if (!teamName) { warnings.push("Se omitió un equipo clasificado sin nombre."); return; }
    if (!team.members.length) { warnings.push(`Se omitió ${teamName}: no tiene integrantes.`); return; }
    if (team.members.length !== 3) warnings.push(`${teamName} tiene ${team.members.length} integrantes; se incluyeron todos.`);
    team.members.forEach((member, index) => {
      const name = getParticipantShortName(member);
      if (!name) { warnings.push(`Se omitió el integrante ${index + 1} de ${teamName}: no tiene nombre.`); return; }
      participantInputs.push({ name, team: teamName });
    });
  });
  if (!participantInputs.length) throw new CompetitorCardGenerationError("No hay participantes válidos de equipos aprobados y clasificados para generar el PDF.");
  const assets = await loadAssets(user);
  if (!assets.competitorTemplate) throw new CompetitorCardGenerationError("No se encontró la plantilla de carnet de competidor.");
  await loadFont(assets.font);
  await document.fonts.ready;
  const template = await loadImage(asDataUrl("image/png", assets.competitorTemplate));
  const canvas = document.createElement("canvas");
  canvas.width = COMPETITOR_CARD_WIDTH;
  canvas.height = COMPETITOR_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new CompetitorCardGenerationError("El navegador no pudo crear los carnets.");
  const jpegImages: Uint8Array[] = [];
  participantInputs.forEach((participant, index) => {
    try {
      context.clearRect(0, 0, COMPETITOR_CARD_WIDTH, COMPETITOR_CARD_HEIGHT);
      context.drawImage(template, 0, 0, COMPETITOR_CARD_WIDTH, COMPETITOR_CARD_HEIGHT);
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      drawFittedText(context, participant.name, COMPETITOR_CARD_BOXES.name);
      drawFittedText(context, participant.team, COMPETITOR_CARD_BOXES.team);
      jpegImages.push(dataUrlBytes(canvas.toDataURL("image/jpeg", 0.92)));
    } catch (error) {
      if (error instanceof VirtualCardValidationError) {
        warnings.push(`Se omitió ${participant.name} de ${participant.team}: el texto no cabe en el carnet.`);
      } else {
        throw error;
      }
    }
    onProgress?.(index + 1, participantInputs.length);
  });
  if (!jpegImages.length) throw new CompetitorCardGenerationError("Ningún nombre o equipo cabe en la plantilla de carnet.");
  return {
    blob: buildSixUpLetterPdf(jpegImages),
    fileName: `carnets-finalistas-${safePdfCategory(categoryLabel)}-2026.pdf`,
    cardCount: jpegImages.length,
    warnings,
  };
}
