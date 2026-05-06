import { RegistrationDocument, RegistrationStatus } from "@/lib/types";

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
