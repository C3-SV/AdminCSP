import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/ui/FileUpload";
import { FieldErrors, RegistrationFormData, UploadedFileMetadata } from "@/lib/types";

type ConfirmationStepProps = {
  formData: RegistrationFormData;
  errors: FieldErrors;
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
  onToggle,
  onSchoolConsentFilesChange,
  onUploadingChange,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-csp-primary">
          Informacion del equipo
        </h2>
        <p className="text-sm">
          <strong>Nombre:</strong> {orDash(formData.teamName)}
        </p>
        <p className="text-sm">
          <strong>Categoria:</strong> {formData.category}
        </p>
        <p className="text-sm">
          <strong>Institucion:</strong> {orDash(formData.institution)}
        </p>
        <p className="text-sm">
          <strong>Fuente:</strong> {orDash(formData.discoverySource)}
        </p>
        <p className="text-sm">
          <strong>Descripcion:</strong> {orDash(formData.teamDescription)}
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
                Miembro {index + 1}: {orDash(member.fullName)}
              </p>
              {index === 0 ? <Badge>Capitan</Badge> : null}
            </div>
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
              <strong>{formData.category === "universidades" ? "Carrera/Anio" : "Grado escolar"}:</strong>{" "}
              {formData.category === "universidades"
                ? `${orDash(member.career)} / ${orDash(member.universityYear)}`
                : orDash(member.schoolGrade)}
            </p>
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
            <strong>Nombre:</strong> {orDash(formData.responsible.fullName)}
          </p>
          <p className="text-sm">
            <strong>Correo:</strong> {orDash(formData.responsible.email)}
          </p>
          <p className="text-sm">
            <strong>Telefono:</strong> {orDash(formData.responsible.phone)}
          </p>
          <p className="text-sm">
            <strong>Institucion:</strong> {orDash(formData.responsible.institution)}
          </p>
          <p className="text-sm">
            <strong>Rol:</strong> {orDash(formData.responsible.role)}
          </p>
          <p className="text-sm">
            <strong>Relacion:</strong> {orDash(formData.responsible.relationship)}
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
            type="checkbox"
          />
          <span>
            He revisado que la informacion ingresada es correcta y confirmo que todos los
            integrantes cumplen con las bases de la competencia.
          </span>
        </label>
        {errors.dataReviewAccepted ? <p className="form-error">{errors.dataReviewAccepted}</p> : null}

        <label className="flex items-start gap-2 text-sm">
          <input
            checked={formData.privacyAccepted}
            className="mt-1"
            onChange={(event) => onToggle("privacyAccepted", event.target.checked)}
            type="checkbox"
          />
          <span>
            Acepto el tratamiento de los datos personales para fines relacionados con la
            Copa Salvadorena de Programacion 2026.
          </span>
        </label>
        {errors.privacyAccepted ? <p className="form-error">{errors.privacyAccepted}</p> : null}

        {formData.category === "universidades" ? (
          <>
            <label className="flex items-start gap-2 text-sm">
              <input
                checked={Boolean(formData.universityImageConsentAccepted)}
                className="mt-1"
                onChange={(event) =>
                  onToggle("universityImageConsentAccepted", event.target.checked)
                }
                type="checkbox"
              />
              <span>
                Acepto el uso de imagen, nombre de equipo y afiliacion institucional en
                fotografias, transmisiones y material oficial de la Copa Salvadorena de
                Programacion 2026.
              </span>
            </label>
            {errors.universityImageConsentAccepted ? (
              <p className="form-error">{errors.universityImageConsentAccepted}</p>
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
