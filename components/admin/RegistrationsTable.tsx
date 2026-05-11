import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { RegistrationDocument } from "@/lib/types";
import { formatDate, formatPersonName } from "@/lib/utils";

const statusLabelMap: Record<RegistrationDocument["status"], string> = {
  recibida: "Recibida",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pendiente_correccion: "Pendiente de corrección",
};

type RegistrationsTableProps = {
  registrations: RegistrationDocument[];
};

export function RegistrationsTable({ registrations }: RegistrationsTableProps) {
  if (!registrations.length) {
    return (
      <EmptyState
        description="No hay inscripciones que coincidan con los filtros actuales."
        title="Sin resultados"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-csp-soft bg-csp-white shadow-csp">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-csp-soft/70 text-csp-primary">
          <tr>
            <th className="px-3 py-3 font-semibold">Equipo</th>
            <th className="px-3 py-3 font-semibold">Categoría</th>
            <th className="px-3 py-3 font-semibold">Institución</th>
            <th className="px-3 py-3 font-semibold">Responsable</th>
            <th className="px-3 py-3 font-semibold">Estado</th>
            <th className="px-3 py-3 font-semibold">Fecha</th>
            <th className="px-3 py-3 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr
              key={registration.id}
              className="border-t border-csp-soft hover:bg-csp-soft/40"
            >
              <td className="px-3 py-3 font-medium text-csp-primary">
                {registration.teamName}
              </td>
              <td className="px-3 py-3 capitalize">{registration.category}</td>
              <td className="px-3 py-3">{registration.institution}</td>
              <td className="px-3 py-3">
                {registration.category === "colegios"
                  ? formatPersonName(
                      registration.responsible?.firstName,
                      registration.responsible?.lastName,
                    ) || "-"
                  : "No aplica"}
              </td>
              <td className="px-3 py-3">{statusLabelMap[registration.status]}</td>
              <td className="px-3 py-3">{formatDate(registration.createdAt)}</td>
              <td className="px-3 py-3">
                <Link
                  className="font-semibold text-csp-blue hover:underline"
                  href={`/admin/inscripciones/${registration.id}`}
                >
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
