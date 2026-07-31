import { describe, expect, it } from "vitest";
import path from "node:path";
import sharp from "sharp";
import { getInstitutionDisplay } from "@/lib/admin/registrationPresentation";
import { generateVirtualParticipationCard, getVirtualCardInput } from "@/lib/cards/virtualParticipationCard";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { buildVirtualInstructionsContent } from "@/lib/email/virtualInstructionsContent";
import { EMPTY_EMAIL_STATUS } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

function team(overrides: Partial<RegistrationDocument> = {}): RegistrationDocument {
  return {
    id: "team-1",
    category: "ade",
    teamName: "Árboles Binarios",
    institution: "",
    discoverySource: "",
    teamDescription: "",
    teamOmegaUpUser: "arboles",
    contactEmail: "contacto@example.com",
    members: [
      { id: "1", firstName: "Ana", lastName: "García", age: 18, email: "ana@example.com" },
      { id: "2", firstName: "Luis", lastName: "López", age: 18, email: "luis@example.com" },
    ],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
    status: "aprobada",
    adminNotes: "",
    emailStatus: EMPTY_EMAIL_STATUS,
    ...overrides,
  };
}

describe("virtual instructions helpers", () => {
  it("uses AdE as the institution shown on the card", () => {
    expect(getInstitutionDisplay(team())).toBe("AdE");
    expect(getVirtualCardInput(team()).institution).toBe("AdE");
  });

  it("prioritizes the responsible person and deduplicates operational CC", () => {
    const recipients = resolveVirtualInstructionRecipients(
      team({
        responsible: {
          firstName: "Rosa",
          lastName: "Docente",
          email: "rosa@example.com",
          phone: "",
          institution: "",
          role: "docente",
          relationship: "",
        },
      }),
      "LUIS@example.com",
    );
    expect(recipients).toEqual({
      to: { email: "rosa@example.com", name: "Rosa Docente" },
      cc: [
        { email: "contacto@example.com" },
        { email: "ana@example.com", name: "Ana García" },
        { email: "luis@example.com", name: "Luis López" },
      ],
    });
  });

  it("renders a native-size PNG with one to three members", async () => {
    const card = await generateVirtualParticipationCard(team());
    expect(card.fileName).toMatch(/^CSP-2026-fase-virtual-/);
    expect(card.buffer.subarray(1, 4).toString()).toBe("PNG");
    expect(card.buffer.length).toBeGreaterThan(10_000);
    expect(card.sha256).toHaveLength(64);

    // Regression guard: a valid PNG is not enough—the text pixels must differ
    // from the blank source template, as they did not in the Vercel failure.
    const [generated, template] = await Promise.all([
      sharp(card.buffer).ensureAlpha().raw().toBuffer(),
      sharp(path.join(process.cwd(), "assets", "virtual-card", "participacion-virtual-template.png"))
        .resize(1400, 1750, { fit: "fill" })
        .ensureAlpha()
        .raw()
        .toBuffer(),
    ]);
    let changedPixels = 0;
    for (let index = 0; index < generated.length; index += 4) {
      if (
        Math.abs(generated[index] - template[index]) > 10 ||
        Math.abs(generated[index + 1] - template[index + 1]) > 10 ||
        Math.abs(generated[index + 2] - template[index + 2]) > 10
      ) changedPixels += 1;
    }
    expect(changedPixels).toBeGreaterThan(1_000);
  }, 15_000);

  it("fits long but realistic team, institution, and member names without changing card dimensions", async () => {
    const card = await generateVirtualParticipationCard(
      team({
        teamName: "Los Algoritmos de la Montaña y la Costa",
        institution: "Universidad Centroamericana José Simeón Cañas, Facultad de Ingeniería",
        category: "universidades",
        members: [
          { id: "1", firstName: "María Fernanda", lastName: "Rodríguez de Hernández", age: 20, email: "maria@example.com" },
          { id: "2", firstName: "José Alejandro", lastName: "Martínez Villalta", age: 20, email: "jose@example.com" },
          { id: "3", firstName: "Ana Sofía", lastName: "Castillo Guardado", age: 20, email: "ana@example.com" },
        ],
      }),
    );
    const metadata = await sharp(card.buffer).metadata();
    expect(metadata.width).toBe(1400);
    expect(metadata.height).toBe(1750);
    expect(card.members).toHaveLength(3);
  }, 15_000);

  it("rejects an unbreakable value that cannot fit instead of creating a cropped card", async () => {
    await expect(
      generateVirtualParticipationCard(team({ teamName: "X".repeat(400) })),
    ).rejects.toThrow("no cabe en la tarjeta");
  });

  it("builds direct email content and requires the WhatsApp group URL", () => {
    const previous = process.env.CSP_VIRTUAL_WHATSAPP_URL;
    process.env.CSP_VIRTUAL_WHATSAPP_URL = "https://chat.whatsapp.com/example";
    const content = buildVirtualInstructionsContent(team());
    expect(content.subject).toContain("fase virtual");
    expect(content.htmlContent).toContain("chat.whatsapp.com/example");
    expect(content.htmlContent).toContain("Árboles Binarios");
    if (previous === undefined) delete process.env.CSP_VIRTUAL_WHATSAPP_URL;
    else process.env.CSP_VIRTUAL_WHATSAPP_URL = previous;
  });
});
