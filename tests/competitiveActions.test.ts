import { describe, expect, it } from "vitest";
import {
  COMPETITIVE_ACTIONS,
  COMPETITIVE_ACTION_KEYS,
  isCompetitiveActionKey,
} from "@/lib/admin/competitiveActions";

describe("competitive action mapping", () => {
  it("maps every visible action to the persisted fields", () => {
    expect(COMPETITIVE_ACTIONS.online).toMatchObject({
      faseActual: "online",
      estadoCompetitivo: "participando",
    });
    expect(COMPETITIVE_ACTIONS.clasificar_presencial).toMatchObject({
      faseActual: "presencial",
      estadoCompetitivo: "clasificado",
      emailType: "classified_to_onsite",
    });
    expect(COMPETITIVE_ACTIONS.no_clasificado).toMatchObject({
      faseActual: "cerrado",
      estadoCompetitivo: "no_clasificado",
      emailType: "not_classified",
    });
    expect(COMPETITIVE_ACTIONS.finalista).toMatchObject({
      faseActual: "final",
      estadoCompetitivo: "finalista",
      emailType: "finalist",
    });
    expect(COMPETITIVE_ACTIONS.ganador).toMatchObject({
      faseActual: "cerrado",
      estadoCompetitivo: "ganador",
      emailType: "winner",
    });
    expect(COMPETITIVE_ACTIONS.eliminado).toMatchObject({
      faseActual: "cerrado",
      estadoCompetitivo: "eliminado",
    });
  });

  it("accepts only known actions", () => {
    COMPETITIVE_ACTION_KEYS.forEach((action) => expect(isCompetitiveActionKey(action)).toBe(true));
    expect(isCompetitiveActionKey("ganador ")).toBe(false);
    expect(isCompetitiveActionKey("otro")).toBe(false);
  });
});
