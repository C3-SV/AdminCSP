import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  TEMP_DISABLE_FILE_UPLOADS,
} from "@/lib/constants";
import {
  FieldErrors,
  RegistrationCategory,
  RegistrationFormData,
  TeamMember,
} from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationStepKey =
  | "team"
  | "member-1"
  | "member-2"
  | "member-3"
  | "responsible"
  | "confirmation";

export function getStepKeysByCategory(
  category: RegistrationCategory,
): RegistrationStepKey[] {
  return category === "colegios"
    ? ["team", "member-1", "member-2", "member-3", "responsible", "confirmation"]
    : ["team", "member-1", "member-2", "member-3", "confirmation"];
}

export function validateEmail(value?: string): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim());
}

export function validateAge(value: number | ""): boolean {
  if (value === "") return false;
  return Number.isInteger(value) && value >= 10 && value <= 99;
}

export function validateFile(file?: File | null): string | undefined {
  if (TEMP_DISABLE_FILE_UPLOADS) return undefined;
  if (!file) return "Debes adjuntar un archivo.";
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return "Tipo de archivo no permitido. Usa PDF, PNG o JPG.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) return "El archivo supera el maximo de 5MB.";
  return undefined;
}

function validateMemberCore(
  member: TeamMember,
  memberIndex: number,
  category: RegistrationCategory,
): FieldErrors {
  const errors: FieldErrors = {};
  const prefix = `members.${memberIndex}`;

  if (!member.fullName.trim()) {
    errors[`${prefix}.fullName`] = "El nombre completo es obligatorio.";
  }
  if (!validateAge(member.age)) {
    errors[`${prefix}.age`] = "Ingresa una edad valida.";
  }
  if (!validateEmail(member.email)) {
    errors[`${prefix}.email`] = "Ingresa un correo valido.";
  }

  if (category === "universidades") {
    if (!member.career?.trim()) errors[`${prefix}.career`] = "La carrera es obligatoria.";
    if (!member.universityYear?.trim()) {
      errors[`${prefix}.universityYear`] = "El anio de estudio es obligatorio.";
    }
  }

  if (category === "colegios" && !member.schoolGrade?.trim()) {
    errors[`${prefix}.schoolGrade`] = "El grado/anio escolar es obligatorio.";
  }

  const fileError = validateFile(member.studentIdFile);
  if (fileError) errors[`${prefix}.studentIdFile`] = fileError;

  return errors;
}

export function validateTeamStep(formData: RegistrationFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.teamName.trim()) errors.teamName = "El nombre del equipo es obligatorio.";
  if (!formData.teamOmegaUpUser.trim()) {
    errors.teamOmegaUpUser = "El usuario de OmegaUp del equipo es obligatorio.";
  }
  if (!formData.institution.trim()) errors.institution = "La institucion es obligatoria.";
  if (!formData.discoverySource) errors.discoverySource = "Selecciona una fuente.";

  if (formData.discoverySource === "otro" && !formData.discoverySourceOther?.trim()) {
    errors.discoverySourceOther = "Especifica como conocieron la Copa.";
  }
  if (!formData.teamDescription.trim()) {
    errors.teamDescription = "La descripcion del equipo es obligatoria.";
  }
  if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
    errors.contactEmail = "Ingresa un correo principal valido.";
  }

  return errors;
}

export function validateMemberStep(
  formData: RegistrationFormData,
  memberIndex: number,
): FieldErrors {
  return validateMemberCore(formData.members[memberIndex], memberIndex, formData.category);
}

export function validateResponsibleStep(
  formData: RegistrationFormData,
): FieldErrors {
  if (formData.category === "universidades") return {};

  const errors: FieldErrors = {};
  const responsible = formData.responsible;

  if (!responsible?.fullName?.trim()) {
    errors["responsible.fullName"] = "El nombre es obligatorio.";
  }
  if (!validateEmail(responsible?.email)) {
    errors["responsible.email"] = "Ingresa un correo valido.";
  }
  if (!responsible?.phone?.trim()) {
    errors["responsible.phone"] = "El telefono/WhatsApp es obligatorio.";
  }
  if (!responsible?.institution?.trim()) {
    errors["responsible.institution"] = "La institucion es obligatoria.";
  }
  if (!responsible?.role) errors["responsible.role"] = "Selecciona un rol.";
  if (!responsible?.relationship?.trim()) {
    errors["responsible.relationship"] = "La relacion con el equipo es obligatoria.";
  }

  return errors;
}

export function validateConfirmationStep(
  formData: RegistrationFormData,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.dataReviewAccepted) {
    errors.dataReviewAccepted = "Debes confirmar que revisaste la informacion.";
  }
  if (!formData.privacyAccepted) {
    errors.privacyAccepted = "Debes aceptar el tratamiento de datos personales.";
  }
  if (
    formData.category === "universidades" &&
    !formData.universityImageConsentAccepted
  ) {
    errors.universityImageConsentAccepted =
      "Debes aceptar el uso de imagen para universidades.";
  }

  if (formData.category === "colegios") {
    const files = formData.schoolImageConsentFiles ?? [];
    if (!TEMP_DISABLE_FILE_UPLOADS && files.length !== 3) {
      errors.schoolImageConsentFiles =
        "Debes adjuntar exactamente 3 consentimientos de uso de imagen.";
    }
    files.forEach((file, index) => {
      const fileError = validateFile(file);
      if (fileError) errors[`schoolImageConsentFiles.${index}`] = fileError;
    });
  }

  return errors;
}

export function validateStepByKey(
  formData: RegistrationFormData,
  stepKey: RegistrationStepKey,
): FieldErrors {
  switch (stepKey) {
    case "team":
      return validateTeamStep(formData);
    case "member-1":
      return validateMemberStep(formData, 0);
    case "member-2":
      return validateMemberStep(formData, 1);
    case "member-3":
      return validateMemberStep(formData, 2);
    case "responsible":
      return validateResponsibleStep(formData);
    case "confirmation":
      return validateConfirmationStep(formData);
    default:
      return {};
  }
}

export function validateAllSteps(formData: RegistrationFormData): FieldErrors {
  const errors: FieldErrors = {};
  const steps = getStepKeysByCategory(formData.category);
  steps.forEach((stepKey) => {
    Object.assign(errors, validateStepByKey(formData, stepKey));
  });
  return errors;
}
