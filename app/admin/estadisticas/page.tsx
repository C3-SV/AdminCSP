"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsCards } from "@/components/admin/StatsCards";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Card } from "@/components/ui/Card";
import { LABORATORY_OPTIONS, REGISTRATION_CATEGORY_LABELS } from "@/constants/admin";
import { getRegistrations, resolveRegistrationCompetitiveView } from "@/services/admin/registrations";
import { KnownRegistrationCategory, RegistrationDocument } from "@/types/admin/registration";
import { countByStatus, countParticipants, uniqueInstitutions } from "@/utils/admin/metrics";

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="whitespace-nowrap">{value} · {percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-csp-soft">
        <div className="h-2 rounded-full bg-csp-blue" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function average(values: Array<number | null | undefined>) {
  const defined = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return defined.length ? Math.round((defined.reduce((sum, value) => sum + value, 0) / defined.length) * 10) / 10 : null;
}

function isReachable(registration: RegistrationDocument) {
  return [registration.responsible?.email, registration.contactEmail, ...registration.members.map((member) => member.email)]
    .some((email) => Boolean(email?.trim()));
}

const CATEGORIES: KnownRegistrationCategory[] = ["colegios", "universidades", "ade"];

export default function AdminEstadisticasPage() {
  const [registrations, setRegistrations] = useState<RegistrationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    void getRegistrations().then((response) => {
      if (!mounted) return;
      setRegistrations(response.registrations);
      setMessage(response.message ?? "");
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const total = registrations.length;
    const aprobadas = countByStatus(registrations, "aprobada");
    const rechazadas = countByStatus(registrations, "rechazada");
    const pendientes = countByStatus(registrations, "pendiente_correccion");
    const enRevision = countByStatus(registrations, "en_revision");
    const reviewed = aprobadas + rechazadas;
    const requiresReview = total - reviewed;
    const emailSent = registrations.filter((item) => item.emailStatus.virtualInstructions.status === "sent").length;
    const emailDryRun = registrations.filter((item) => item.emailStatus.virtualInstructions.status === "dry_run").length;
    const emailFailed = registrations.filter((item) => item.emailStatus.virtualInstructions.status === "failed").length;
    const approvedWithoutEmail = registrations.filter(
      (item) => item.status === "aprobada" && item.emailStatus.virtualInstructions.status === "not_sent",
    ).length;
    const competition = registrations.map((registration) => ({ registration, view: resolveRegistrationCompetitiveView(registration) }));
    const phaseOnline = competition.filter(({ view }) => view.faseActualMostrada === "online").length;
    const pendingCompetitive = competition.filter(({ view }) => view.estadoCompetitivoMostrado === "pendiente").length;
    const notClassified = competition.filter(({ view }) => view.estadoCompetitivoMostrado === "no_clasificado").length;
    const onlineScores = registrations.filter((item) => typeof item.puntajeOnline === "number");
    const progressedToOnsite = competition.filter(({ view }) =>
      view.faseActualMostrada === "presencial" ||
      view.estadoCompetitivoMostrado === "clasificado",
    ).length;
    const onsiteScores = registrations.filter((item) => typeof item.puntajePresencial === "number");
    const byCategory = CATEGORIES.map((category) => {
      const teams = registrations.filter((item) => item.category === category);
      return {
        category,
        total: teams.length,
        approved: teams.filter((item) => item.status === "aprobada").length,
        emailSent: teams.filter((item) => item.emailStatus.virtualInstructions.status === "sent").length,
        online: teams.filter((item) => item.faseActual === "online").length,
        progressedToOnsite: teams.filter((item) =>
          item.faseActual === "presencial" ||
          item.estadoCompetitivo === "clasificado",
        ).length,
      };
    });
    const colegioClassified = registrations.filter((item) => item.category === "colegios" && item.estadoCompetitivo === "clasificado");
    const byLaboratory = LABORATORY_OPTIONS.map(({ value, label }) => {
      const teams = colegioClassified.filter((item) => item.laboratorioAsignado === value);
      return { value, label, total: teams.length, teams: teams.map((team) => team.teamName.trim() || "Equipo sin nombre") };
    });
    const classifiedWithoutLaboratory = colegioClassified.filter((item) => !item.laboratorioAsignado).length;
    const classifiedWithLaboratory = byLaboratory.reduce((total, laboratory) => total + laboratory.total, 0);

    return {
      total,
      participantes: countParticipants(registrations),
      aprobadas,
      rechazadas,
      pendientes,
      enRevision,
      reviewed,
      requiresReview,
      noContact: registrations.filter((item) => !isReachable(item)).length,
      emailSent,
      emailDryRun,
      emailFailed,
      approvedWithoutEmail,
      phaseOnline,
      pendingCompetitive,
      notClassified,
      onlineScores: onlineScores.length,
      averageOnlineScore: average(onlineScores.map((item) => item.puntajeOnline)),
      progressedToOnsite,
      onsiteScores: onsiteScores.length,
      averageOnsiteScore: average(onsiteScores.map((item) => item.puntajePresencial)),
      byCategory,
      byLaboratory,
      classifiedWithLaboratory,
      classifiedWithoutLaboratory,
      topInstitutions: uniqueInstitutions(registrations),
    };
  }, [registrations]);

  return (
    <div className="space-y-4">
      <AdminTopbar subtitle="Seguimiento operativo desde inscripción hasta resultados." title="Estadísticas" />
      {message ? <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">{message}</p> : null}

      {loading ? <p className="text-sm text-csp-black/70">Cargando estadísticas...</p> : (
        <>
          <StatsCards stats={[
            { label: "Total equipos", value: totals.total },
            { label: "Total participantes", value: totals.participantes },
            { label: "Aprobadas", value: totals.aprobadas },
            { label: "Correos virtuales enviados", value: totals.emailSent },
            { label: "Pendientes de correo", value: totals.approvedWithoutEmail },
            { label: "Avanzaron a presencial", value: totals.progressedToOnsite },
            { label: "Pendientes competitivos", value: totals.pendingCompetitive },
            { label: "No clasificados", value: totals.notClassified },
            { label: "Colegios clasificados con laboratorio", value: totals.classifiedWithLaboratory },
          ]} />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">1. Inscripción y revisión</h2>
              <p className="text-sm text-csp-black/70">Control de entrada y aprobación de equipos.</p>
              <BarRow label="Revisadas" total={totals.total} value={totals.reviewed} />
              <BarRow label="Pendientes de revisión" total={totals.total} value={totals.requiresReview} />
              <BarRow label="Aprobadas" total={totals.total} value={totals.aprobadas} />
              <BarRow label="Pendiente de corrección" total={totals.total} value={totals.pendientes} />
              <BarRow label="Rechazadas" total={totals.total} value={totals.rechazadas} />
              <BarRow label="Sin correo de contacto" total={totals.total} value={totals.noContact} />
            </Card>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">2. Fase virtual y comunicación</h2>
              <p className="text-sm text-csp-black/70">Entrega de indicaciones y avance en la etapa online.</p>
              <BarRow label="Indicaciones enviadas" total={totals.aprobadas} value={totals.emailSent} />
              <BarRow label="Aprobadas sin correo" total={totals.aprobadas} value={totals.approvedWithoutEmail} />
              <BarRow label="Fallos de envío" total={totals.aprobadas} value={totals.emailFailed} />
              <BarRow label="Pruebas Dry run" total={totals.aprobadas} value={totals.emailDryRun} />
              <BarRow label="Con fase virtual asignada" total={totals.aprobadas} value={totals.phaseOnline} />
              <BarRow label="Estado competitivo pendiente" total={totals.aprobadas} value={totals.pendingCompetitive} />
              <BarRow label="Puntaje online cargado" total={totals.phaseOnline} value={totals.onlineScores} />
              <p className="text-sm text-csp-black/70">Promedio online: <strong>{totals.averageOnlineScore ?? "Sin datos"}</strong></p>
            </Card>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">3. Presencial y resultados</h2>
              <p className="text-sm text-csp-black/70">Equipos que avanzan y resultados disponibles.</p>
              <BarRow label="Avanzaron a presencial" total={totals.total} value={totals.progressedToOnsite} />
              <BarRow label="Puntaje presencial cargado" total={totals.progressedToOnsite} value={totals.onsiteScores} />
              <BarRow label="No clasificados" total={totals.total} value={totals.notClassified} />
              <p className="text-sm text-csp-black/70">Promedio presencial: <strong>{totals.averageOnsiteScore ?? "Sin datos"}</strong></p>
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-csp-primary">Distribución de laboratorios · Colegios</h2>
                <p className="mt-1 text-sm text-csp-black/70">Equipos de Colegios clasificados y asignados a cada laboratorio.</p>
              </div>
              <p className="text-sm font-semibold text-csp-primary">{totals.classifiedWithoutLaboratory} sin asignar</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {totals.byLaboratory.map((laboratory) => (
                <div className="rounded-md border border-csp-soft bg-csp-soft/20 p-4" key={laboratory.value}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-csp-primary">{laboratory.label}</h3>
                    <span className="rounded-full bg-csp-blue px-2.5 py-1 text-sm font-bold text-white">{laboratory.total}</span>
                  </div>
                  {laboratory.teams.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-csp-black/80">
                      {laboratory.teams.map((team, index) => <li key={`${laboratory.value}-${team}-${index}`}>{team}</li>)}
                    </ul>
                  ) : <p className="mt-3 text-sm text-csp-black/60">Sin equipos asignados.</p>}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-x-auto">
              <h2 className="font-display text-lg font-semibold text-csp-primary">Avance por categoría</h2>
              <p className="mt-1 text-sm text-csp-black/70">Comparación de cada categoría entre las etapas operativas.</p>
              <table className="mt-4 min-w-full text-left text-sm">
                <thead className="border-b border-csp-soft text-csp-primary">
                  <tr>
                    <th className="pb-2 pr-4 font-semibold">Categoría</th><th className="pb-2 pr-4 font-semibold">Equipos</th><th className="pb-2 pr-4 font-semibold">Aprobados</th><th className="pb-2 pr-4 font-semibold">Correo enviado</th><th className="pb-2 pr-4 font-semibold">Online</th><th className="pb-2 font-semibold">Presencial+</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.byCategory.map((item) => (
                    <tr className="border-b border-csp-soft/70" key={item.category}>
                      <td className="py-2 pr-4 font-medium">{REGISTRATION_CATEGORY_LABELS[item.category]}</td><td className="py-2 pr-4">{item.total}</td><td className="py-2 pr-4">{item.approved}</td><td className="py-2 pr-4">{item.emailSent}</td><td className="py-2 pr-4">{item.online}</td><td className="py-2">{item.progressedToOnsite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-csp-primary">Instituciones con más equipos</h2>
              {totals.topInstitutions.length ? totals.topInstitutions.map((item) => (
                <BarRow key={item.institution} label={item.institution || "Sin institución"} total={totals.total} value={item.total} />
              )) : <p className="text-sm text-csp-black/70">Aún no hay datos de instituciones.</p>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
