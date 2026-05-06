import { EVENT_NAME } from "@/lib/constants";
import { RegistrationFormData } from "@/lib/types";

export function buildRegistrationEmailPayload(
  formData: RegistrationFormData,
  registrationId: string,
) {
  const memberNames = formData.members.map((member) => member.fullName.trim());

  return {
    to: [
      formData.contactEmail,
      formData.responsible?.email,
      ...formData.members.map((member) => member.email),
    ].filter(Boolean),
    subject: `${EVENT_NAME} - Inscripción recibida (${formData.teamName})`,
    registrationId,
    teamName: formData.teamName,
    category: formData.category,
    institution: formData.institution,
    members: memberNames,
    omegaUpUser: formData.teamOmegaUpUser,
    responsible: formData.responsible
      ? {
          fullName: formData.responsible.fullName,
          email: formData.responsible.email,
          phone: formData.responsible.phone,
          role: formData.responsible.role,
        }
      : null,
    status: "recibida",
    nextSteps:
      "Tu inscripción fue recibida. El comité de la Copa revisará documentos y contactará al responsable con los siguientes pasos.",
  };
}
