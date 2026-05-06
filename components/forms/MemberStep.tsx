import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TEMP_DISABLE_FILE_UPLOADS } from "@/lib/constants";
import { FieldErrors, RegistrationCategory, TeamMember } from "@/lib/types";

type MemberStepProps = {
  member: TeamMember;
  memberIndex: number;
  category: RegistrationCategory;
  errors: FieldErrors;
  onChange: (changes: Partial<TeamMember>) => void;
  onFileChange: (file: File | null) => void;
};

export function MemberStep({
  member,
  memberIndex,
  category,
  errors,
  onChange,
  onFileChange,
}: MemberStepProps) {
  const prefix = `members.${memberIndex}`;

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-csp-soft p-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Miembro {memberIndex + 1}
          </h2>
          {memberIndex === 0 ? <Badge variant="default">Capitan</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-csp-black/70">
          Registra la informacion personal y academica del integrante.
        </p>
      </div>

      <Input
        error={errors[`${prefix}.fullName`]}
        id={`member-${memberIndex}-fullName`}
        label="Nombre completo *"
        onChange={(event) => onChange({ fullName: event.target.value })}
        value={member.fullName}
      />

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
          type="number"
          value={member.age}
        />
        <Input
          error={errors[`${prefix}.email`]}
          id={`member-${memberIndex}-email`}
          label="Correo electronico *"
          onChange={(event) => onChange({ email: event.target.value })}
          type="email"
          value={member.email}
        />
      </div>

      <Input
        id={`member-${memberIndex}-whatsapp`}
        label="WhatsApp"
        onChange={(event) => onChange({ whatsapp: event.target.value })}
        value={member.whatsapp ?? ""}
      />

      {category === "universidades" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            error={errors[`${prefix}.career`]}
            id={`member-${memberIndex}-career`}
            label="Carrera *"
            onChange={(event) => onChange({ career: event.target.value })}
            value={member.career ?? ""}
          />
          <Input
            error={errors[`${prefix}.universityYear`]}
            id={`member-${memberIndex}-universityYear`}
            label="Anio de estudio *"
            onChange={(event) => onChange({ universityYear: event.target.value })}
            value={member.universityYear ?? ""}
          />
        </div>
      ) : (
        <Input
          error={errors[`${prefix}.schoolGrade`]}
          id={`member-${memberIndex}-schoolGrade`}
          label="Grado / anio escolar *"
          onChange={(event) => onChange({ schoolGrade: event.target.value })}
          value={member.schoolGrade ?? ""}
        />
      )}

      <Textarea
        id={`member-${memberIndex}-about`}
        label="Sobre ti (opcional)"
        onChange={(event) => onChange({ about: event.target.value })}
        rows={3}
        value={member.about ?? ""}
      />

      <FileUpload
        error={errors[`${prefix}.studentIdFile`]}
        fileNames={member.studentIdFileName ? [member.studentIdFileName] : []}
        files={member.studentIdFile ? [member.studentIdFile] : []}
        id={`member-${memberIndex}-studentIdFile`}
        label={
          TEMP_DISABLE_FILE_UPLOADS
            ? "Carne estudiantil o documento de estudiante (temporalmente opcional)"
            : "Carne estudiantil o documento de estudiante *"
        }
        onChange={(files) => onFileChange(files[0] ?? null)}
      />
    </div>
  );
}
