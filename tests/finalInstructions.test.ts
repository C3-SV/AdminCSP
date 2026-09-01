import { describe, expect, it } from "vitest";
import { LABORATORY_OPTIONS } from "@/constants/admin";
import { buildFinalInstructionsContent } from "@/lib/email/finalInstructionsContent";
import { getFinalInstructionsEligibilityError } from "@/lib/email/finalInstructionsEligibility";
import { EMPTY_EMAIL_STATUS } from "@/types/admin/email";
import type { LaboratoryAssignment, RegistrationDocument } from "@/types/admin/registration";

function registration(laboratorioAsignado: LaboratoryAssignment | null): RegistrationDocument {
  return {
    id: "final-test",
    category: "colegios",
    teamName: "Equipo de Prueba",
    institution: "Institución de Prueba",
    discoverySource: "",
    teamDescription: "",
    teamOmegaUpUser: "",
    contactEmail: "equipo@example.com",
    members: [],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
    status: "aprobada",
    faseActual: "presencial",
    estadoCompetitivo: "clasificado",
    laboratorioAsignado,
    adminNotes: "",
    emailStatus: EMPTY_EMAIL_STATUS,
  };
}

describe("Indicaciones Finales", () => {
  it.each(LABORATORY_OPTIONS.map(({ value }) => value))("inyecta el laboratorio %s", (laboratorio) => {
    const content = buildFinalInstructionsContent(registration(laboratorio));
    expect(content.subject).toBe("Indicaciones finales para la Gran Final de la Copa 2026");
    expect(content.textContent).toContain(laboratorio);
    expect(content.htmlContent).toContain(laboratorio);
  });

  it("rechaza un equipo clasificado sin laboratorio", () => {
    expect(() => buildFinalInstructionsContent(registration(null))).toThrow("laboratorio asignado");
  });

  it("bloquea equipos no clasificados aunque tengan laboratorio", () => {
    expect(getFinalInstructionsEligibilityError({ category: "colegios", estadoCompetitivo: "no_clasificado", laboratorioAsignado: "Laboratorio de Tecnología" })).toContain("clasificados");
  });

  it("permite el correo para Universidades clasificadas con laboratorio", () => {
    expect(getFinalInstructionsEligibilityError({ category: "universidades", estadoCompetitivo: "clasificado", laboratorioAsignado: "Laboratorio de Tecnología" })).toBeNull();
  });
});
