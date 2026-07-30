"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { REGISTRATION_CATEGORY_LABELS, REGISTRATION_STATUS_OPTIONS } from "@/constants/admin";
import { getInstitutionDisplay, getResponsibleOrContactDisplay } from "@/lib/admin/registrationPresentation";
import {
  getRegistrationEmailHistory,
  saveRegistrationStatus,
  sendVirtualInstructions,
} from "@/services/admin/adminMutations";
import type { EmailLog } from "@/types/admin/email";
import type { RegistrationDocument, RegistrationStatus } from "@/types/admin/registration";
import { formatDate, formatPersonName } from "@/utils/admin";

function memberName(firstName: string, lastName: string) {
  return formatPersonName(firstName, lastName) || "-";
}

function statusLabel(status: EmailLog["status"] | "not_sent") {
  return { not_sent: "Sin enviar", sent: "Enviado", failed: "Falló", dry_run: "Dry run" }[status];
}

function validEmail(value: string | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function RegistrationDetail({ registration, usingMockData }: { registration: RegistrationDocument; usingMockData: boolean }) {
  const { user } = useAdminAuth();
  const [current, setCurrent] = useState(registration);
  const [status, setStatus] = useState<RegistrationStatus>(registration.status);
  const [adminNotes, setAdminNotes] = useState(registration.adminNotes ?? "");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"live" | "dry_run">("dry_run");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const reloadHistory = async () => {
    if (!user || usingMockData) return;
    setLoadingHistory(true);
    try {
      const history = await getRegistrationEmailHistory({ user, id: current.id });
      setLogs(history.logs);
      setDeliveryMode(history.deliveryMode);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible cargar el historial.", variant: "error" });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!user || usingMockData) return;
    let active = true;
    getRegistrationEmailHistory({ user, id: current.id })
      .then((history) => {
        if (active) {
          setLogs(history.logs);
          setDeliveryMode(history.deliveryMode);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setToast({ message: error instanceof Error ? error.message : "No fue posible cargar el historial.", variant: "error" });
        }
      });
    return () => { active = false; };
  }, [user, current.id, usingMockData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const contacts = useMemo(() => {
    const values = [current.responsible?.email, current.contactEmail, ...current.members.map((member) => member.email)]
      .map((email) => email?.trim())
      .filter((email): email is string => Boolean(email));
    return [...new Set(values.map((email) => email.toLowerCase()))];
  }, [current]);

  const primaryRecipient = useMemo(() => {
    const candidates = [current.responsible?.email, current.contactEmail, ...current.members.map((member) => member.email)];
    return candidates.find((email) => validEmail(email))?.trim().toLowerCase() ?? "";
  }, [current]);
  const copiedRecipients = contacts.filter((email) => email !== primaryRecipient);

  const virtualState = current.emailStatus.virtualInstructions;
  const canSend = current.status === "aprobada" && !usingMockData;

  const handleSave = async () => {
    if (usingMockData) {
      setToast({ message: "Modo prueba: Firebase no está configurado, no se guardaron cambios.", variant: "info" });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await saveRegistrationStatus({ user, id: current.id, status, adminNotes });
      setCurrent(updated);
      setToast({ message: "Cambios guardados correctamente.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible guardar los cambios.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyEmails = async () => {
    if (!contacts.length) return setToast({ message: "No hay correos para copiar.", variant: "info" });
    try {
      await navigator.clipboard.writeText(contacts.join(", "));
      setToast({ message: "Correos copiados al portapapeles.", variant: "success" });
    } catch {
      setToast({ message: "No se pudo copiar al portapapeles.", variant: "error" });
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendVirtualInstructions({ user, id: current.id, operationId: crypto.randomUUID() });
      setCurrent(result.registration);
      if (result.log) setLogs((history) => [result.log as EmailLog, ...history]);
      setShowConfirmation(false);
      setToast({ message: "Indicaciones procesadas. Revisa el historial para confirmar el estado.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible enviar las indicaciones.", variant: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-2 text-sm">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Resumen</h2>
            <p><strong>Equipo:</strong> {current.teamName}</p>
            <p><strong>Categoría:</strong> {REGISTRATION_CATEGORY_LABELS[current.category]}</p>
            <p><strong>Representando a:</strong> {getInstitutionDisplay(current)}</p>
            <p><strong>Estado de inscripción:</strong> {current.status}</p>
            <p><strong>Fecha de inscripción:</strong> {formatDate(current.createdAt)}</p>
            <p><strong>OmegaUp:</strong> {current.teamOmegaUpUser || "-"}</p>
          </Card>

          <Card className="space-y-2 text-sm">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Contacto</h3>
            <p><strong>Responsable / contacto:</strong> {getResponsibleOrContactDisplay(current)}</p>
            <p><strong>Responsable:</strong> {formatPersonName(current.responsible?.firstName, current.responsible?.lastName) || "-"}</p>
            <p><strong>Correo responsable:</strong> {current.responsible?.email || "-"}</p>
            <p><strong>Correo principal:</strong> {current.contactEmail || "-"}</p>
            <p><strong>Correos incluidos:</strong> {contacts.join(", ") || "-"}</p>
          </Card>

          <Card>
            <h3 className="font-display text-lg font-semibold text-csp-primary">Integrantes</h3>
            <div className="mt-3 space-y-2">
              {current.members.map((member, index) => (
                <div className="rounded-md border border-csp-soft p-3 text-sm" key={`${member.id}-${index}`}>
                  <p className="font-semibold text-csp-primary">Integrante {index + 1}: {memberName(member.firstName, member.lastName)}</p>
                  <p><strong>Correo:</strong> {member.email || "-"}</p>
                  <p><strong>WhatsApp:</strong> {member.whatsapp || "-"}</p>
                  {member.studentIdFile ? (
                    <p>
                      <strong>Documento adjunto:</strong>{" "}
                      <a className="font-semibold text-csp-blue hover:underline" href={member.studentIdFile.fileUrl} rel="noopener noreferrer" target="_blank">
                        {member.studentIdFile.fileName}
                      </a>{" "}
                      <span className="text-csp-black/70">({formatBytes(member.studentIdFile.fileSize)})</span>
                    </p>
                  ) : <p><strong>Documento adjunto:</strong> No disponible</p>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-2 text-sm">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Consentimientos y adjuntos</h3>
            <p><strong>Revisión de datos:</strong> {current.consents.dataReviewAccepted ? "Aceptado" : "No aceptado"}</p>
            <p><strong>Privacidad:</strong> {current.consents.privacyAccepted ? "Aceptado" : "No aceptado"}</p>
            {current.consents.schoolImageConsentFiles.length ? (
              <ul className="space-y-1">
                {current.consents.schoolImageConsentFiles.map((file) => (
                  <li key={file.fileKey}>
                    <strong>Consentimiento adjunto:</strong>{" "}
                    <a className="font-semibold text-csp-blue hover:underline" href={file.fileUrl} rel="noopener noreferrer" target="_blank">
                      {file.fileName}
                    </a>{" "}
                    <span className="text-csp-black/70">({formatBytes(file.fileSize)})</span>
                  </li>
                ))}
              </ul>
            ) : <p><strong>Consentimientos adjuntos:</strong> No hay archivos.</p>}
          </Card>

          <Card className="space-y-2 text-sm">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Correos</h3>
            <p><strong>Indicaciones fase virtual:</strong> {statusLabel(virtualState.status)}{virtualState.lastAttemptAt ? ` · ${formatDate(virtualState.lastAttemptAt)}` : ""}</p>
            <p><strong>Clasificado presencial:</strong> Próximamente</p>
            <p><strong>No clasificado:</strong> Próximamente</p>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-csp-primary">Historial de correos</h3>
              <Button isLoading={loadingHistory} onClick={() => void reloadHistory()} type="button" variant="secondary">Actualizar</Button>
            </div>
            {logs.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {logs.map((log) => (
                  <li className="rounded-md border border-csp-soft p-3" key={log.id}>
                    <p className="font-semibold text-csp-primary">Indicaciones fase virtual · {statusLabel(log.status)}</p>
                    <p>{formatDate(log.createdAt)} · {log.to}{log.cc.length ? ` · CC: ${log.cc.join(", ")}` : ""}</p>
                    {log.attachment ? <p className="text-csp-black/70">Adjunto: {log.attachment.name}</p> : null}
                    {log.errorMessage ? <p className="text-csp-danger">Error: {log.errorMessage}</p> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-csp-black/70">No hay correos registrados para este equipo.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Acciones</h3>
            <Button disabled={!canSend} onClick={() => setShowConfirmation(true)} type="button">
              {virtualState.lastSentAt ? "Reenviar indicaciones fase virtual" : "Enviar indicaciones fase virtual"}
            </Button>
            {!canSend ? <p className="text-sm text-csp-black/70">{usingMockData ? "No disponible con datos de prueba." : "Disponible sólo cuando el equipo está aprobado."}</p> : null}
            <Button onClick={() => void handleCopyEmails()} type="button" variant="secondary">Copiar correos</Button>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Gestión de inscripción</h3>
            <Select id="status" label="Estado" onChange={(event) => setStatus(event.target.value as RegistrationStatus)} options={REGISTRATION_STATUS_OPTIONS} value={status} />
            <Textarea id="admin-notes" label="Notas administrativas" onChange={(event) => setAdminNotes(event.target.value)} rows={6} value={adminNotes} />
            <Button isLoading={isSaving} onClick={() => void handleSave()} type="button">Guardar cambios</Button>
          </Card>
        </div>
      </div>

      {showConfirmation ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg space-y-3 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Confirmar indicaciones fase virtual</h2>
            <p className="text-sm"><strong>Equipo:</strong> {current.teamName}</p>
            <p className="text-sm"><strong>Representando a:</strong> {getInstitutionDisplay(current)}</p>
            <p className="text-sm"><strong>Integrantes:</strong> {current.members.map((member) => memberName(member.firstName, member.lastName)).join(", ")}</p>
            <p className="text-sm"><strong>Para:</strong> {primaryRecipient || "Sin correo"}</p>
            <p className="text-sm"><strong>CC:</strong> {copiedRecipients.join(", ") || "-"}</p>
            <p className="text-sm"><strong>Modo:</strong> {deliveryMode === "live" ? "Envío real por Brevo" : "Dry run: Brevo valida sin entregar el correo"}</p>
            {virtualState.lastSentAt ? <p className="rounded-md bg-csp-warning/10 p-2 text-sm">Ya se envió exitosamente el {formatDate(virtualState.lastSentAt)}. Esta acción generará un reenvío.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button disabled={isSending} onClick={() => setShowConfirmation(false)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={isSending} onClick={() => void handleSend()} type="button">Confirmar envío</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
