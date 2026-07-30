import Link from "next/link";
import { REGISTRATION_CATEGORY_LABELS } from "@/constants/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminPath } from "@/lib/admin/routes";
import { getInstitutionDisplay, getResponsibleOrContactDisplay } from "@/lib/admin/registrationPresentation";
import type { RegistrationDocument } from "@/types/admin/registration";
import { formatDate } from "@/utils/admin";

const statusLabelMap: Record<RegistrationDocument["status"], string> = {
  recibida: "Recibida",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pendiente_correccion: "Pendiente de corrección",
};

function virtualEmailLabel(registration: RegistrationDocument) {
  const state = registration.emailStatus.virtualInstructions;
  if (state.status === "sent") return `Enviado · ${formatDate(state.lastSentAt)}`;
  if (state.status === "failed") return "Falló";
  if (state.status === "dry_run") return "Dry run";
  return "Sin enviar";
}

export function RegistrationsTable({ registrations }: { registrations: RegistrationDocument[] }) {
  if (!registrations.length) {
    return <EmptyState description="No hay inscripciones que coincidan con los filtros actuales." title="Sin resultados" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-csp-soft bg-csp-white shadow-csp">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-csp-soft/70 text-csp-primary">
          <tr>
            <th className="px-3 py-3 font-semibold">Equipo</th>
            <th className="px-3 py-3 font-semibold">Categoría</th>
            <th className="px-3 py-3 font-semibold">Institución</th>
            <th className="px-3 py-3 font-semibold">Responsable / contacto</th>
            <th className="px-3 py-3 font-semibold">Estado</th>
            <th className="px-3 py-3 font-semibold">Correo fase virtual</th>
            <th className="px-3 py-3 font-semibold">Fecha</th>
            <th className="px-3 py-3 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr className="border-t border-csp-soft hover:bg-csp-soft/40" key={registration.id}>
              <td className="px-3 py-3 font-medium text-csp-primary">{registration.teamName}</td>
              <td className="px-3 py-3">{REGISTRATION_CATEGORY_LABELS[registration.category]}</td>
              <td className="px-3 py-3">{getInstitutionDisplay(registration)}</td>
              <td className="px-3 py-3">{getResponsibleOrContactDisplay(registration)}</td>
              <td className="px-3 py-3">{statusLabelMap[registration.status]}</td>
              <td className="px-3 py-3">{virtualEmailLabel(registration)}</td>
              <td className="px-3 py-3">{formatDate(registration.createdAt)}</td>
              <td className="px-3 py-3">
                <Link className="font-semibold text-csp-blue hover:underline" href={adminPath(`/inscripciones/${registration.id}`)}>
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
