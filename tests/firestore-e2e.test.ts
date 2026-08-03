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
const actor = "codex-e2e@c3.com.sv";

describeE2E("controlled Firestore competitive actions", () => {
  afterAll(async () => {
    const db = getAdminDb();
    await db.collection("registrations").doc(testId).delete();
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
      const result = await applyCompetitiveActionAsAdmin({
        id: testId,
        action,
        updatedBy: actor,
      });
      expect(result.registration.status).toBe("recibida");
      const stored = (await db.collection("registrations").doc(testId).get()).data();
      expect(stored).toMatchObject({ faseActual, estadoCompetitivo, updatedBy: actor });
    }
  }, 30_000);

  it("persists classification without creating an email outbox record", async () => {
    const db = getAdminDb();
    const operationId = `e2e-no-email-${crypto.randomUUID()}`;
    await applyCompetitiveActionAsAdmin({ id: testId, action: "clasificar_presencial", updatedBy: actor });
    const registration = (await db.collection("registrations").doc(testId).get()).data();
    const outbox = await db.collection("emailOutbox").doc(`admin_${operationId}`).get();
    expect(registration).toMatchObject({ faseActual: "presencial", estadoCompetitivo: "clasificado" });
    expect(outbox.exists).toBe(false);
  }, 30_000);
});
