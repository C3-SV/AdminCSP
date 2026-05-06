"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsCards } from "@/components/admin/StatsCards";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Card } from "@/components/ui/Card";
import {
  countByStatus,
  countParticipants,
  uniqueInstitutions,
} from "@/lib/admin-utils";
import { getRegistrations } from "@/lib/firebase-registrations";
import { RegistrationDocument } from "@/lib/types";

function BarRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-csp-soft">
        <div
          className="h-2 rounded-full bg-csp-blue"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminEstadisticasPage() {
  const [registrations, setRegistrations] = useState<RegistrationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getRegistrations();
      if (!mounted) {
        return;
      }
      setRegistrations(response.registrations);
      setMessage(response.usingMockData ? response.message ?? "" : "");
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const total = registrations.length;
    const colegios = registrations.filter((item) => item.category === "colegios").length;
    const universidades = total - colegios;
    const aprobadas = countByStatus(registrations, "aprobada");
    const enRevision = countByStatus(registrations, "en_revision");
    const rechazadas = countByStatus(registrations, "rechazada");
    const pendientes = countByStatus(registrations, "pendiente_correccion");
    const participantes = countParticipants(registrations);

    return {
      total,
      colegios,
      universidades,
      aprobadas,
      enRevision,
      rechazadas,
      pendientes,
      participantes,
      topInstitutions: uniqueInstitutions(registrations),
    };
  }, [registrations]);

  return (
    <div className="space-y-4">
      <AdminTopbar subtitle="Indicadores simples del módulo de inscripción." title="Estadísticas" />
      {message ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-csp-black/70">Cargando estadísticas...</p>
      ) : (
        <>
          <StatsCards
            stats={[
              { label: "Total equipos", value: totals.total },
              { label: "Total participantes", value: totals.participantes },
              { label: "Colegios", value: totals.colegios },
              { label: "Universidades", value: totals.universidades },
              { label: "Aprobadas", value: totals.aprobadas },
              { label: "En revisión", value: totals.enRevision },
              { label: "Rechazadas", value: totals.rechazadas },
              { label: "Pendientes de corrección", value: totals.pendientes },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">
                Distribución por categoría
              </h2>
              <BarRow
                label="Colegios"
                total={totals.total}
                value={totals.colegios}
              />
              <BarRow
                label="Universidades"
                total={totals.total}
                value={totals.universidades}
              />
            </Card>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">
                Distribución por estado
              </h2>
              <BarRow label="Recibidas" total={totals.total} value={countByStatus(registrations, "recibida")} />
              <BarRow label="En revisión" total={totals.total} value={totals.enRevision} />
              <BarRow label="Aprobadas" total={totals.total} value={totals.aprobadas} />
              <BarRow label="Rechazadas" total={totals.total} value={totals.rechazadas} />
              <BarRow
                label="Pendiente de corrección"
                total={totals.total}
                value={totals.pendientes}
              />
            </Card>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">
                Top instituciones
              </h2>
              {totals.topInstitutions.map((item) => (
                <BarRow
                  key={item.institution}
                  label={item.institution}
                  total={totals.total}
                  value={item.total}
                />
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
