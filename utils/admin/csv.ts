import { RegistrationDocument } from "@/types/admin/registration";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function formatDate(dateInput?: string): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return dateInput;
  return new Intl.DateTimeFormat("es-SV", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function exportRegistrationsToCSV(registrations: RegistrationDocument[]) {
  const headers = [
    "id",
    "equipo",
    "categoria",
    "institucion",
    "responsable_nombre",
    "responsable_apellido",
    "correo_responsable",
    "estado",
    "fecha",
    "omegaup_equipo",
    "miembro_1_nombre",
    "miembro_1_apellido",
    "miembro_1_linkedin",
    "miembro_2_nombre",
    "miembro_2_apellido",
    "miembro_2_linkedin",
    "miembro_3_nombre",
    "miembro_3_apellido",
    "miembro_3_linkedin",
    "carnet_miembro_1_url",
    "carnet_miembro_2_url",
    "carnet_miembro_3_url",
    "consentimientos_urls",
  ];

  const rows = registrations.map((registration) => [
    registration.id,
    registration.teamName,
    registration.category,
    registration.institution,
    registration.category === "colegios" ? registration.responsible.firstName : "",
    registration.category === "colegios" ? registration.responsible.lastName : "",
    registration.category === "colegios" ? registration.responsible.email : "",
    registration.status,
    formatDate(registration.createdAt),
    registration.teamOmegaUpUser ?? "",
    registration.members[0]?.firstName ?? "",
    registration.members[0]?.lastName ?? "",
    registration.category === "universidades" ? registration.members[0]?.linkedin ?? "" : "",
    registration.members[1]?.firstName ?? "",
    registration.members[1]?.lastName ?? "",
    registration.category === "universidades" ? registration.members[1]?.linkedin ?? "" : "",
    registration.members[2]?.firstName ?? "",
    registration.members[2]?.lastName ?? "",
    registration.category === "universidades" ? registration.members[2]?.linkedin ?? "" : "",
    registration.members[0]?.studentIdFile?.fileUrl ?? "",
    registration.members[1]?.studentIdFile?.fileUrl ?? "",
    registration.members[2]?.studentIdFile?.fileUrl ?? "",
    (registration.consents.schoolImageConsentFiles ?? [])
      .map((file) => file.fileUrl)
      .join(" | "),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeCSV(String(value))).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inscripciones-csp-2026.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
