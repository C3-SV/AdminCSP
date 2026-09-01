import { describe, expect, it } from "vitest";
import { getLaboratoryDistribution } from "@/utils/admin/metrics";
import { EMPTY_EMAIL_STATUS } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

function registration(overrides: Partial<RegistrationDocument>): RegistrationDocument {
  return {
    id: "team",
    category: "universidades",
    teamName: "Equipo base",
    institution: "Institución",
    discoverySource: "",
    teamDescription: "",
    teamOmegaUpUser: "",
    members: [],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
    status: "aprobada",
    estadoCompetitivo: "clasificado",
    laboratorioAsignado: "Laboratorio de Tecnología",
    adminNotes: "",
    emailStatus: EMPTY_EMAIL_STATUS,
    ...overrides,
  };
}

describe("distribución de laboratorios", () => {
  it("combines Universities and AdE while excluding other categories and non-classified teams", () => {
    const distribution = getLaboratoryDistribution(
      [
        registration({ id: "u1", teamName: "Uni Alpha", laboratorioAsignado: "Laboratorio de Tecnología" }),
        registration({ id: "a1", category: "ade", teamName: "AdE Beta", laboratorioAsignado: "Laboratorio de Tecnología" }),
        registration({ id: "c1", category: "colegios", teamName: "Colegio Gamma", laboratorioAsignado: "Laboratorio de Tecnología" }),
        registration({ id: "u2", teamName: "Uni Delta", estadoCompetitivo: "pendiente", laboratorioAsignado: "Laboratorio de Tecnología" }),
      ],
      ["universidades", "ade"],
      { includeCategoryLabel: true },
    );

    expect(distribution[0]).toMatchObject({ total: 2, teams: ["Universidades · Uni Alpha", "AdE · AdE Beta"] });
    expect(distribution[1].total).toBe(0);
  });
});
