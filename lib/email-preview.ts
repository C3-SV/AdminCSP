import { EVENT_NAME } from "@/lib/constants";
import { RegistrationFormData } from "@/lib/types";
import { formatPersonName } from "@/lib/utils";

export function buildRegistrationEmailPayload(
  formData: RegistrationFormData,
  registrationId: string,
) {
  const memberNames = formData.members.map((member) =>
    formatPersonName(member.firstName, member.lastName),
  );
  const omegaUpUsers = [formData.teamOmegaUpUser.trim()].filter(Boolean);
  const documentsSummary = {
    studentIds: formData.members.map((member) => ({
      memberId: member.id,
      fileName: member.studentIdFile?.fileName ?? "",
      fileUrl: member.studentIdFile?.fileUrl ?? "",
      provider: member.studentIdFile?.provider ?? "uploadthing",
    })),
    imageConsents:
      formData.category === "colegios"
        ? (formData.schoolImageConsentFiles ?? []).map((file) => ({
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            provider: file.provider,
          }))
        : [],
  };

  return {
    to: [
      formData.contactEmail,
      formData.category === "colegios" ? formData.responsible.email : undefined,
      ...formData.members.map((member) => member.email),
    ].filter(Boolean),
    subject: `${EVENT_NAME} - Inscripcion recibida (${formData.teamName})`,
    registrationId,
    teamName: formData.teamName,
    category: formData.category,
    institution: formData.institution,
    members: memberNames,
    omegaUpUsers,
    responsible:
      formData.category === "colegios"
        ? {
            firstName: formData.responsible.firstName,
            lastName: formData.responsible.lastName,
            email: formData.responsible.email,
            phone: formData.responsible.phone,
            role: formData.responsible.role,
          }
        : null,
    status: "recibida",
    documentsSummary,
    nextSteps:
      "Tu inscripcion fue recibida. El comite de la Copa revisara documentos y contactara al responsable con los siguientes pasos.",
  };
}
