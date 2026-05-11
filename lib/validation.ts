import { FieldErrors, RegistrationFormData, TeamMember } from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationStepKey =
  | "team"
  | "member-1"
  | "member-2"
  | "member-3"
  | "responsible"
  | "confirmation";

export function getStepKeysByCategory(
  category: RegistrationFormData["category"],
): RegistrationStepKey[] {
  if (category === "universidades") {
    return ["team", "member-1", "member-2", "member-3", "confirmation"];
  }
  return ["team", "member-1", "member-2", "member-3", "responsible", "confirmation"];
}

export function validateEmail(value?: string): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim());
}

export function validateLinkedInUrl(value?: string): boolean {
  if (!value?.trim()) return true;

  try {
    const parsed = new URL(value.trim());
    return ["www.linkedin.com", "linkedin.com", "lnkd.in"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateAge(value: number | ""): boolean {
  if (value === "") return false;
  return Number.isInteger(value) && value >= 10 && value <= 99;
}

function validateMemberCore(
  member: TeamMember,
  memberIndex: number,
  category: RegistrationFormData["category"],
): FieldErrors {
  const errors: FieldErrors = {};
  const prefix = `members.${memberIndex}`;

  if (!member.firstName.trim()) {
    errors[`${prefix}.firstName`] = "Ingresa el nombre del participante.";
  }
  if (!member.lastName.trim()) {
    errors[`${prefix}.lastName`] = "Ingresa el apellido del participante.";
  }
  if (!validateAge(member.age)) {
    errors[`${prefix}.age`] = "Ingresa una edad válida.";
  }
  if (!member.email.trim()) {
    errors[`${prefix}.email`] = "Ingresa un correo electrónico.";
  } else if (!validateEmail(member.email)) {
    errors[`${prefix}.email`] = "Ingresa un correo electrónico válido.";
  }

  if (category === "universidades") {
    if (!member.career?.trim()) errors[`${prefix}.career`] = "Ingresa la carrera del participante.";
    if (!member.universityYear?.trim()) {
      errors[`${prefix}.universityYear`] = "Ingresa el año de estudio.";
    }
    if (!validateLinkedInUrl(member.linkedin)) {
      errors[`${prefix}.linkedin`] = "Ingresa un enlace válido de LinkedIn.";
    }
  }

  if (category === "colegios" && !member.schoolGrade?.trim()) {
    errors[`${prefix}.schoolGrade`] = "Ingresa el grado o año escolar.";
  }

  if (!member.studentIdFile?.fileUrl) {
    errors[`${prefix}.studentIdFile`] = "Sube el documento del participante.";
  }

  return errors;
}

export function validateTeamStep(formData: RegistrationFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.teamName.trim()) errors.teamName = "Ingresa el nombre del equipo.";
  if (!formData.institution.trim()) {
    errors.institution = "Ingresa el nombre de la institución.";
  }
  if (!formData.discoverySource) errors.discoverySource = "Selecciona cómo conocieron la Copa.";

  if (formData.discoverySource === "otro" && !formData.discoverySourceOther?.trim()) {
    errors.discoverySourceOther = "Especifica cómo conocieron la Copa.";
  }
  if (!formData.teamDescription.trim()) {
    errors.teamDescription = "Ingresa una descripción breve del equipo.";
  }
  if (!formData.teamOmegaUpUser.trim()) {
    errors.teamOmegaUpUser = "Ingresa el usuario de OmegaUp del equipo.";
  }
  if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
    errors.contactEmail = "Ingresa un correo electrónico válido.";
  }

  return errors;
}

export function validateMemberStep(
  formData: RegistrationFormData,
  memberIndex: number,
): FieldErrors {
  return validateMemberCore(formData.members[memberIndex], memberIndex, formData.category);
}

export function validateResponsibleStep(formData: RegistrationFormData): FieldErrors {
  if (formData.category === "universidades") {
    return {};
  }

  const errors: FieldErrors = {};
  const responsible = formData.responsible;

  if (!responsible.firstName.trim()) {
    errors["responsible.firstName"] = "Ingresa el nombre del responsable.";
  }
  if (!responsible.lastName.trim()) {
    errors["responsible.lastName"] = "Ingresa el apellido del responsable.";
  }
  if (!responsible.email.trim()) {
    errors["responsible.email"] = "Ingresa un correo electrónico.";
  } else if (!validateEmail(responsible.email)) {
    errors["responsible.email"] = "Ingresa un correo electrónico válido.";
  }
  if (!responsible.phone.trim()) {
    errors["responsible.phone"] = "Ingresa un número de teléfono o WhatsApp.";
  }
  if (!responsible.institution.trim()) {
    errors["responsible.institution"] = "Ingresa el nombre de la institución.";
  }
  if (!responsible.role) errors["responsible.role"] = "Selecciona el rol del responsable.";
  if (!responsible.relationship.trim()) {
    errors["responsible.relationship"] = "Ingresa la relación con el equipo.";
  }

  return errors;
}

export function validateConfirmationStep(formData: RegistrationFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!formData.dataReviewAccepted) {
    errors.dataReviewAccepted = "Debes confirmar que revisaste la información.";
  }
  if (!formData.privacyAccepted) {
    errors.privacyAccepted = "Debes aceptar el tratamiento de datos personales.";
  }
  if (formData.category === "universidades" && !formData.universityImageConsentAccepted) {
    errors.universityImageConsentAccepted = "Debes aceptar el uso de imagen.";
  }

  if (formData.category === "colegios") {
    const files = formData.schoolImageConsentFiles ?? [];
    if (!files.length) {
      errors.schoolImageConsentFiles = "Debes subir al menos un consentimiento de imagen.";
    }
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
