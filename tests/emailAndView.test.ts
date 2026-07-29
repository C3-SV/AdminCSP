import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRegistrationCompetitiveView } from "@/lib/admin/registrationView";
import type { RegistrationDocument } from "@/types/admin/registration";

const baseRegistration: RegistrationDocument = {
  id: "team",
  category: "ade",
  teamName: "Equipo",
  institution: "",
  discoverySource: "",
  teamDescription: "",
  teamOmegaUpUser: "equipo",
  members: [],
  consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
  status: "recibida",
  adminNotes: "",
};

describe("stored competitive view", () => {
  it("does not hide a classified team when registration status remains recibida", () => {
    expect(
      resolveRegistrationCompetitiveView({
        ...baseRegistration,
        faseActual: "presencial",
        estadoCompetitivo: "clasificado",
      }),
    ).toMatchObject({
      faseActualMostrada: "presencial",
      estadoCompetitivoMostrado: "clasificado",
    });
  });

  it("uses pending only for fields that are not stored", () => {
    expect(resolveRegistrationCompetitiveView(baseRegistration)).toMatchObject({
      faseActualMostrada: "pendiente",
      estadoCompetitivoMostrado: "pendiente",
    });
  });
});

describe("Brevo payload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends CC recipients and an idempotency key without performing a real request", async () => {
    vi.stubEnv("BREVO_API_KEY", "xkeysib-test");
    vi.stubEnv("BREVO_SENDER_EMAIL", "noreply@example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ messageId: "message-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { sendBrevoEmail } = await import("@/lib/email/sendBrevoEmail");

    await sendBrevoEmail({
      to: { email: "principal@example.com" },
      cc: [{ email: "member@example.com", name: "Member" }],
      templateId: 3,
      params: { TEAM_NAME: "Equipo" },
      idempotencyKey: "operation-id-123456",
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toMatchObject({
      to: [{ email: "principal@example.com" }],
      cc: [{ email: "member@example.com", name: "Member" }],
      headers: { "Idempotency-Key": "operation-id-123456" },
    });
  });
});
