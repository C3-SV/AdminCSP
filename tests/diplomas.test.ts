import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  DIPLOMA_NAME_AREA,
  getDiplomaTemplate,
  getParticipantDiplomaFileName,
  getParticipantFullName,
  generateParticipantDiploma,
} from "@/lib/diplomas/teamDiplomas";
import { buildDiplomaEmailContent } from "@/lib/email/diplomaContent";
import { getDiplomaDeliverySuspension } from "@/lib/diplomas/diplomaAvailability";
import { resolveParticipationStatus } from "@/lib/admin/participationStatus";
import { EMPTY_EMAIL_STATUS } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

function team(overrides: Partial<RegistrationDocument> = {}): RegistrationDocument {
  return {
    id: "team-diploma",
    category: "universidades",
    teamName: "Null Pointers",
    institution: "ESEN",
    discoverySource: "",
    teamDescription: "",
    teamOmegaUpUser: "null-pointers",
    contactEmail: "contacto@example.com",
    members: [{ id: "1", firstName: "María Fernanda", lastName: "Rodríguez Hernández", age: 20, email: "maria@example.com" }],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
    status: "aprobada",
    participacionVirtual: true,
    participacionPresencial: false,
    adminNotes: "",
    emailStatus: EMPTY_EMAIL_STATUS,
    ...overrides,
  };
}

describe("diplomas CSP 2026", () => {
  it("maps every category and phase to the official master page", () => {
    expect(getDiplomaTemplate("colegios", "virtual").pageIndex).toBe(0);
    expect(getDiplomaTemplate("colegios", "presencial").pageIndex).toBe(1);
    expect(getDiplomaTemplate("universidades", "virtual").pageIndex).toBe(2);
    expect(getDiplomaTemplate("universidades", "presencial").pageIndex).toBe(3);
    expect(getDiplomaTemplate("ade", "virtual").pageIndex).toBe(2);
    expect(getDiplomaTemplate("ade", "presencial").pageIndex).toBe(3);
  });

  it("preserves the full display name and sanitizes only the filename", () => {
    const name = getParticipantFullName({ firstName: "María Fernanda", lastName: "Rodríguez Hernández" });
    expect(name).toBe("María Fernanda Rodríguez Hernández");
    expect(getParticipantDiplomaFileName(name, "virtual")).toBe("maria-fernanda-rodriguez-hernandez-csp-2026-fase-virtual.pdf");
  });

  it("creates one-page PDFs using all four templates for realistic names", async () => {
    const samples = [
      { category: "colegios" as const, phase: "virtual" as const, firstName: "Ana", lastName: "López" },
      { category: "colegios" as const, phase: "presencial" as const, firstName: "Christopher Alexander", lastName: "Marroquín Figueroa" },
      { category: "universidades" as const, phase: "virtual" as const, firstName: "María Fernanda", lastName: "Rodríguez Hernández" },
      { category: "universidades" as const, phase: "presencial" as const, firstName: "Ana", lastName: "López" },
    ];
    for (const sample of samples) {
      const diploma = await generateParticipantDiploma({ participant: { firstName: sample.firstName, lastName: sample.lastName }, category: sample.category, phase: sample.phase });
      const document = await PDFDocument.load(diploma.buffer);
      expect(document.getPageCount()).toBe(1);
      expect(document.getPage(0).getWidth()).toBeCloseTo(842.25, 1);
      expect(document.getPage(0).getHeight()).toBeCloseTo(595.5, 1);
      expect(diploma.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    }
  }, 30_000);

  it("uses a centered safe name region with room from the official white rectangle", () => {
    expect(DIPLOMA_NAME_AREA).toMatchObject({ x: 191.884, y: 314.895, width: 458.122, height: 47.859, preferredFontSize: 32, minFontSize: 18 });
  });

  it("marks participation from authoritative results without treating classification as onsite attendance", () => {
    expect(resolveParticipationStatus({ puntajeOnline: 0, puntajePresencial: null, participacionVirtual: false, participacionPresencial: false, estadoCompetitivo: "pendiente" })).toEqual({ participacionVirtual: true, participacionPresencial: false });
    expect(resolveParticipationStatus({ puntajeOnline: null, puntajePresencial: null, participacionVirtual: false, participacionPresencial: false, estadoCompetitivo: "clasificado" })).toEqual({ participacionVirtual: true, participacionPresencial: false });
    expect(resolveParticipationStatus({ puntajeOnline: null, puntajePresencial: 0, participacionVirtual: false, participacionPresencial: false, estadoCompetitivo: "clasificado" })).toEqual({ participacionVirtual: true, participacionPresencial: true });
  });

  it("suspends only University and AdE onsite diploma delivery", () => {
    expect(getDiplomaDeliverySuspension("colegios", "presencial")).toBeNull();
    expect(getDiplomaDeliverySuspension("universidades", "virtual")).toBeNull();
    expect(getDiplomaDeliverySuspension("universidades", "presencial")).toContain("suspendidos");
    expect(getDiplomaDeliverySuspension("ade", "presencial")).toContain("suspendidos");
  });

  it("uses the qualified virtual message only before participating onsite", () => {
    expect(buildDiplomaEmailContent(team({ estadoCompetitivo: "clasificado" }), "virtual").textContent).toContain("Nos vemos en la final");
    expect(buildDiplomaEmailContent(team({ estadoCompetitivo: "clasificado", participacionPresencial: true }), "virtual").textContent).not.toContain("Nos vemos en la final");
    expect(buildDiplomaEmailContent(team(), "presencial").textContent).toContain("Final Presencial");
  });
});
