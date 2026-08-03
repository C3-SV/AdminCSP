import { describe, expect, it } from "vitest";
import path from "node:path";
import sharp from "sharp";
import { ONSITE_FINALIST_CARD_CONFIG, ONSITE_FINALIST_CARD_HEIGHT, ONSITE_FINALIST_CARD_WIDTH } from "@/lib/cards/onsiteFinalistCardLayout";
import { buildOnsiteClassificationContent } from "@/lib/email/onsiteClassificationContent";
import { EMPTY_EMAIL_STATUS } from "@/types/admin/email";
import type { KnownRegistrationCategory, RegistrationDocument } from "@/types/admin/registration";

function team(category: KnownRegistrationCategory): RegistrationDocument {
  return {
    id: `test-${category}`, category, teamName: "Equipo con Nombre Muy Largo para Validar Ajuste", institution: category === "ade" ? "" : "Institución con Nombre Largo de Prueba",
    discoverySource: "", teamDescription: "", teamOmegaUpUser: "test", contactEmail: "test@example.com",
    members: [{ id: "1", firstName: "María Fernanda", lastName: "Rodríguez Hernández", age: 20, email: "test@example.com" }],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] }, status: "aprobada", adminNotes: "", emailStatus: EMPTY_EMAIL_STATUS,
  };
}

describe("tarjetas y correo de clasificación presencial", () => {
  it.each([
    ["colegios", "15 de agosto de 2026", "colegios-finalista.png"],
    ["universidades", "5 de septiembre de 2026", "universidades-finalista.png"],
    ["ade", "5 de septiembre de 2026", "ade-finalista.png"],
  ] as const)("usa plantilla y fecha correctas para %s", async (category, date, fileName) => {
    expect(ONSITE_FINALIST_CARD_CONFIG[category].finalDate).toBe(date);
    const metadata = await sharp(path.join(process.cwd(), "assets", "onsite-card", fileName)).metadata();
    expect(metadata.width).toBe(ONSITE_FINALIST_CARD_WIDTH);
    expect(metadata.height).toBe(ONSITE_FINALIST_CARD_HEIGHT);
    const content = buildOnsiteClassificationContent(team(category));
    expect(content.textContent).toContain(date);
    expect(content.textContent).toContain(ONSITE_FINALIST_CARD_CONFIG[category].categoryLabel);
  });
});
