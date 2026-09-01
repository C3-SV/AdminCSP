import { describe, expect, it } from "vitest";
import { getFinalInstructionsConfig } from "@/lib/email/finalInstructionsConfig";
import { buildFinalInstructionsContent } from "@/lib/email/finalInstructionsContent";
import type { RegistrationDocument } from "@/types/admin/registration";

const registration = (category: RegistrationDocument["category"]): RegistrationDocument => ({
  id: "test-team",
  category,
  teamName: "Equipo Universitario",
  institution: "Universidad de Prueba",
  discoverySource: "",
  teamDescription: "",
  teamOmegaUpUser: "",
  contactEmail: "contacto@example.com",
  members: [],
  consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
  status: "aprobada",
  estadoCompetitivo: "clasificado",
  laboratorioAsignado: "Laboratorio de Informática 1",
  adminNotes: "",
  emailStatus: {
    virtualInstructions: { status: "not_sent" },
    classifiedToOnsite: { status: "not_sent" },
    notClassified: { status: "not_sent" },
    finalInstructions: { status: "not_sent" },
    diplomasVirtual: { status: "not_sent" },
    diplomasPresencial: { status: "not_sent" },
  },
});

describe("final instructions category configuration", () => {
  it("uses the university date, arrival time and schedule attachment", () => {
    const config = getFinalInstructionsConfig("universidades");

    expect(config).toBeDefined();
    if (!config) return;
    expect(config.categoryLabel).toBe("Universidades");
    expect(config.finalDate).toContain("5 de septiembre");
    expect(config.arrivalTime).toBe("6:30 a. m.");
    expect(config.scheduleAttachment?.fileName).toBe("cronograma-universidades.png");
  });

  it("builds university content with the laboratory and schedule reference", () => {
    const content = buildFinalInstructionsContent(registration("universidades"));

    expect(content.textContent).toContain("5 de septiembre");
    expect(content.textContent).toContain("6:30 a. m.");
    expect(content.textContent).toContain("3:45 p. m.");
    expect(content.textContent).toContain("Laboratorio de Informática 1");
    expect(content.attachmentName).toBe("cronograma-universidades.png");
  });

  it("allows AdE with the university date and closing time", () => {
    const config = getFinalInstructionsConfig("ade");

    expect(config).toBeDefined();
    if (!config) return;
    expect(config.finalDate).toContain("5 de septiembre");
    expect(config.arrivalTime).toBe("6:30 a. m.");
    expect(config.endTime).toBe("3:45 p. m.");
    expect(buildFinalInstructionsContent(registration("ade")).textContent).toContain("3:45 p. m.");
  });

  it("keeps the existing school flow without a schedule attachment", () => {
    const content = buildFinalInstructionsContent(registration("colegios"));

    expect(content.textContent).toContain("15 de agosto");
    expect(content.textContent).toContain("7:15 a. m.");
    expect(content.textContent).toContain("3:30 p. m.");
    expect(content.attachmentName).toBeUndefined();
  });
});
