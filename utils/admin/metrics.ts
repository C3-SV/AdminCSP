import { LABORATORY_OPTIONS, REGISTRATION_CATEGORY_LABELS } from "@/constants/admin";
import { RegistrationDocument, RegistrationStatus, KnownRegistrationCategory, LaboratoryAssignment } from "@/types/admin/registration";

export type LaboratoryDistributionEntry = {
  value: LaboratoryAssignment;
  label: string;
  total: number;
  teams: string[];
};

export function getLaboratoryDistribution(
  registrations: RegistrationDocument[],
  categories: KnownRegistrationCategory[],
  options: { includeCategoryLabel?: boolean } = {},
): LaboratoryDistributionEntry[] {
  const classified = registrations.filter(
    (registration) => categories.includes(registration.category as KnownRegistrationCategory) && registration.estadoCompetitivo === "clasificado",
  );

  return LABORATORY_OPTIONS.map(({ value, label }) => {
    const teams = classified
      .filter((registration) => registration.laboratorioAsignado === value)
      .map((registration) => {
        const teamName = registration.teamName.trim() || "Equipo sin nombre";
        return options.includeCategoryLabel
          ? `${REGISTRATION_CATEGORY_LABELS[registration.category as KnownRegistrationCategory]} · ${teamName}`
          : teamName;
      });
    return { value, label, total: teams.length, teams };
  });
}

export function countByStatus(
  registrations: RegistrationDocument[],
  status: RegistrationStatus,
) {
  return registrations.filter((item) => item.status === status).length;
}

export function countParticipants(registrations: RegistrationDocument[]) {
  return registrations.reduce((total, current) => total + current.members.length, 0);
}

export function uniqueInstitutions(registrations: RegistrationDocument[]) {
  const map = new Map<string, number>();

  registrations.forEach((registration) => {
    map.set(
      registration.institution,
      (map.get(registration.institution) ?? 0) + 1,
    );
  });

  return Array.from(map.entries())
    .map(([institution, total]) => ({ institution, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}
