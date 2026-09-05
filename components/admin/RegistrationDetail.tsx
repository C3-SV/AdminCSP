"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import {
  COMPETITIVE_PHASE_OPTIONS,
  COMPETITIVE_STATUS_OPTIONS,
  LABORATORY_OPTIONS,
  REGISTRATION_CATEGORY_LABELS,
  REGISTRATION_STATUS_OPTIONS,
} from "@/constants/admin";
import { getInstitutionDisplay, getResponsibleOrContactDisplay } from "@/lib/admin/registrationPresentation";
import { resolveParticipationStatus } from "@/lib/admin/participationStatus";
import { getDiplomaDeliverySuspension } from "@/lib/diplomas/diplomaAvailability";
import { getDiplomaEmailScenarioLabel, type DiplomaEmailScenario } from "@/lib/diplomas/diplomaEmailScenario";
import { getFinalInstructionsConfig } from "@/lib/email/finalInstructionsConfig";
import { generateOnsiteFinalistCardInBrowser, generateOnsiteFinalistStoryInBrowser, generateVirtualParticipationCardInBrowser } from "@/lib/cards/clientVirtualParticipationCard";
import {
  getRegistrationEmailHistory,
  getTeamDiplomaPreview,
  saveRegistrationStatus,
  saveRegistrationResults,
  sendNotClassified,
  sendFinalInstructions,
  sendOnsiteClassification,
  sendTeamDiplomas,
  saveLaboratoryAssignment,
  sendVirtualInstructions,
} from "@/services/admin/adminMutations";
import type { EmailLog } from "@/types/admin/email";
import type {
  CompetitivePhase,
  CompetitiveStatus,
  LaboratoryAssignment,
  RegistrationDocument,
  RegistrationStatus,
} from "@/types/admin/registration";
import { formatDate, formatPersonName } from "@/utils/admin";

function memberName(firstName: string, lastName: string) {
  return formatPersonName(firstName, lastName) || "-";
}

function statusLabel(status: EmailLog["status"] | "not_sent") {
  return { not_sent: "Sin enviar", sent: "Enviado", failed: "Falló", dry_run: "Dry run" }[status];
}

function emailTypeLabel(type: EmailLog["emailType"]) {
  return {
    virtual_instructions: "Indicaciones fase virtual",
    classified_to_onsite: "Clasificación presencial",
    not_classified: "No clasificación",
    final_instructions: "Indicaciones finales",
    diplomas_virtual: "Diplomas fase virtual",
    diplomas_presencial: "Diplomas fase presencial",
    finalist: "Finalista",
    winner: "Ganador",
    custom: "Correo personalizado",
  }[type];
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
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [isSavingLaboratory, setIsSavingLaboratory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingOnsite, setIsSendingOnsite] = useState(false);
  const [isSendingNotClassified, setIsSendingNotClassified] = useState(false);
  const [isSendingFinalInstructions, setIsSendingFinalInstructions] = useState(false);
  const [isSendingDiplomaVirtual, setIsSendingDiplomaVirtual] = useState(false);
  const [isSendingDiplomaPresencial, setIsSendingDiplomaPresencial] = useState(false);
  const [isLoadingDiplomaPreview, setIsLoadingDiplomaPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOnsiteConfirmation, setShowOnsiteConfirmation] = useState(false);
  const [showNotClassifiedConfirmation, setShowNotClassifiedConfirmation] = useState(false);
  const [showFinalInstructionsConfirmation, setShowFinalInstructionsConfirmation] = useState(false);
  const [diplomaConfirmation, setDiplomaConfirmation] = useState<{ phase: "virtual" | "presencial"; emailScenario: DiplomaEmailScenario } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"live" | "dry_run">("dry_run");
  const [onlineScore, setOnlineScore] = useState(registration.puntajeOnline?.toString() ?? "");
  const [onsiteScore, setOnsiteScore] = useState(registration.puntajePresencial?.toString() ?? "");
  const [participacionVirtual, setParticipacionVirtual] = useState(Boolean(registration.participacionVirtual));
  const [participacionPresencial, setParticipacionPresencial] = useState(Boolean(registration.participacionPresencial));
  const [phase, setPhase] = useState<CompetitivePhase>(registration.faseActual ?? "online");
  const [competitiveState, setCompetitiveState] = useState<CompetitiveStatus>(registration.estadoCompetitivo ?? "pendiente");
  const [laboratory, setLaboratory] = useState<LaboratoryAssignment | "">(registration.laboratorioAsignado ?? "");
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
  const onsiteState = current.emailStatus.classifiedToOnsite;
  const notClassifiedState = current.emailStatus.notClassified;
  const finalInstructionsState = current.emailStatus.finalInstructions;
  const finalInstructionsConfig = current.category === "desconocida" ? undefined : getFinalInstructionsConfig(current.category);
  const diplomasVirtualState = current.emailStatus.diplomasVirtual;
  const diplomasPresencialState = current.emailStatus.diplomasPresencial;
  const canSend = current.status === "aprobada" && !usingMockData;
  const canSendOnsite = current.estadoCompetitivo === "clasificado" && !usingMockData;
  const canSendNotClassified = current.estadoCompetitivo === "no_clasificado" && !usingMockData;
  const canAssignLaboratory = current.estadoCompetitivo === "clasificado" && !usingMockData;
  const canSendFinalInstructions = Boolean(finalInstructionsConfig) && canAssignLaboratory && Boolean(current.laboratorioAsignado);
  const virtualDiplomaSuspension = getDiplomaDeliverySuspension(current.category, "virtual");
  const presencialDiplomaSuspension = getDiplomaDeliverySuspension(current.category, "presencial");
  const canSendDiplomaVirtual = current.status === "aprobada" && current.category !== "desconocida" && current.participacionVirtual && !virtualDiplomaSuspension && !usingMockData;
  const canSendDiplomaPresencial = current.status === "aprobada" && current.category !== "desconocida" && current.participacionPresencial && !presencialDiplomaSuspension && !usingMockData;

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

  const readScore = (value: string, label: string) => {
    if (!value.trim()) return null;
    const score = Number(value);
    if (!Number.isFinite(score) || score < 0) throw new Error(`${label} debe ser un número igual o mayor que cero.`);
    return score;
  };

  const handleSaveResults = async (overrides?: {
    phase?: CompetitivePhase;
    status?: CompetitiveStatus;
  }) => {
    if (usingMockData) {
      setToast({ message: "Modo prueba: Firebase no está configurado, no se guardaron cambios.", variant: "info" });
      return;
    }
    setIsSavingResults(true);
    try {
      const selectedPhase = overrides?.phase ?? phase;
      const selectedStatus = overrides?.status ?? competitiveState;
      const selectedOnlineScore = readScore(onlineScore, "Puntaje online");
      const selectedOnsiteScore = readScore(onsiteScore, "Puntaje presencial");
      const resolvedParticipation = resolveParticipationStatus({
        puntajeOnline: selectedOnlineScore,
        puntajePresencial: selectedOnsiteScore,
        participacionVirtual,
        participacionPresencial,
        estadoCompetitivo: selectedStatus,
      });
      const updated = await saveRegistrationResults({
        user,
        id: current.id,
        puntajeOnline: selectedOnlineScore,
        puntajePresencial: selectedOnsiteScore,
        ...resolvedParticipation,
        faseActual: selectedPhase,
        estadoCompetitivo: selectedStatus,
      });
      setCurrent(updated);
      setOnlineScore(updated.puntajeOnline?.toString() ?? "");
      setOnsiteScore(updated.puntajePresencial?.toString() ?? "");
      setParticipacionVirtual(Boolean(updated.participacionVirtual));
      setParticipacionPresencial(Boolean(updated.participacionPresencial));
      setPhase(updated.faseActual ?? selectedPhase);
      setCompetitiveState(updated.estadoCompetitivo ?? selectedStatus);
      setToast({ message: "Resultados y estado competitivo guardados. No se envió ningún correo.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible guardar los resultados.", variant: "error" });
    } finally {
      setIsSavingResults(false);
    }
  };

  const handleSaveLaboratory = async () => {
    if (!canAssignLaboratory) return;
    setIsSavingLaboratory(true);
    try {
      const updated = await saveLaboratoryAssignment({ user, id: current.id, laboratorioAsignado: laboratory || null });
      setCurrent(updated);
      setLaboratory(updated.laboratorioAsignado ?? "");
      setToast({ message: "Laboratorio asignado correctamente.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible guardar el laboratorio.", variant: "error" });
    } finally {
      setIsSavingLaboratory(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const card = await generateVirtualParticipationCardInBrowser({ user, registration: current });
      const result = await sendVirtualInstructions({ user, id: current.id, operationId: crypto.randomUUID(), card });
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

  const handleSendOnsite = async () => {
    setIsSendingOnsite(true);
    try {
      const [post, story] = await Promise.all([
        generateOnsiteFinalistCardInBrowser({ user, registration: current }),
        generateOnsiteFinalistStoryInBrowser({ user, registration: current }),
      ]);
      const result = await sendOnsiteClassification({ user, id: current.id, operationId: crypto.randomUUID(), cards: { post, story } });
      setCurrent(result.registration);
      if (result.log) setLogs((history) => [result.log as EmailLog, ...history]);
      setShowOnsiteConfirmation(false);
      setToast({ message: "Clasificación presencial procesada. Revisa el historial para confirmar el estado.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible enviar la clasificación presencial.", variant: "error" });
    } finally {
      setIsSendingOnsite(false);
    }
  };

  const handleSendNotClassified = async () => {
    setIsSendingNotClassified(true);
    try {
      const result = await sendNotClassified({ user, id: current.id, operationId: crypto.randomUUID() });
      setCurrent(result.registration);
      if (result.log) setLogs((history) => [result.log as EmailLog, ...history]);
      setShowNotClassifiedConfirmation(false);
      setToast({ message: "Correo de no clasificación procesado. Revisa el historial para confirmar el estado.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible enviar el correo de no clasificación.", variant: "error" });
    } finally {
      setIsSendingNotClassified(false);
    }
  };

  const handleSendFinalInstructions = async () => {
    setIsSendingFinalInstructions(true);
    try {
      const result = await sendFinalInstructions({ user, id: current.id, operationId: crypto.randomUUID() });
      setCurrent(result.registration);
      if (result.log) setLogs((history) => [result.log as EmailLog, ...history]);
      setShowFinalInstructionsConfirmation(false);
      setToast({ message: "Indicaciones finales procesadas. Revisa el historial para confirmar el estado.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible enviar las indicaciones finales.", variant: "error" });
    } finally {
      setIsSendingFinalInstructions(false);
    }
  };

  const handleSendDiplomas = async (phaseToSend: "virtual" | "presencial") => {
    const setSending = phaseToSend === "virtual" ? setIsSendingDiplomaVirtual : setIsSendingDiplomaPresencial;
    setSending(true);
    try {
      const result = await sendTeamDiplomas({ user, id: current.id, phase: phaseToSend, operationId: crypto.randomUUID() });
      setCurrent(result.registration);
      if (result.log) setLogs((history) => [result.log as EmailLog, ...history]);
      setDiplomaConfirmation(null);
      setToast({ message: `Diplomas de fase ${phaseToSend === "virtual" ? "virtual" : "presencial"} procesados. Revisa el historial para confirmar el estado.`, variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible enviar los diplomas.", variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const openDiplomaConfirmation = async (phaseToSend: "virtual" | "presencial") => {
    setIsLoadingDiplomaPreview(true);
    try {
      // The preview is read from Firestore immediately before the confirmation is shown.
      const preview = await getTeamDiplomaPreview({ user, id: current.id, phase: phaseToSend });
      setCurrent(preview.registration);
      setDiplomaConfirmation({ phase: phaseToSend, emailScenario: preview.emailScenario });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "No fue posible preparar el envío de diplomas.", variant: "error" });
    } finally {
      setIsLoadingDiplomaPreview(false);
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
            <p><strong>DescripciÃ³n del equipo:</strong> <span className="whitespace-pre-wrap">{current.teamDescription || "-"}</span></p>
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

          <Card className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-csp-primary">Resultados y avance competitivo</h3>
              <p className="mt-1 text-sm text-csp-black/70">Guardar estos cambios no envía correos ni notificaciones.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input id="online-score" label="Puntaje online" min="0" onChange={(event) => { setOnlineScore(event.target.value); if (event.target.value.trim()) setParticipacionVirtual(true); }} step="any" type="number" value={onlineScore} />
              <Input id="onsite-score" label="Puntaje presencial" min="0" onChange={(event) => { setOnsiteScore(event.target.value); if (event.target.value.trim()) setParticipacionPresencial(true); }} step="any" type="number" value={onsiteScore} />
              <Select id="competitive-phase" label="Fase actual" onChange={(event) => setPhase(event.target.value as CompetitivePhase)} options={COMPETITIVE_PHASE_OPTIONS} value={phase} />
              <Select id="competitive-status" label="Estado competitivo" onChange={(event) => setCompetitiveState(event.target.value as CompetitiveStatus)} options={COMPETITIVE_STATUS_OPTIONS} value={competitiveState} />
            </div>
            <div className="grid gap-3 rounded-md border border-csp-soft bg-csp-soft/20 p-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-csp-primary">
                <input checked={participacionVirtual} className="size-4 accent-csp-primary" onChange={(event) => setParticipacionVirtual(event.target.checked)} type="checkbox" />
                Participó en fase virtual
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-csp-primary">
                <input checked={participacionPresencial} className="size-4 accent-csp-primary" onChange={(event) => setParticipacionPresencial(event.target.checked)} type="checkbox" />
                Participó en fase presencial
              </label>
            </div>
            {current.estadoCompetitivo === "clasificado" ? (
              <div className="rounded-md border border-csp-soft bg-csp-soft/20 p-3">
                <Select id="laboratorio-asignado" label="Laboratorio asignado" onChange={(event) => setLaboratory(event.target.value as LaboratoryAssignment)} options={[...LABORATORY_OPTIONS]} placeholder="Selecciona un laboratorio" value={laboratory} />
                <Button disabled={!canAssignLaboratory} isLoading={isSavingLaboratory} onClick={() => void handleSaveLaboratory()} type="button" variant="secondary">Guardar laboratorio</Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button isLoading={isSavingResults} onClick={() => void handleSaveResults()} type="button">Guardar resultados</Button>
              <Button disabled={isSavingResults} onClick={() => void handleSaveResults({ phase: "presencial", status: "clasificado" })} type="button" variant="secondary">Clasificar a presencial</Button>
              <Button disabled={isSavingResults} onClick={() => void handleSaveResults({ phase: "cerrado", status: "no_clasificado" })} type="button" variant="danger">Marcar como no clasificado</Button>
            </div>
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
            <p><strong>Clasificación presencial:</strong> {statusLabel(onsiteState.status)}{onsiteState.lastAttemptAt ? ` · ${formatDate(onsiteState.lastAttemptAt)}` : ""}</p>
            <p><strong>No clasificación:</strong> {statusLabel(notClassifiedState.status)}{notClassifiedState.lastAttemptAt ? ` · ${formatDate(notClassifiedState.lastAttemptAt)}` : ""}</p>
            <p><strong>Indicaciones finales:</strong> {statusLabel(finalInstructionsState.status)}{finalInstructionsState.lastAttemptAt ? ` · ${formatDate(finalInstructionsState.lastAttemptAt)}` : ""}</p>
            <p><strong>Diplomas fase virtual:</strong> {statusLabel(diplomasVirtualState.status)}{diplomasVirtualState.lastAttemptAt ? ` · ${formatDate(diplomasVirtualState.lastAttemptAt)}` : ""}</p>
            <p><strong>Diplomas fase presencial:</strong> {statusLabel(diplomasPresencialState.status)}{diplomasPresencialState.lastAttemptAt ? ` · ${formatDate(diplomasPresencialState.lastAttemptAt)}` : ""}</p>
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
                    <p className="font-semibold text-csp-primary">{emailTypeLabel(log.emailType)} · {statusLabel(log.status)}</p>
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
            <Button disabled={!canSendOnsite} onClick={() => setShowOnsiteConfirmation(true)} type="button" variant="secondary">
              {onsiteState.lastSentAt ? "Reenviar clasificación presencial" : "Enviar clasificación presencial"}
            </Button>
            {!canSendOnsite ? <p className="text-sm text-csp-black/70">Disponible sólo para equipos clasificados.</p> : null}
            <Button disabled={!canSendNotClassified} onClick={() => setShowNotClassifiedConfirmation(true)} type="button" variant="danger">
              {notClassifiedState.lastSentAt ? "Reenviar correo de no clasificación" : "Enviar correo de no clasificación"}
            </Button>
            {!canSendNotClassified ? <p className="text-sm text-csp-black/70">Disponible sólo para equipos no clasificados.</p> : null}
            <Button disabled={!canSendFinalInstructions} onClick={() => setShowFinalInstructionsConfirmation(true)} type="button">
              {finalInstructionsState.lastSentAt ? "Reenviar Indicaciones Finales" : "Enviar Indicaciones Finales"}
            </Button>
            {!canSendFinalInstructions ? <p className="text-sm text-csp-black/70">Disponible sólo para equipos clasificados de Colegios, Universidades o AdE con laboratorio asignado.</p> : null}
            <div className="border-t border-csp-soft pt-4">
              <p className="font-semibold text-csp-primary">Fase Virtual</p>
              <p className="mt-1 text-sm text-csp-black/70">{diplomasVirtualState.lastSentAt ? `✓ Enviado el ${formatDate(diplomasVirtualState.lastSentAt)}` : "Pendiente"}</p>
              <Button disabled={!canSendDiplomaVirtual} isLoading={isSendingDiplomaVirtual || isLoadingDiplomaPreview} onClick={() => void openDiplomaConfirmation("virtual")} type="button" variant="secondary">
                {diplomasVirtualState.lastSentAt ? "Reenviar diploma fase virtual" : "Enviar diploma fase virtual"}
              </Button>
              {!canSendDiplomaVirtual ? <p className="mt-1 text-sm text-csp-black/70">{usingMockData ? "No disponible con datos de prueba." : virtualDiplomaSuspension ?? "El equipo todavía no registra participación en la fase virtual."}</p> : null}
            </div>
            <div className="border-t border-csp-soft pt-4">
              <p className="font-semibold text-csp-primary">Fase Presencial</p>
              <p className="mt-1 text-sm text-csp-black/70">{diplomasPresencialState.lastSentAt ? `✓ Enviado el ${formatDate(diplomasPresencialState.lastSentAt)}` : "Pendiente"}</p>
              <Button disabled={!canSendDiplomaPresencial} isLoading={isSendingDiplomaPresencial || isLoadingDiplomaPreview} onClick={() => void openDiplomaConfirmation("presencial")} type="button" variant="secondary">
                {diplomasPresencialState.lastSentAt ? "Reenviar diploma fase presencial" : "Enviar diploma fase presencial"}
              </Button>
              {!canSendDiplomaPresencial ? <p className="mt-1 text-sm text-csp-black/70">{usingMockData ? "No disponible con datos de prueba." : presencialDiplomaSuspension ?? "El equipo todavía no registra participación en la fase presencial."}</p> : null}
            </div>
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

      {diplomaConfirmation ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg space-y-3 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Enviar diplomas de fase {diplomaConfirmation.phase === "virtual" ? "virtual" : "presencial"}</h2>
            <p className="text-sm"><strong>Equipo:</strong> {current.teamName}</p>
            <p className="text-sm"><strong>Categoría:</strong> {REGISTRATION_CATEGORY_LABELS[current.category]}</p>
            <p className="text-sm"><strong>Integrantes:</strong> {current.members.length}</p>
            <p className="text-sm">Se generarán {current.members.length} diplomas individuales{diplomaConfirmation.phase === "presencial" ? " de la Final Presencial" : ""}.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {current.members.map((member, index) => <li key={`${member.id}-${index}`}>{memberName(member.firstName, member.lastName)}</li>)}
            </ul>
            <p className="text-sm"><strong>Para:</strong> {primaryRecipient || "Sin correo"}</p>
            <p className="text-sm"><strong>CC:</strong> {copiedRecipients.join(", ") || "-"}</p>
            <p className="rounded-md border border-csp-soft bg-csp-soft/20 p-2 text-sm"><strong>Tipo de mensaje:</strong> {getDiplomaEmailScenarioLabel(diplomaConfirmation.emailScenario)} Se validó con el estado actual del equipo y se volverá a validar al enviar.</p>
            <p className="text-sm"><strong>Modo:</strong> {deliveryMode === "live" ? "Envío real por Brevo" : "Dry run: Brevo valida sin entregar el correo"}</p>
            {(diplomaConfirmation.phase === "virtual" ? diplomasVirtualState : diplomasPresencialState).lastSentAt ? <p className="rounded-md bg-csp-warning/10 p-2 text-sm">Ya se enviaron exitosamente estos diplomas el {formatDate((diplomaConfirmation.phase === "virtual" ? diplomasVirtualState : diplomasPresencialState).lastSentAt)}. Esta acción generará un reenvío.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button disabled={isSendingDiplomaVirtual || isSendingDiplomaPresencial} onClick={() => setDiplomaConfirmation(null)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={diplomaConfirmation.phase === "virtual" ? isSendingDiplomaVirtual : isSendingDiplomaPresencial} onClick={() => void handleSendDiplomas(diplomaConfirmation.phase)} type="button">Generar y enviar</Button>
            </div>
          </Card>
        </div>
      ) : null}
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
      {showOnsiteConfirmation ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg space-y-3 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Confirmar clasificación presencial</h2>
            <p className="text-sm"><strong>Equipo:</strong> {current.teamName}</p>
            <p className="text-sm"><strong>Representando a:</strong> {getInstitutionDisplay(current)}</p>
            <p className="text-sm"><strong>Integrantes:</strong> {current.members.map((member) => memberName(member.firstName, member.lastName)).join(", ")}</p>
            <p className="text-sm"><strong>Para:</strong> {primaryRecipient || "Sin correo"}</p>
            <p className="text-sm"><strong>CC:</strong> {copiedRecipients.join(", ") || "-"}</p>
            <p className="text-sm"><strong>Adjuntos:</strong> tarjeta para publicación (1080×1350) y tarjeta para historia (1080×1920).</p>
            <p className="text-sm"><strong>Modo:</strong> {deliveryMode === "live" ? "Envío real por Brevo" : "Dry run: Brevo valida sin entregar el correo"}</p>
            {onsiteState.lastSentAt ? <p className="rounded-md bg-csp-warning/10 p-2 text-sm">Ya se envió exitosamente el {formatDate(onsiteState.lastSentAt)}. Esta acción generará un reenvío.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button disabled={isSendingOnsite} onClick={() => setShowOnsiteConfirmation(false)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={isSendingOnsite} onClick={() => void handleSendOnsite()} type="button">Confirmar envío</Button>
            </div>
          </Card>
        </div>
      ) : null}
      {showNotClassifiedConfirmation ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg space-y-3 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Confirmar correo de no clasificación</h2>
            <p className="text-sm"><strong>Equipo:</strong> {current.teamName}</p>
            <p className="text-sm"><strong>Categoría:</strong> {REGISTRATION_CATEGORY_LABELS[current.category]}</p>
            <p className="text-sm"><strong>Representando a:</strong> {getInstitutionDisplay(current)}</p>
            <p className="text-sm"><strong>Integrantes:</strong> {current.members.map((member) => memberName(member.firstName, member.lastName)).join(", ")}</p>
            <p className="text-sm"><strong>Para:</strong> {primaryRecipient || "Sin correo"}</p>
            <p className="text-sm"><strong>CC:</strong> {copiedRecipients.join(", ") || "-"}</p>
            <p className="text-sm"><strong>Modo:</strong> {deliveryMode === "live" ? "Envío real por Brevo" : "Dry run: Brevo valida sin entregar el correo"}</p>
            {notClassifiedState.lastSentAt ? <p className="rounded-md bg-csp-warning/10 p-2 text-sm">Ya se envió exitosamente el {formatDate(notClassifiedState.lastSentAt)}. Esta acción generará un reenvío.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button disabled={isSendingNotClassified} onClick={() => setShowNotClassifiedConfirmation(false)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={isSendingNotClassified} onClick={() => void handleSendNotClassified()} type="button" variant="danger">Confirmar envío</Button>
            </div>
          </Card>
        </div>
      ) : null}
      {showFinalInstructionsConfirmation ? (
        <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-csp-black/50 p-4" role="dialog">
          <Card className="w-full max-w-lg space-y-3 shadow-xl">
            <h2 className="font-display text-xl font-semibold text-csp-primary">Confirmar Indicaciones Finales</h2>
            <p className="text-sm"><strong>Equipo:</strong> {current.teamName}</p>
            <p className="text-sm"><strong>Categoría:</strong> {finalInstructionsConfig?.categoryLabel ?? "-"}</p>
            <p className="text-sm"><strong>Final presencial:</strong> {finalInstructionsConfig?.finalDate ?? "-"}</p>
            <p className="text-sm"><strong>Llegada:</strong> {finalInstructionsConfig ? `desde las ${finalInstructionsConfig.arrivalTime} en ${finalInstructionsConfig.arrivalLocation}` : "-"}</p>
            <p className="text-sm"><strong>Laboratorio:</strong> {current.laboratorioAsignado || "Sin asignar"}</p>
            <p className="text-sm"><strong>Integrantes:</strong> {current.members.map((member) => memberName(member.firstName, member.lastName)).join(", ")}</p>
            <p className="text-sm"><strong>Para:</strong> {primaryRecipient || "Sin correo"}</p>
            <p className="text-sm"><strong>CC:</strong> {copiedRecipients.join(", ") || "-"}</p>
            {finalInstructionsConfig?.scheduleAttachment ? <p className="text-sm"><strong>Adjunto:</strong> {finalInstructionsConfig.scheduleAttachment.fileName}</p> : null}
            <p className="text-sm"><strong>Asunto:</strong> Indicaciones finales para la Gran Final de la Copa 2026</p>
            <p className="text-sm"><strong>Modo:</strong> {deliveryMode === "live" ? "Envío real por Brevo" : "Dry run: Brevo valida sin entregar el correo"}</p>
            {finalInstructionsState.lastSentAt ? <p className="rounded-md bg-csp-warning/10 p-2 text-sm">Ya se envió exitosamente el {formatDate(finalInstructionsState.lastSentAt)}. Esta acción generará un reenvío.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button disabled={isSendingFinalInstructions} onClick={() => setShowFinalInstructionsConfirmation(false)} type="button" variant="secondary">Cancelar</Button>
              <Button isLoading={isSendingFinalInstructions} onClick={() => void handleSendFinalInstructions()} type="button">Confirmar envío</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
