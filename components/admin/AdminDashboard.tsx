import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatsCards } from "@/components/admin/StatsCards";
import { RegistrationDocument } from "@/lib/types";

type AdminDashboardProps = {
  registrations: RegistrationDocument[];
};

export function AdminDashboard({ registrations }: AdminDashboardProps) {
  const total = registrations.length;
  const colegios = registrations.filter((item) => item.category === "colegios").length;
  const universidades = registrations.filter(
    (item) => item.category === "universidades",
  ).length;
  const aprobadas = registrations.filter((item) => item.status === "aprobada").length;

  return (
    <div className="space-y-4">
      <StatsCards
        stats={[
          { label: "Total equipos", value: total },
          { label: "Colegios", value: colegios },
          { label: "Universidades", value: universidades },
          { label: "Aprobadas", value: aprobadas },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Gestión de inscripciones
          </h2>
          <p className="mt-1 text-sm text-csp-black/70">
            Revisa equipos, estados y documentos.
          </p>
          <Link
            className="mt-3 inline-block text-sm font-semibold text-csp-blue hover:underline"
            href="/admin/inscripciones"
          >
            Ir al listado
          </Link>
        </Card>
        <Card className="p-4">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Estadísticas
          </h2>
          <p className="mt-1 text-sm text-csp-black/70">
            Consulta distribución por categoría y estado.
          </p>
          <Link
            className="mt-3 inline-block text-sm font-semibold text-csp-blue hover:underline"
            href="/admin/estadisticas"
          >
            Ver estadísticas
          </Link>
        </Card>
        <Card className="p-4">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Configuración
          </h2>
          <p className="mt-1 text-sm text-csp-black/70">
            Estado de Firebase e integraciones futuras.
          </p>
          <Link
            className="mt-3 inline-block text-sm font-semibold text-csp-blue hover:underline"
            href="/admin/configuracion"
          >
            Ver configuración
          </Link>
        </Card>
      </div>
    </div>
  );
}
