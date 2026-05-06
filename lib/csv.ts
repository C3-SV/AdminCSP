import { RegistrationDocument } from "@/lib/types";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function formatDate(dateInput?: string): string {
  if (!dateInput) {
    return "";
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }

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
    "categoría",
    "institución",
    "responsable",
    "correo responsable",
    "estado",
    "fecha",
    "omegaup equipo",
    "miembro 1",
    "miembro 2",
    "miembro 3",
  ];

  const rows = registrations.map((registration) => [
    registration.id,
    registration.teamName,
    registration.category,
    registration.institution,
    registration.responsible?.fullName ?? "",
    registration.responsible?.email ?? "",
    registration.status,
    formatDate(registration.createdAt),
    registration.teamOmegaUpUser ?? "",
    registration.members[0]?.fullName ?? "",
    registration.members[1]?.fullName ?? "",
    registration.members[2]?.fullName ?? "",
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
