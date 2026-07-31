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
import type { RegistrationDocument } from "@/types/admin/registration";

type FirebaseSessionUser = { getIdToken: () => Promise<string> };

export type ClientVirtualCard = {
  fileName: string;
  content: string;
};

type CardAssets = { template: string; font: string };

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
      return { template: body.template, font: body.font };
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
