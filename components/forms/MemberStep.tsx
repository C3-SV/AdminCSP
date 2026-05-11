import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  FieldErrors,
  RegistrationCategory,
  TeamMember,
  UploadedFileMetadata,
} from "@/lib/types";

type MemberStepProps = {
  member: TeamMember;
  memberIndex: number;
  category: RegistrationCategory;
  errors: FieldErrors;
  onFieldBlur: (fieldPath: string) => void;
  onChange: (changes: Partial<TeamMember>) => void;
  onFileChange: (file: UploadedFileMetadata | null) => void;
  onUploadingChange: (uploading: boolean) => void;
};

export function MemberStep({
  member,
  memberIndex,
  category,
  errors,
  onFieldBlur,
  onChange,
  onFileChange,
  onUploadingChange,
}: MemberStepProps) {
  const prefix = `members.${memberIndex}`;

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-csp-soft p-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Miembro {memberIndex + 1}
          </h2>
          {memberIndex === 0 ? <Badge variant="default">Capitán</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-csp-black/70">
          Registra la información personal y académica del integrante.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={errors[`${prefix}.firstName`]}
          id={`member-${memberIndex}-firstName`}
          label="Nombre *"
          onChange={(event) => onChange({ firstName: event.target.value })}
          onBlur={() => onFieldBlur(`${prefix}.firstName`)}
          value={member.firstName}
        />
        <Input
          error={errors[`${prefix}.lastName`]}
          id={`member-${memberIndex}-lastName`}
          label="Apellido *"
          onChange={(event) => onChange({ lastName: event.target.value })}
          onBlur={() => onFieldBlur(`${prefix}.lastName`)}
          value={member.lastName}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={errors[`${prefix}.age`]}
          id={`member-${memberIndex}-age`}
          label="Edad *"
          onChange={(event) =>
            onChange({
              age: event.target.value ? Number(event.target.value) : "",
            })
          }
          onBlur={() => onFieldBlur(`${prefix}.age`)}
          type="number"
          value={member.age}
        />
        <Input
          error={errors[`${prefix}.email`]}
          id={`member-${memberIndex}-email`}
          label="Correo electrónico *"
          onChange={(event) => onChange({ email: event.target.value })}
          onBlur={() => onFieldBlur(`${prefix}.email`)}
          type="email"
          value={member.email}
        />
      </div>

      <Input
        id={`member-${memberIndex}-whatsapp`}
        label="WhatsApp"
        onChange={(event) => onChange({ whatsapp: event.target.value })}
        onBlur={() => onFieldBlur(`${prefix}.whatsapp`)}
        value={member.whatsapp ?? ""}
      />

      {category === "universidades" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              error={errors[`${prefix}.career`]}
              id={`member-${memberIndex}-career`}
              label="Carrera *"
              onChange={(event) => onChange({ career: event.target.value })}
              onBlur={() => onFieldBlur(`${prefix}.career`)}
              value={member.career ?? ""}
            />
            <Input
              error={errors[`${prefix}.universityYear`]}
              id={`member-${memberIndex}-universityYear`}
              label="Año de estudio *"
              onChange={(event) => onChange({ universityYear: event.target.value })}
              onBlur={() => onFieldBlur(`${prefix}.universityYear`)}
              value={member.universityYear ?? ""}
            />
          </div>
          <Input
            error={errors[`${prefix}.linkedin`]}
            id={`member-${memberIndex}-linkedin`}
            label="LinkedIn (opcional)"
            onChange={(event) => onChange({ linkedin: event.target.value })}
            onBlur={() => onFieldBlur(`${prefix}.linkedin`)}
            placeholder="https://www.linkedin.com/in/tu-perfil"
            type="url"
            value={member.linkedin ?? ""}
          />
        </div>
      ) : (
        <Input
          error={errors[`${prefix}.schoolGrade`]}
          id={`member-${memberIndex}-schoolGrade`}
          label="Grado / año escolar *"
          onChange={(event) => onChange({ schoolGrade: event.target.value })}
          onBlur={() => onFieldBlur(`${prefix}.schoolGrade`)}
          value={member.schoolGrade ?? ""}
        />
      )}

      <Textarea
        id={`member-${memberIndex}-about`}
        label="Sobre ti (opcional)"
        onChange={(event) => onChange({ about: event.target.value })}
        onBlur={() => onFieldBlur(`${prefix}.about`)}
        rows={3}
        value={member.about ?? ""}
      />

      <FileUpload
        endpoint="studentIdUploader"
        error={errors[`${prefix}.studentIdFile`]}
        label="Carné estudiantil o documento de estudiante *"
        onChange={(file) => onFileChange((file as UploadedFileMetadata) ?? null)}
        onUploadingChange={onUploadingChange}
        value={member.studentIdFile ?? null}
      />
    </div>
  );
}
