import { describe, expect, it, vi } from "vitest";
import {
  parseRecipientField,
  resolveCustomEmailRecipients,
  validateCustomEmailRecipients,
} from "@/lib/email/customEmailRecipients";
import { buildCustomEmailContent } from "@/lib/email/customEmailContent";
import {
  sendCustomEmailAsAdmin,
  type CustomEmailServiceDependencies,
} from "@/services/admin/serverCustomEmail";
import { applyCustomEmailFormat } from "@/lib/email/customEmailEditor";

describe("custom email recipients", () => {
  it("splits comma, semicolon and line-break separated addresses", () => {
    expect(
      parseRecipientField(" Uno@Example.com, dos@example.com;\ntres@example.com\r\n"),
    ).toEqual({
      recipients: ["uno@example.com", "dos@example.com", "tres@example.com"],
      invalid: [],
    });
  });

  it("reports invalid tokens without discarding valid addresses", () => {
    expect(parseRecipientField("bien@example.com; sin-arroba; otro@example.com")).toEqual({
      recipients: ["bien@example.com", "otro@example.com"],
      invalid: ["sin-arroba"],
    });
  });

  it("deduplicates addresses with priority To, CC, then BCC", () => {
    expect(
      resolveCustomEmailRecipients({
        to: "a@example.com; b@example.com",
        cc: "B@example.com; c@example.com",
        bcc: "a@example.com; c@example.com; d@example.com",
      }),
    ).toMatchObject({
      to: ["a@example.com", "b@example.com"],
      cc: ["c@example.com"],
      bcc: ["d@example.com"],
      invalid: { to: [], cc: [], bcc: [] },
    });
  });

  it("rejects missing primary recipients and identifies invalid fields", () => {
    expect(() =>
      validateCustomEmailRecipients({
        to: "correo-invalido",
        cc: "cc-invalido",
        bcc: "",
      }),
    ).toThrow(/Para.*válido/i);
  });
});

describe("custom email content", () => {
  it("renders supported formatting inside the existing branded email shell", () => {
    const result = buildCustomEmailContent({
      subject: "  Aviso importante  ",
      content:
        "# Encabezado\n\nHola **equipo** y *participantes*.\n\n- Primer punto\n- Segundo punto\n\n1. Uno\n2. Dos\n\n[Visitar sitio](https://copa.c3.com.sv)",
    });

    expect(result.subject).toBe("Aviso importante");
    expect(result.htmlContent).toContain("C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026");
    expect(result.htmlContent).toContain("<h1");
    expect(result.htmlContent).toContain("<strong>equipo</strong>");
    expect(result.htmlContent).toContain("<em>participantes</em>");
    expect(result.htmlContent).toContain("<ul");
    expect(result.htmlContent).toContain("<ol");
    expect(result.htmlContent).toContain('href="https://copa.c3.com.sv/"');
    expect(result.textContent).toContain("Encabezado");
    expect(result.textContent).not.toContain("**");
  });

  it("escapes raw HTML and does not create unsafe links", () => {
    const result = buildCustomEmailContent({
      subject: "Prueba <script>",
      content: '<script>alert("x")</script> [Abrir](javascript:alert(1))',
    });

    expect(result.htmlContent).not.toContain("<script>");
    expect(result.htmlContent).toContain("&lt;script&gt;");
    expect(result.htmlContent).not.toContain('href="javascript:');
    expect(result.subject).toBe("Prueba <script>");
  });

  it("does not apply emphasis markup inside generated link attributes", () => {
    const result = buildCustomEmailContent({
      subject: "Enlace",
      content: "[Archivo](https://example.com/ruta/*documento*)",
    });
    expect(result.htmlContent).toContain('href="https://example.com/ruta/*documento*"');
    expect(result.htmlContent).not.toMatch(/href="[^"]*<em>/);
  });

  it("rejects empty and oversized required fields", () => {
    expect(() => buildCustomEmailContent({ subject: "", content: "Mensaje" })).toThrow(/asunto/i);
    expect(() => buildCustomEmailContent({ subject: "Asunto", content: "   " })).toThrow(/contenido/i);
    expect(() => buildCustomEmailContent({ subject: "x".repeat(201), content: "Mensaje" })).toThrow(/200/);
  });
});

function serviceDependencies(
  overrides: Partial<CustomEmailServiceDependencies> = {},
): CustomEmailServiceDependencies {
  return {
    assertDeliveryEnabled: vi.fn(async () => undefined),
    assertSenderConfigured: vi.fn(() => undefined),
    getDeliveryMode: () => "dry_run",
    readOutbox: vi.fn(async () => null),
    createOutbox: vi.fn(async () => undefined),
    persistResult: vi.fn(async (result) => ({
      id: "log-1",
      emailType: "custom" as const,
      subject: result.subject,
      to: result.to[0] ?? "",
      toEmails: result.to,
      cc: result.cc,
      bcc: result.bcc,
      status: result.status,
      createdBy: result.updatedBy,
      errorMessage: result.errorMessage,
      brevoMessageId: result.messageId,
    })),
    sendEmail: vi.fn(async () => ({ messageId: "message-1" })),
    ...overrides,
  };
}

describe("custom email service", () => {
  const input = {
    to: "uno@example.com; dos@example.com",
    cc: "copia@example.com",
    bcc: "oculto@example.com",
    subject: "Aviso",
    content: "Hola **equipo**.",
  };

  it("uses sandbox in dry-run and persists only audit metadata", async () => {
    const dependencies = serviceDependencies();
    const result = await sendCustomEmailAsAdmin({
      operationId: "custom-operation-123456",
      updatedBy: "admin@example.com",
      input,
      dependencies,
    });

    expect(dependencies.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: [{ email: "uno@example.com" }, { email: "dos@example.com" }],
      cc: [{ email: "copia@example.com" }],
      bcc: [{ email: "oculto@example.com" }],
      sandbox: true,
      idempotencyKey: "custom-operation-123456",
    }));
    expect(dependencies.assertSenderConfigured).toHaveBeenCalledOnce();
    expect(dependencies.persistResult).toHaveBeenCalledWith(expect.objectContaining({
      status: "dry_run",
      subject: "Aviso",
      to: ["uno@example.com", "dos@example.com"],
    }));
    expect(dependencies.persistResult).not.toHaveBeenCalledWith(expect.objectContaining({
      content: expect.anything(),
      htmlContent: expect.anything(),
    }));
    expect(result.log?.status).toBe("dry_run");
  });

  it("does not send an operation already completed", async () => {
    const dependencies = serviceDependencies({
      readOutbox: vi.fn(async () => ({ kind: "custom", status: "dry_run" })),
    });
    const result = await sendCustomEmailAsAdmin({
      operationId: "custom-operation-123456",
      updatedBy: "admin@example.com",
      input,
      dependencies,
    });

    expect(result).toMatchObject({ alreadyProcessed: true });
    expect(dependencies.sendEmail).not.toHaveBeenCalled();
  });

  it("persists a failed audit entry when delivery fails", async () => {
    const persistResult = vi.fn(serviceDependencies().persistResult);
    const dependencies = serviceDependencies({
      sendEmail: vi.fn(async () => { throw new Error("Brevo no disponible"); }),
      persistResult,
    });

    await expect(sendCustomEmailAsAdmin({
      operationId: "custom-operation-123456",
      updatedBy: "admin@example.com",
      input,
      dependencies,
    })).rejects.toThrow(/registró el fallo/i);
    expect(persistResult).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorMessage: "Brevo no disponible",
    }));
  });

  it("returns a validation status before creating an outbox entry", async () => {
    const dependencies = serviceDependencies();
    await expect(sendCustomEmailAsAdmin({
      operationId: "custom-operation-123456",
      updatedBy: "admin@example.com",
      input: { ...input, to: "no-es-correo" },
      dependencies,
    })).rejects.toMatchObject({ status: 422 });
    expect(dependencies.createOutbox).not.toHaveBeenCalled();
  });
});

describe("custom email editor formatting", () => {
  it("wraps the current selection in bold markers", () => {
    expect(applyCustomEmailFormat("Hola equipo", 5, 11, "bold")).toEqual({
      value: "Hola **equipo**",
      selectionStart: 7,
      selectionEnd: 13,
    });
  });

  it("prefixes every selected line as a bullet list", () => {
    expect(applyCustomEmailFormat("Uno\nDos", 0, 7, "bullet-list").value).toBe("- Uno\n- Dos");
  });

  it("inserts a safe link template around selected text", () => {
    expect(applyCustomEmailFormat("Formulario", 0, 10, "link")).toEqual({
      value: "[Formulario](https://)",
      selectionStart: 13,
      selectionEnd: 21,
    });
  });
});
