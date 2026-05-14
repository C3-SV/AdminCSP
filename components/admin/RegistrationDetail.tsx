"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { REGISTRATION_STATUS_OPTIONS } from "@/constants/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { updateRegistrationStatus } from "@/services/admin/registrations";
import { RegistrationDocument, RegistrationStatus } from "@/types/admin/registration";
import { formatDate, formatPersonName } from "@/utils/admin";

type RegistrationDetailProps = {
  registration: RegistrationDocument;
  usingMockData: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function RegistrationDetail({
  registration,
  usingMockData,
}: RegistrationDetailProps) {
  const { user, adminProfile } = useAdminAuth();
  const [status, setStatus] = useState<RegistrationStatus>(registration.status);
  const [adminNotes, setAdminNotes] = useState(registration.adminNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  // TODO: Proteger esta vista con autenticación admin antes de producción.
  // TODO: Revisar privacidad de archivos y uso de URLs privadas/firmadas.

  const handleSave = async () => {
    if (usingMockData) {
      setToast({
        message: "Modo prueba: Firebase no está configurado, no se guardaron cambios.",
        variant: "info",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedBy = (user?.email ?? adminProfile?.email ?? "").trim().toLowerCase();
      await updateRegistrationStatus(
        registration.id,
        status,
        adminNotes,
        updatedBy || undefined,
      );
      setToast({ message: "Cambios guardados correctamente.", variant: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "No fue posible guardar los cambios.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}

      <div className="space-y-4 lg:col-span-2">
        <Card className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-csp-primary">
            Información general
          </h2>
          <p className="text-sm">
            <strong>Equipo:</strong> {registration.teamName}
          </p>
          <p className="text-sm">
            <strong>Categoría:</strong> {registration.category}
          </p>
          <p className="text-sm">
            <strong>Institución:</strong> {registration.institution}
          </p>
          <p className="text-sm">
            <strong>OmegaUp del equipo:</strong> {registration.teamOmegaUpUser || "-"}
          </p>
          <p className="text-sm">
            <strong>Responsable:</strong>{" "}
            {registration.category === "colegios"
              ? formatPersonName(
                  registration.responsible.firstName,
                  registration.responsible.lastName,
                ) || "-"
              : "No aplica"}
          </p>
          <p className="text-sm">
            <strong>Estado:</strong> {status}
          </p>
          <p className="text-sm">
            <strong>Fecha:</strong> {formatDate(registration.createdAt)}
          </p>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold text-csp-primary">Miembros</h3>
          <div className="mt-3 space-y-3">
            {registration.members.map((member, index) => (
              <div
                key={`${member.id}-${index}`}
                className="rounded-md border border-csp-soft p-3 text-sm"
              >
                <p className="font-semibold text-csp-primary">
                  Miembro {index + 1}: {formatPersonName(member.firstName, member.lastName) || "-"}
                </p>
                <p>
                  <strong>Nombre:</strong>{" "}
                  {formatPersonName(member.firstName, member.lastName) || "-"}
                </p>
                <p>
                  <strong>Correo:</strong> {member.email}
                </p>
                <p>
                  <strong>WhatsApp:</strong> {member.whatsapp || "-"}
                </p>
                <p>
                  <strong>Carrera / Año:</strong>{" "}
                  {member.career ? `${member.career} / ${member.universityYear}` : "-"}
                </p>
                <p>
                  <strong>Grado escolar:</strong> {member.schoolGrade || "-"}
                </p>
                {registration.category === "universidades" ? (
                  <p>
                    <strong>LinkedIn:</strong> {member.linkedin || "-"}
                  </p>
                ) : null}
                {member.studentIdFile ? (
                  <div className="mt-1 space-y-1">
                    <p>
                      <strong>Documento:</strong> {member.studentIdFile.fileName}
                    </p>
                    <p>
                      <strong>Tamaño:</strong> {formatBytes(member.studentIdFile.fileSize)}
                    </p>
                    <p>
                      <strong>Proveedor:</strong> {member.studentIdFile.provider}
                    </p>
                    <a
                      className="font-semibold text-csp-blue hover:underline"
                      href={member.studentIdFile.fileUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Ver documento
                    </a>
                  </div>
                ) : (
                  <p>
                    <strong>Documento:</strong> No disponible
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {registration.category === "colegios" ? (
          <Card className="space-y-2 text-sm">
            <h3 className="font-display text-lg font-semibold text-csp-primary">Responsable</h3>
            <p>
              <strong>Nombre:</strong>{" "}
              {formatPersonName(
                registration.responsible.firstName,
                registration.responsible.lastName,
              ) || "-"}
            </p>
            <p>
              <strong>Correo:</strong> {registration.responsible.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {registration.responsible.phone}
            </p>
            <p>
              <strong>Institución:</strong> {registration.responsible.institution}
            </p>
            <p>
              <strong>Rol:</strong> {registration.responsible.role || "-"}
            </p>
            <p>
              <strong>Relación:</strong> {registration.responsible.relationship}
            </p>
          </Card>
        ) : null}

        <Card className="space-y-2 text-sm">
          <h3 className="font-display text-lg font-semibold text-csp-primary">
            Documentos y consentimientos
          </h3>
          <p>
            <strong>Revisión de datos:</strong>{" "}
            {registration.consents.dataReviewAccepted ? "Aceptado" : "No aceptado"}
          </p>
          <p>
            <strong>Privacidad:</strong>{" "}
            {registration.consents.privacyAccepted ? "Aceptado" : "No aceptado"}
          </p>
          <p>
            <strong>Consentimiento de imagen universidad:</strong>{" "}
            {registration.consents.universityImageConsentAccepted
              ? "Aceptado"
              : "No aplica / no aceptado"}
          </p>
          {registration.category === "colegios" ? (
            registration.consents.schoolImageConsentFiles.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {registration.consents.schoolImageConsentFiles.map((file) => (
                  <li key={`${registration.id}-${file.fileKey}`}>
                    <span className="mr-2">{file.fileName}</span>
                    <span className="mr-2 text-csp-black/60">{formatBytes(file.fileSize)}</span>
                    <span className="mr-2 text-csp-black/60">({file.provider})</span>
                    <a
                      className="font-semibold text-csp-blue hover:underline"
                      href={file.fileUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Ver documento
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay archivos de consentimiento escolar.</p>
            )
          ) : (
            <p>La categoría universidades usa consentimiento por checkbox.</p>
          )}
        </Card>
      </div>

      <Card className="h-fit space-y-4">
        <h3 className="font-display text-lg font-semibold text-csp-primary">
          Gestión de inscripción
        </h3>
        <Select
          id="status"
          label="Estado"
          onChange={(event) => setStatus(event.target.value as RegistrationStatus)}
          options={REGISTRATION_STATUS_OPTIONS}
          value={status}
        />
        <Textarea
          id="admin-notes"
          label="Notas administrativas"
          onChange={(event) => setAdminNotes(event.target.value)}
          rows={6}
          value={adminNotes}
        />
        <Button isLoading={isSaving} onClick={handleSave} type="button">
          Guardar cambios
        </Button>
      </Card>
    </div>
  );
}
