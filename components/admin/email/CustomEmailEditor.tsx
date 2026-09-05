"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { buildCustomEmailContent, CUSTOM_EMAIL_MAX_CONTENT_LENGTH, CUSTOM_EMAIL_MAX_SUBJECT_LENGTH } from "@/lib/email/customEmailContent";
import { applyCustomEmailFormat, type CustomEmailFormatAction } from "@/lib/email/customEmailEditor";
import { resolveCustomEmailRecipients } from "@/lib/email/customEmailRecipients";
import { sendCustomEmail } from "@/services/admin/adminMutations";

type CustomEmailEditorProps = {
  senderEmail: string;
  senderName: string;
  deliveryMode: "live" | "dry_run";
};

const TOOLBAR_ACTIONS: Array<{ action: CustomEmailFormatAction; label: string; title: string }> = [
  { action: "bold", label: "Negrita", title: "Aplicar negrita" },
  { action: "italic", label: "Cursiva", title: "Aplicar cursiva" },
  { action: "heading", label: "Título", title: "Convertir en título" },
  { action: "bullet-list", label: "Viñetas", title: "Crear lista con viñetas" },
  { action: "numbered-list", label: "Numeración", title: "Crear lista numerada" },
  { action: "link", label: "Enlace", title: "Insertar enlace" },
];

function invalidMessage(label: string, invalid: string[]) {
  return invalid.length ? `${label}: corrige ${invalid.join(", ")}` : undefined;
}

export function CustomEmailEditor({ senderEmail, senderName, deliveryMode }: CustomEmailEditorProps) {
  const { user } = useAdminAuth();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const recipients = useMemo(() => resolveCustomEmailRecipients({ to, cc, bcc }), [to, cc, bcc]);
  const preview = useMemo(() => {
    if (!subject.trim() || !content.trim()) return null;
    try {
      return buildCustomEmailContent({ subject, content });
    } catch {
      return null;
    }
  }, [subject, content]);
  const senderConfigured = Boolean(senderEmail);
  const hasInvalidRecipients = Object.values(recipients.invalid).some((values) => values.length > 0);
  const canReview = senderConfigured
    && recipients.to.length > 0
    && !hasInvalidRecipients
    && subject.trim().length > 0
    && subject.trim().length <= CUSTOM_EMAIL_MAX_SUBJECT_LENGTH
    && content.trim().length > 0
    && content.length <= CUSTOM_EMAIL_MAX_CONTENT_LENGTH;

  useEffect(() => {
    if (!showConfirmation) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSending) setShowConfirmation(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showConfirmation, isSending]);

  const applyFormat = (action: CustomEmailFormatAction) => {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? content.length;
    const end = editor?.selectionEnd ?? content.length;
    const change = applyCustomEmailFormat(content, start, end, action);
    setContent(change.value);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(change.selectionStart, change.selectionEnd);
    });
  };

  const review = () => {
    if (!canReview) {
      setToast({ message: "Corrige los campos marcados antes de revisar el envío.", variant: "error" });
      return;
    }
    setShowConfirmation(true);
  };

  const handleSend = async () => {
    if (!user || isSending || !canReview) return;
    setIsSending(true);
    setToast(null);
    try {
      const result = await sendCustomEmail({
        user,
        operationId: crypto.randomUUID(),
        to,
        cc,
        bcc,
        subject,
        content,
      });
      setShowConfirmation(false);
      setToast({
        message: result.alreadyProcessed
          ? "Esta operación ya había sido procesada. No se duplicó el envío."
          : deliveryMode === "live"
            ? "Correo personalizado enviado y registrado."
            : "Brevo validó el correo en dry run y se registró el resultado.",
        variant: result.alreadyProcessed ? "info" : "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "No fue posible enviar el correo personalizado.",
        variant: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      <AdminTopbar
        subtitle="Redacta mensajes puntuales con el formato oficial y destinatarios personalizados."
        title="Correo personalizado"
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <Card className="space-y-5">
          <div className="rounded-md bg-csp-soft/70 px-4 py-3 text-sm text-csp-black/80">
            <p className="font-semibold text-csp-primary">Remitente fijo</p>
            <p>{senderConfigured ? `${senderName || "C3"} <${senderEmail}>` : "BREVO_SENDER_EMAIL no está configurado"}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Textarea
              error={invalidMessage("Para", recipients.invalid.to) ?? (!recipients.to.length && to.trim() ? "Agrega al menos un correo válido." : undefined)}
              id="custom-email-to"
              label={`Para · ${recipients.to.length} válido${recipients.to.length === 1 ? "" : "s"}`}
              onChange={(event) => setTo(event.target.value)}
              placeholder="persona@correo.com, otra@correo.com"
              rows={4}
              value={to}
            />
            <Textarea
              error={invalidMessage("CC", recipients.invalid.cc)}
              id="custom-email-cc"
              label={`CC · ${recipients.cc.length} válido${recipients.cc.length === 1 ? "" : "s"}`}
              onChange={(event) => setCc(event.target.value)}
              placeholder="copia@correo.com"
              rows={4}
              value={cc}
            />
            <Textarea
              error={invalidMessage("CCO", recipients.invalid.bcc)}
              id="custom-email-bcc"
              label={`CCO · ${recipients.bcc.length} válido${recipients.bcc.length === 1 ? "" : "s"}`}
              onChange={(event) => setBcc(event.target.value)}
              placeholder="oculto@correo.com"
              rows={4}
              value={bcc}
            />
          </div>
          <p className="text-xs text-csp-black/60">
            Separa direcciones con comas, punto y coma o saltos de línea. Los duplicados se conservan sólo en Para, luego CC y finalmente CCO.
          </p>

          <Input
            error={subject.length > CUSTOM_EMAIL_MAX_SUBJECT_LENGTH ? `Máximo ${CUSTOM_EMAIL_MAX_SUBJECT_LENGTH} caracteres.` : undefined}
            id="custom-email-subject"
            label={`Asunto · ${subject.length}/${CUSTOM_EMAIL_MAX_SUBJECT_LENGTH}`}
            maxLength={CUSTOM_EMAIL_MAX_SUBJECT_LENGTH + 1}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Escribe un asunto claro"
            value={subject}
          />

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Formato del mensaje">
              {TOOLBAR_ACTIONS.map((item) => (
                <Button
                  className="h-9 px-3 text-xs"
                  key={item.action}
                  onClick={() => applyFormat(item.action)}
                  title={item.title}
                  type="button"
                  variant="secondary"
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <Textarea
              error={content.length > CUSTOM_EMAIL_MAX_CONTENT_LENGTH ? `Máximo ${CUSTOM_EMAIL_MAX_CONTENT_LENGTH.toLocaleString("es-SV")} caracteres.` : undefined}
              id="custom-email-content"
              label="Mensaje"
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escribe aquí el contenido del correo..."
              ref={editorRef}
              rows={16}
              value={content}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-csp-black/60">
              <span>La vista previa muestra exactamente el formato seguro que se enviará.</span>
              <span>{content.length.toLocaleString("es-SV")}/{CUSTOM_EMAIL_MAX_CONTENT_LENGTH.toLocaleString("es-SV")}</span>
            </div>
          </div>

          {!senderConfigured ? (
            <p className="form-error">Configura BREVO_SENDER_EMAIL en Vercel antes de usar este flujo.</p>
          ) : null}
          <div className="flex justify-end">
            <Button disabled={!canReview || isSending} onClick={review} type="button">
              Revisar y enviar
            </Button>
          </div>
        </Card>

        <div className="space-y-2 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="font-display text-lg font-semibold text-csp-primary">Vista previa</h2>
            <span className="text-xs text-csp-black/60">640 px · correo</span>
          </div>
          <div className="overflow-hidden rounded-lg bg-csp-white shadow-csp-lg">
            {preview ? (
              <iframe
                className="h-[720px] w-full bg-white"
                sandbox=""
                srcDoc={preview.htmlContent}
                title="Vista previa del correo personalizado"
              />
            ) : (
              <div className="grid h-[520px] place-items-center bg-csp-soft/40 p-8 text-center">
                <div className="max-w-xs">
                  <p className="font-display text-lg font-semibold text-csp-primary">Tu mensaje aparecerá aquí</p>
                  <p className="mt-2 text-sm text-csp-black/60">Agrega un asunto y contenido para revisar el formato antes de enviar.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmation ? (
        <div
          aria-labelledby="custom-email-confirmation-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSending) setShowConfirmation(false);
          }}
          role="dialog"
        >
          <Card className="max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto shadow-xl">
            <div>
              <h2 className="font-display text-xl font-semibold text-csp-primary" id="custom-email-confirmation-title">Confirmar correo personalizado</h2>
              <p className="mt-1 text-sm text-csp-black/60">Revisa los destinatarios antes de ejecutar esta operación.</p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-[120px_1fr]">
              <dt className="font-semibold">Remitente</dt><dd className="break-all">{senderName || "C3"} &lt;{senderEmail}&gt;</dd>
              <dt className="font-semibold">Para ({recipients.to.length})</dt><dd className="break-all">{recipients.to.join(", ")}</dd>
              <dt className="font-semibold">CC ({recipients.cc.length})</dt><dd className="break-all">{recipients.cc.join(", ") || "—"}</dd>
              <dt className="font-semibold">CCO ({recipients.bcc.length})</dt><dd className="break-all">{recipients.bcc.join(", ") || "—"}</dd>
              <dt className="font-semibold">Asunto</dt><dd>{subject.trim()}</dd>
            </dl>
            <p className={`rounded-md p-3 text-sm ${deliveryMode === "live" ? "bg-csp-warning/10 text-csp-black" : "bg-csp-soft text-csp-primary"}`}>
              <strong>Modo:</strong> {deliveryMode === "live" ? "envío real por Brevo" : "dry run; Brevo validará el mensaje sin entregarlo"}.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button autoFocus disabled={isSending} onClick={() => setShowConfirmation(false)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={isSending} onClick={() => void handleSend()} type="button">Confirmar envío</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
