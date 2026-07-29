import { describe, expect, it } from "vitest";
import { resolveTeamEmailRecipients } from "@/lib/email/teamRecipients";
import type { RegistrationDocument } from "@/types/admin/registration";

function registration(overrides: Partial<RegistrationDocument> = {}): RegistrationDocument {
  return {
    id: "test-team",
    category: "ade",
    teamName: "Equipo de prueba",
    institution: "",
    discoverySource: "",
    teamDescription: "",
    teamOmegaUpUser: "equipo",
    contactEmail: "principal@example.com",
    members: [],
    consents: { dataReviewAccepted: true, privacyAccepted: true, schoolImageConsentFiles: [] },
    status: "recibida",
    adminNotes: "",
    ...overrides,
  };
}

describe("resolveTeamEmailRecipients", () => {
  it("uses contactEmail as To and de-duplicates representative and members in CC", () => {
    const recipients = resolveTeamEmailRecipients(
      registration({
        contactEmail: " Principal@Example.com ",
        responsible: {
          firstName: "Ana",
          lastName: "Responsable",
          email: "ana@example.com",
          phone: "",
          institution: "",
          role: "docente",
          relationship: "",
        },
        members: [
          { id: "1", firstName: "Ana", lastName: "Uno", age: 18, email: "ANA@example.com" },
          { id: "2", firstName: "Luis", lastName: "Dos", age: 18, email: "luis@example.com" },
          { id: "3", firstName: "Vacío", lastName: "", age: 18, email: "" },
        ],
      }),
    );

    expect(recipients).toEqual({
      to: { email: "principal@example.com" },
      cc: [
        { email: "ana@example.com", name: "Ana Responsable" },
        { email: "luis@example.com", name: "Luis Dos" },
      ],
    });
  });

  it("falls back to representative, then the first valid member", () => {
    expect(
      resolveTeamEmailRecipients(
        registration({
          contactEmail: "not-an-email",
          responsible: {
            firstName: "Rosa",
            lastName: "Docente",
            email: "rosa@example.com",
            phone: "",
            institution: "",
            role: "docente",
            relationship: "",
          },
          members: [{ id: "1", firstName: "Mia", lastName: "", age: 18, email: "mia@example.com" }],
        }),
      ),
    ).toEqual({
      to: { email: "rosa@example.com", name: "Rosa Docente" },
      cc: [{ email: "mia@example.com", name: "Mia" }],
    });

    expect(
      resolveTeamEmailRecipients(
        registration({
          contactEmail: "",
          members: [{ id: "1", firstName: "Mia", lastName: "", age: 18, email: "mia@example.com" }],
        }),
      ),
    ).toEqual({ to: { email: "mia@example.com", name: "Mia" }, cc: [] });
  });

  it("returns null when no usable email exists", () => {
    expect(
      resolveTeamEmailRecipients(
        registration({ contactEmail: "", members: [{ id: "1", firstName: "", lastName: "", age: 18, email: "invalid" }] }),
      ),
    ).toBeNull();
  });
});
