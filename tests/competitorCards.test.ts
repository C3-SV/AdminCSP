import { describe, expect, it } from "vitest";
import path from "node:path";
import sharp from "sharp";
import { buildSixUpLetterPdf, COMPETITOR_CARD_PRINT_HEIGHT_CM, COMPETITOR_CARD_PRINT_WIDTH_CM } from "@/lib/cards/clientVirtualParticipationCard";
import { getParticipantShortName } from "@/lib/admin/namePresentation";

describe("carnets de competidores", () => {
  it("prioriza primer nombre y primer apellido conservando tildes", () => {
    expect(getParticipantShortName({ firstName: "Christopher Alexander", lastName: "Marroquín Figueroa" })).toBe("Christopher Marroquín");
    expect(getParticipantShortName({ firstName: "Ana María", lastName: "López" })).toBe("Ana López");
    expect(getParticipantShortName({ firstName: "", lastName: "José Ángel" })).toBe("José Ángel");
  });

  it("mantiene la plantilla de 862x1204 y crea seis imágenes por página", async () => {
    const templatePath = path.join(process.cwd(), "assets", "competitor-card", "competidor-template.png");
    const metadata = await sharp(templatePath).metadata();
    expect(metadata.width).toBe(862);
    expect(metadata.height).toBe(1204);
    expect(COMPETITOR_CARD_PRINT_WIDTH_CM).toBe(7.3);
    expect(COMPETITOR_CARD_PRINT_HEIGHT_CM).toBe(10.2);
    const pdf = buildSixUpLetterPdf(Array.from({ length: 7 }, () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9])));
    const source = new TextDecoder().decode(new Uint8Array(await pdf.arrayBuffer()));
    expect((source.match(/\/Type \/Page \/Parent/g) ?? []).length).toBe(2);
    expect((source.match(/\/Subtype \/Image/g) ?? []).length).toBe(7);
    expect(source).toContain("/Width 862 /Height 1204");
  });
});
