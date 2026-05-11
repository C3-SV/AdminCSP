import { SCHOOL_RESPONSIBLE_ROLES } from "@/lib/constants";
import { FieldErrors, Responsible } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type ResponsibleStepProps = {
  responsible: Responsible;
  errors: FieldErrors;
  onFieldBlur: (fieldPath: string) => void;
  onChange: (changes: Partial<Responsible>) => void;
};

export function ResponsibleStep({
  responsible,
  errors,
  onFieldBlur,
  onChange,
}: ResponsibleStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-csp-soft p-3">
        <h2 className="font-display text-lg font-semibold text-csp-primary">
          Responsable institucional
        </h2>
        <p className="mt-1 text-sm text-csp-black/70">
          Registra a la persona adulta o institucional que acompañará la inscripción del equipo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={errors["responsible.firstName"]}
          id="responsible-firstName"
          label="Nombre *"
          onChange={(event) => onChange({ firstName: event.target.value })}
          onBlur={() => onFieldBlur("responsible.firstName")}
          value={responsible.firstName}
        />
        <Input
          error={errors["responsible.lastName"]}
          id="responsible-lastName"
          label="Apellido *"
          onChange={(event) => onChange({ lastName: event.target.value })}
          onBlur={() => onFieldBlur("responsible.lastName")}
          value={responsible.lastName}
        />
      </div>
      <Input
        error={errors["responsible.email"]}
        id="responsible-email"
        label="Correo electrónico *"
        onChange={(event) => onChange({ email: event.target.value })}
        onBlur={() => onFieldBlur("responsible.email")}
        type="email"
        value={responsible.email}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          error={errors["responsible.phone"]}
          id="responsible-phone"
          label="Número de teléfono / WhatsApp *"
          onChange={(event) => onChange({ phone: event.target.value })}
          onBlur={() => onFieldBlur("responsible.phone")}
          value={responsible.phone}
        />
        <Input
          error={errors["responsible.institution"]}
          id="responsible-institution"
          label="Institución *"
          onChange={(event) => onChange({ institution: event.target.value })}
          onBlur={() => onFieldBlur("responsible.institution")}
          value={responsible.institution}
        />
      </div>

      <Select
        error={errors["responsible.role"]}
        id="responsible-role"
        label="Rol *"
        onChange={(event) => onChange({ role: event.target.value as Responsible["role"] })}
        onBlur={() => onFieldBlur("responsible.role")}
        options={SCHOOL_RESPONSIBLE_ROLES}
        placeholder="Selecciona un rol"
        value={responsible.role}
      />

      <Input
        error={errors["responsible.relationship"]}
        id="responsible-relationship"
        label="Relación con el equipo *"
        onChange={(event) => onChange({ relationship: event.target.value })}
        onBlur={() => onFieldBlur("responsible.relationship")}
        value={responsible.relationship}
      />

      <Textarea
        id="responsible-comments"
        label="Comentarios adicionales (opcional)"
        onChange={(event) => onChange({ comments: event.target.value })}
        onBlur={() => onFieldBlur("responsible.comments")}
        rows={3}
        value={responsible.comments ?? ""}
      />
    </div>
  );
}
