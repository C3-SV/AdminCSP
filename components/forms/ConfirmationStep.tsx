import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/ui/FileUpload";
import { FieldErrors, RegistrationFormData, UploadedFileMetadata } from "@/lib/types";
import { formatPersonName } from "@/lib/utils";

type ConfirmationStepProps = {
  formData: RegistrationFormData;
  errors: FieldErrors;
  onFieldBlur: (fieldPath: string) => void;
  onToggle: (
    field:
      | "dataReviewAccepted"
      | "privacyAccepted"
      | "universityImageConsentAccepted",
    value: boolean,
  ) => void;
  onSchoolConsentFilesChange: (files: UploadedFileMetadata[]) => void;
  onUploadingChange: (uploading: boolean) => void;
};

function orDash(value?: string) {
  return value?.trim() ? value : "-";
}

export function ConfirmationStep({
  formData,
  errors,
  onFieldBlur,
  onToggle,
  onSchoolConsentFilesChange,
  onUploadingChange,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-csp-primary">
          Información del equipo
        </h2>
        <p className="text-sm">
          <strong>Nombre:</strong> {orDash(formData.teamName)}
        </p>
        <p className="text-sm">
          <strong>Categoría:</strong> {formData.category}
        </p>
        <p className="text-sm">
          <strong>Institución:</strong> {orDash(formData.institution)}
        </p>
        <p className="text-sm">
          <strong>Fuente:</strong> {orDash(formData.discoverySource)}
        </p>
        <p className="text-sm">
          <strong>Descripción:</strong> {orDash(formData.teamDescription)}
        </p>
        <p className="text-sm">
          <strong>Usuario de OmegaUp:</strong> {orDash(formData.teamOmegaUpUser)}
        </p>
        <p className="text-sm">
          <strong>Correo principal:</strong> {orDash(formData.contactEmail)}
        </p>
        <p className="text-sm">
          <strong>Estado inicial:</strong> <Badge variant="success">Recibida</Badge>
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-display text-lg font-semibold text-csp-primary">
          Integrantes
        </h3>
        {formData.members.map((member, index) => (
          <div key={member.id} className="rounded-md border border-csp-soft p-3 text-sm">
            <div className="mb-1 flex items-center gap-2">
              <p className="font-medium text-csp-primary">
                Miembro {index + 1}: {orDash(formatPersonName(member.firstName, member.lastName))}
              </p>
              {index === 0 ? <Badge>Capitán</Badge> : null}
            </div>
            <p>
              <strong>Nombre:</strong>{" "}
              {orDash(formatPersonName(member.firstName, member.lastName))}
            </p>
            <p>
              <strong>Correo:</strong> {orDash(member.email)}
            </p>
            <p>
              <strong>Edad:</strong> {member.age || "-"}
            </p>
            <p>
              <strong>WhatsApp:</strong> {orDash(member.whatsapp)}
            </p>
            <p>
              <strong>{formData.category === "universidades" ? "Carrera/Año" : "Grado escolar"}:</strong>{" "}
              {formData.category === "universidades"
                ? `${orDash(member.career)} / ${orDash(member.universityYear)}`
                : orDash(member.schoolGrade)}
            </p>
            {formData.category === "universidades" ? (
              <p>
                <strong>LinkedIn:</strong> {orDash(member.linkedin)}
              </p>
            ) : null}
            <p>
              <strong>Documento:</strong> {member.studentIdFile?.fileName ?? "No adjunto"}
            </p>
          </div>
        ))}
      </Card>

      {formData.category === "colegios" ? (
        <Card className="space-y-2">
          <h3 className="font-display text-lg font-semibold text-csp-primary">Responsable</h3>
          <p className="text-sm">
            <strong>Nombre:</strong>{" "}
            {orDash(
              formatPersonName(
                formData.responsible.firstName,
                formData.responsible.lastName,
              ),
            )}
          </p>
          <p className="text-sm">
            <strong>Correo:</strong> {orDash(formData.responsible.email)}
          </p>
          <p className="text-sm">
            <strong>Teléfono:</strong> {orDash(formData.responsible.phone)}
          </p>
          <p className="text-sm">
            <strong>Institución:</strong> {orDash(formData.responsible.institution)}
          </p>
          <p className="text-sm">
            <strong>Rol:</strong> {orDash(formData.responsible.role)}
          </p>
          <p className="text-sm">
            <strong>Relación:</strong> {orDash(formData.responsible.relationship)}
          </p>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-csp-primary">
          Confirmaciones y consentimientos
        </h3>

        <label className="flex items-start gap-2 text-sm">
          <input
            checked={formData.dataReviewAccepted}
            className="mt-1"
            onChange={(event) => onToggle("dataReviewAccepted", event.target.checked)}
            onBlur={() => onFieldBlur("dataReviewAccepted")}
            type="checkbox"
          />
          <span>
            He revisado que la información ingresada es correcta y confirmo que todos los
            integrantes cumplen con las bases de la competencia.
          </span>
        </label>
        {errors.dataReviewAccepted ? (
          <p className="form-error flex items-start gap-1">
            <span aria-hidden="true" className="font-semibold">!</span>
            <span>{errors.dataReviewAccepted}</span>
          </p>
        ) : null}

        <label className="flex items-start gap-2 text-sm">
          <input
            checked={formData.privacyAccepted}
            className="mt-1"
            onChange={(event) => onToggle("privacyAccepted", event.target.checked)}
            onBlur={() => onFieldBlur("privacyAccepted")}
            type="checkbox"
          />
          <span>
            Acepto el tratamiento de los datos personales para fines relacionados con la
            Copa Salvadoreña de Programación 2026.
          </span>
        </label>
        {errors.privacyAccepted ? (
          <p className="form-error flex items-start gap-1">
            <span aria-hidden="true" className="font-semibold">!</span>
            <span>{errors.privacyAccepted}</span>
          </p>
        ) : null}

        {formData.category === "universidades" ? (
          <>
            <label className="flex items-start gap-2 text-sm">
              <input
                checked={Boolean(formData.universityImageConsentAccepted)}
                className="mt-1"
                onChange={(event) =>
                  onToggle("universityImageConsentAccepted", event.target.checked)
                }
                onBlur={() => onFieldBlur("universityImageConsentAccepted")}
                type="checkbox"
              />
              <span>
                Acepto el uso de imagen, nombre de equipo y afiliación institucional en
                fotografías, transmisiones y material oficial de la Copa Salvadoreña de
                Programación 2026.
              </span>
            </label>
            {errors.universityImageConsentAccepted ? (
              <p className="form-error flex items-start gap-1">
                <span aria-hidden="true" className="font-semibold">!</span>
                <span>{errors.universityImageConsentAccepted}</span>
              </p>
            ) : null}
          </>
        ) : (
          <FileUpload
            description="Adjunta los consentimientos de uso de imagen firmados por los responsables correspondientes de cada estudiante."
            endpoint="consentUploader"
            error={errors.schoolImageConsentFiles}
            label="Consentimientos de uso de imagen *"
            multiple
            onChange={(files) => onSchoolConsentFilesChange((files as UploadedFileMetadata[]) ?? [])}
            onUploadingChange={onUploadingChange}
            value={formData.schoolImageConsentFiles ?? []}
          />
        )}
      </Card>
    </div>
  );
}
