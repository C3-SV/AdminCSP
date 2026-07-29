import { afterAll, describe, expect, it } from "vitest";
import { loadEnvConfig } from "@next/env";
import { getAdminDb } from "@/lib/firebase/admin";
import { applyCompetitiveActionAsAdmin } from "@/services/admin/serverRegistrationActions";

const enabled = process.env.RUN_FIRESTORE_E2E === "true";
if (enabled) {
  loadEnvConfig(process.cwd());
}

const describeE2E = enabled ? describe.sequential : describe.skip;
const testId = `codex-admincsp-e2e-${Date.now()}`;
const operationIds: string[] = [];
const actor = "codex-e2e@c3.com.sv";

const fakeSendEmail = async () => ({ messageId: "fake-brevo-message" });

describeE2E("controlled Firestore competitive actions", () => {
  afterAll(async () => {
    const db = getAdminDb();
    await db.collection("registrations").doc(testId).delete();
    await Promise.all(operationIds.map((operationId) => db.collection("emailOutbox").doc(`admin_${operationId}`).delete()));
  });

  it("persists every action and keeps registration status independent", async () => {
    const db = getAdminDb();
    await db.collection("registrations").doc(testId).set({
      id: testId,
      category: "ade",
      teamName: "E2E Codex AdE",
      institution: "",
      discoverySource: "otro",
      discoverySourceOther: "test",
      teamDescription: "Temporary controlled test record",
      teamOmegaUpUser: "codex_e2e",
      contactEmail: "controlled@example.com",
      members: [
        { id: "member-1", firstName: "Control", lastName: "One", age: 18, email: "controlled@example.com" },
        { id: "member-2", firstName: "Control", lastName: "Two", age: 18, email: "cc@example.com" },
      ],
      consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
      status: "recibida",
      faseActual: null,
      estadoCompetitivo: null,
      adminNotes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: "",
    });

    const cases = [
      ["online", "online", "participando"],
      ["clasificar_presencial", "presencial", "clasificado"],
      ["no_clasificado", "cerrado", "no_clasificado"],
      ["finalista", "final", "finalista"],
      ["ganador", "cerrado", "ganador"],
      ["eliminado", "cerrado", "eliminado"],
    ] as const;

    for (const [action, faseActual, estadoCompetitivo] of cases) {
      const operationId = `e2e-${action}-${crypto.randomUUID()}`;
      operationIds.push(operationId);
      const result = await applyCompetitiveActionAsAdmin({
        id: testId,
        action,
        operationId,
        updatedBy: actor,
        sendEmail: fakeSendEmail,
      });
      expect(result.registration.status).toBe("recibida");
      const stored = (await db.collection("registrations").doc(testId).get()).data();
      expect(stored).toMatchObject({ faseActual, estadoCompetitivo, updatedBy: actor });
    }
  }, 30_000);

  it("does not persist a mandatory-email action when the sender fails", async () => {
    const db = getAdminDb();
    const before = (await db.collection("registrations").doc(testId).get()).data();
    const operationId = `e2e-email-failure-${crypto.randomUUID()}`;
    operationIds.push(operationId);
    await expect(
      applyCompetitiveActionAsAdmin({
        id: testId,
        action: "finalista",
        operationId,
        updatedBy: actor,
        sendEmail: async () => {
          throw new Error("simulated provider failure");
        },
      }),
    ).rejects.toThrow("correo requerido");
    const after = (await db.collection("registrations").doc(testId).get()).data();
    expect(after?.faseActual).toBe(before?.faseActual);
    expect(after?.estadoCompetitivo).toBe(before?.estadoCompetitivo);
  }, 30_000);
});
