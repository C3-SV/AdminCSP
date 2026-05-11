import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DISCOVERY_SOURCE_OPTIONS } from "@/lib/constants";
import { FieldErrors, RegistrationFormData } from "@/lib/types";

type TeamStepProps = {
  formData: RegistrationFormData;
  errors: FieldErrors;
  onFieldBlur: (fieldPath: string) => void;
  onChange: <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K],
  ) => void;
};

export function TeamStep({ formData, errors, onFieldBlur, onChange }: TeamStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md bg-csp-soft p-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Datos del equipo
          </h2>
          <p className="text-sm text-csp-black/70">
            Completa la información general para iniciar la inscripción.
          </p>
        </div>
        <Badge variant="accent">
          {formData.category === "colegios" ? "Colegios" : "Universidades"}
        </Badge>
      </div>

      <Input
        error={errors.teamName}
        id="teamName"
        label="Nombre del equipo *"
        onChange={(event) => onChange("teamName", event.target.value)}
        onBlur={() => onFieldBlur("teamName")}
        value={formData.teamName}
      />

      <Input
        error={errors.institution}
        id="institution"
        label={
          formData.category === "colegios"
            ? "Colegio / institución educativa *"
            : "Universidad / institución *"
        }
        onChange={(event) => onChange("institution", event.target.value)}
        onBlur={() => onFieldBlur("institution")}
        value={formData.institution}
      />

      <Select
        error={errors.discoverySource}
        id="discoverySource"
        label="¿Cómo conocieron la Copa? *"
        onChange={(event) =>
          onChange("discoverySource", event.target.value as RegistrationFormData["discoverySource"])
        }
        onBlur={() => onFieldBlur("discoverySource")}
        options={DISCOVERY_SOURCE_OPTIONS}
        placeholder="Selecciona una opción"
        value={formData.discoverySource}
      />

      {formData.discoverySource === "otro" ? (
        <Input
          error={errors.discoverySourceOther}
          id="discoverySourceOther"
          label="Especifica la fuente *"
          onChange={(event) => onChange("discoverySourceOther", event.target.value)}
          onBlur={() => onFieldBlur("discoverySourceOther")}
          value={formData.discoverySourceOther ?? ""}
        />
      ) : null}

      <Textarea
        error={errors.teamDescription}
        id="teamDescription"
        label="Descripción breve del equipo *"
        onChange={(event) => onChange("teamDescription", event.target.value)}
        onBlur={() => onFieldBlur("teamDescription")}
        rows={4}
        value={formData.teamDescription}
      />

      <div className="rounded-md border border-csp-primary/20 bg-csp-soft p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-csp-primary">Usuario de OmegaUp</p>
          <Badge variant="default">Obligatorio para competir</Badge>
        </div>
        <Input
          error={errors.teamOmegaUpUser}
          id="teamOmegaUpUser"
          label="Usuario de OmegaUp del equipo *"
          onChange={(event) => onChange("teamOmegaUpUser", event.target.value)}
          onBlur={() => onFieldBlur("teamOmegaUpUser")}
          value={formData.teamOmegaUpUser}
        />
        <p className="mt-1 text-xs text-csp-black/70">
          Usaremos este usuario para registrar y validar la participación del equipo en la
          plataforma de competencia.
        </p>
      </div>

      <Input
        error={errors.contactEmail}
        id="contactEmail"
        label="Correo principal (opcional)"
        onChange={(event) => onChange("contactEmail", event.target.value)}
        onBlur={() => onFieldBlur("contactEmail")}
        type="email"
        value={formData.contactEmail ?? ""}
      />
    </div>
  );
}
