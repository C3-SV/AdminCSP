"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  COMPETITIVE_PHASE_LABELS,
  COMPETITIVE_STATUS_LABELS,
  REGISTRATION_STATUS_OPTIONS,
} from "@/constants/admin";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { StatsCards } from "@/components/admin/StatsCards";
import { adminPath } from "@/lib/admin/routes";
import {
  getRegistrationsByCategory,
  resolveRegistrationCompetitiveView,
  updateRegistrationCompetitiveState,
} from "@/services/admin/registrations";
import {
  CompetitivePhase,
  CompetitiveStatus,
  RegistrationCategory,
  RegistrationDocument,
  RegistrationStatus,
} from "@/types/admin/registration";
import { formatDate, formatPersonName } from "@/utils/admin";

type CategoryTeamsPageProps = {
  category: RegistrationCategory;
  title: string;
  subtitle: string;
};

type CompetitiveActionKey =
  | "online"
  | "clasificar_presencial"
  | "no_clasificado"
  | "finalista"
  | "ganador"
  | "eliminado";

type CompetitiveAction = {
  label: string;
  faseActual: CompetitivePhase;
  estadoCompetitivo: CompetitiveStatus;
};

const STATUS_LABEL_MAP: Record<RegistrationStatus, string> = {
  recibida: "Recibida",
  en_revision: "En revision",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pendiente_correccion: "Pendiente de correccion",
};

const COMPETITIVE_ACTIONS: Record<CompetitiveActionKey, CompetitiveAction> = {
  online: {
    label: "Marcar en fase online",
    faseActual: "online",
    estadoCompetitivo: "participando",
  },
  clasificar_presencial: {
    label: "Clasificar a presencial",
    faseActual: "presencial",
    estadoCompetitivo: "clasificado",
  },
  no_clasificado: {
    label: "Marcar como no clasificado",
    faseActual: "cerrado",
    estadoCompetitivo: "no_clasificado",
  },
  finalista: {
    label: "Marcar como finalista",
    faseActual: "final",
    estadoCompetitivo: "finalista",
  },
  ganador: {
    label: "Marcar como ganador",
    faseActual: "cerrado",
    estadoCompetitivo: "ganador",
  },
  eliminado: {
    label: "Marcar como eliminado",
    faseActual: "cerrado",
    estadoCompetitivo: "eliminado",
  },
};

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${value}`;
}

export function CategoryTeamsPage({ category, title, subtitle }: CategoryTeamsPageProps) {
  const { user, adminProfile } = useAdminAuth();
  const [registrations, setRegistrations] = useState<RegistrationDocument[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"all" | RegistrationStatus>(
    "all",
  );
  const [phaseFilter, setPhaseFilter] = useState<"all" | CompetitivePhase | "pendiente">("all");
  const [competitiveStatus, setCompetitiveStatus] = useState<
    "all" | CompetitiveStatus | "pendiente"
  >("all");
  const [actionByTeamId, setActionByTeamId] = useState<Record<string, CompetitiveActionKey>>({});
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getRegistrationsByCategory(category);
      if (!mounted) {
        return;
      }
      setRegistrations(response.registrations);
      setUsingMockData(response.usingMockData);
      setMessage(response.message ?? "");
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [category]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredRegistrations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return registrations.filter((registration) => {
      const competitionView = resolveRegistrationCompetitiveView(registration);
      const responsibleName =
        formatPersonName(
          registration.responsible?.firstName,
          registration.responsible?.lastName,
        ) || "";
      const matchesSearch =
        !normalizedSearch ||
        registration.teamName.toLowerCase().includes(normalizedSearch) ||
        registration.institution.toLowerCase().includes(normalizedSearch) ||
        responsibleName.toLowerCase().includes(normalizedSearch);

      const matchesRegistrationStatus =
        registrationStatus === "all" || registration.status === registrationStatus;
      const matchesPhase =
        phaseFilter === "all" || competitionView.faseActualMostrada === phaseFilter;
      const matchesCompetitiveStatus =
        competitiveStatus === "all" ||
        competitionView.estadoCompetitivoMostrado === competitiveStatus;

      return (
        matchesSearch &&
        matchesRegistrationStatus &&
        matchesPhase &&
        matchesCompetitiveStatus
      );
    });
  }, [competitiveStatus, phaseFilter, registrationStatus, registrations, search]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const online = registrations.filter((registration) => {
      const view = resolveRegistrationCompetitiveView(registration);
      return view.faseActualMostrada === "online";
    }).length;
    const clasificados = registrations.filter((registration) => {
      const view = resolveRegistrationCompetitiveView(registration);
      return (
        view.faseActualMostrada === "presencial" ||
        view.estadoCompetitivoMostrado === "clasificado"
      );
    }).length;
    const finalistas = registrations.filter((registration) => {
      const view = resolveRegistrationCompetitiveView(registration);
      return view.estadoCompetitivoMostrado === "finalista";
    }).length;
    const ganadoresOCerrados = registrations.filter((registration) => {
      const view = resolveRegistrationCompetitiveView(registration);
      return (
        view.estadoCompetitivoMostrado === "ganador" || view.faseActualMostrada === "cerrado"
      );
    }).length;

    return [
      { label: `Total ${category}`, value: total },
      { label: "En fase online", value: online },
      { label: "Clasificados a presencial", value: clasificados },
      { label: "Finalistas", value: finalistas },
      { label: "Ganadores/cerrados", value: ganadoresOCerrados },
    ];
  }, [category, registrations]);

  const handleActionChange = (registrationId: string, action: CompetitiveActionKey) => {
    setActionByTeamId((current) => ({
      ...current,
      [registrationId]: action,
    }));
  };

  const handleApplyAction = async (registration: RegistrationDocument) => {
    const actionKey = actionByTeamId[registration.id];
    if (!actionKey) {
      setToast({ message: "Selecciona una accion primero.", variant: "info" });
      return;
    }

    if (!window.confirm("Vas a cambiar la fase de este equipo. Deseas continuar?")) {
      return;
    }

    if (usingMockData) {
      setToast({
        message: "Modo prueba: Firebase no esta configurado, no se guardaron cambios.",
        variant: "info",
      });
      return;
    }

    const selectedAction = COMPETITIVE_ACTIONS[actionKey];
    const updatedBy = (user?.email ?? adminProfile?.email ?? "").trim().toLowerCase();

    setSavingId(registration.id);
    try {
      await updateRegistrationCompetitiveState({
        id: registration.id,
        faseActual: selectedAction.faseActual,
        estadoCompetitivo: selectedAction.estadoCompetitivo,
        updatedBy: updatedBy || undefined,
      });

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registration.id
            ? {
                ...item,
                faseActual: selectedAction.faseActual,
                estadoCompetitivo: selectedAction.estadoCompetitivo,
                updatedAt: new Date().toISOString(),
                updatedBy: updatedBy || item.updatedBy,
              }
            : item,
        ),
      );
      setToast({ message: "Fase competitiva actualizada.", variant: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "No fue posible actualizar la fase competitiva.",
        variant: "error",
      });
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      <AdminTopbar subtitle={subtitle} title={title} />

      {usingMockData && message ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-csp-black/70">Cargando equipos...</p>
      ) : (
        <>
          <StatsCards stats={stats} />

          <div className="grid gap-3 rounded-lg border border-csp-soft bg-csp-white p-4 md:grid-cols-4">
            <Input
              id={`filter-search-${category}`}
              label="Busqueda"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Equipo, institucion o responsable..."
              value={search}
            />
            <Select
              id={`filter-registration-status-${category}`}
              label="Estado de inscripcion"
              onChange={(event) =>
                setRegistrationStatus(event.target.value as "all" | RegistrationStatus)
              }
              options={[
                { value: "all", label: "Todos" },
                ...REGISTRATION_STATUS_OPTIONS,
              ]}
              value={registrationStatus}
            />
            <Select
              id={`filter-phase-${category}`}
              label="Fase actual"
              onChange={(event) =>
                setPhaseFilter(
                  event.target.value as "all" | CompetitivePhase | "pendiente",
                )
              }
              options={[
                { value: "all", label: "Todas" },
                { value: "pendiente", label: "Pendiente/sin asignar" },
                { value: "online", label: "Online" },
                { value: "presencial", label: "Presencial" },
                { value: "final", label: "Final" },
                { value: "cerrado", label: "Cerrado" },
              ]}
              value={phaseFilter}
            />
            <Select
              id={`filter-competitive-status-${category}`}
              label="Estado competitivo"
              onChange={(event) =>
                setCompetitiveStatus(
                  event.target.value as "all" | CompetitiveStatus | "pendiente",
                )
              }
              options={[
                { value: "all", label: "Todos" },
                { value: "pendiente", label: "Pendiente/sin asignar" },
                { value: "participando", label: "Participando" },
                { value: "clasificado", label: "Clasificado" },
                { value: "no_clasificado", label: "No clasificado" },
                { value: "finalista", label: "Finalista" },
                { value: "ganador", label: "Ganador" },
                { value: "eliminado", label: "Eliminado" },
              ]}
              value={competitiveStatus}
            />
          </div>

          {!filteredRegistrations.length ? (
            <EmptyState
              description="No hay equipos para los filtros seleccionados."
              title="Sin resultados"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-csp-soft bg-csp-white shadow-csp">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-csp-soft/70 text-csp-primary">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Equipo</th>
                    <th className="px-3 py-3 font-semibold">Institucion</th>
                    <th className="px-3 py-3 font-semibold">Responsable</th>
                    <th className="px-3 py-3 font-semibold">Estado de inscripcion</th>
                    <th className="px-3 py-3 font-semibold">Fase actual</th>
                    <th className="px-3 py-3 font-semibold">Estado competitivo</th>
                    <th className="px-3 py-3 font-semibold">Puntaje online</th>
                    <th className="px-3 py-3 font-semibold">Puntaje presencial</th>
                    <th className="px-3 py-3 font-semibold">Fecha</th>
                    <th className="px-3 py-3 font-semibold">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => {
                    const competitionView = resolveRegistrationCompetitiveView(registration);
                    const selectedAction = actionByTeamId[registration.id] ?? "online";
                    const savingRow = savingId === registration.id;

                    return (
                      <tr
                        className="border-t border-csp-soft hover:bg-csp-soft/40"
                        key={registration.id}
                      >
                        <td className="px-3 py-3 font-medium text-csp-primary">
                          {registration.teamName}
                        </td>
                        <td className="px-3 py-3">{registration.institution}</td>
                        <td className="px-3 py-3">
                          {formatPersonName(
                            registration.responsible?.firstName,
                            registration.responsible?.lastName,
                          ) || "-"}
                        </td>
                        <td className="px-3 py-3">{STATUS_LABEL_MAP[registration.status]}</td>
                        <td className="px-3 py-3">
                          {competitionView.faseActualMostrada === "pendiente"
                            ? "Pendiente/sin asignar"
                            : COMPETITIVE_PHASE_LABELS[competitionView.faseActualMostrada]}
                        </td>
                        <td className="px-3 py-3">
                          {competitionView.estadoCompetitivoMostrado === "pendiente"
                            ? "Pendiente/sin asignar"
                            : COMPETITIVE_STATUS_LABELS[
                                competitionView.estadoCompetitivoMostrado
                              ]}
                        </td>
                        <td className="px-3 py-3">{formatScore(registration.puntajeOnline)}</td>
                        <td className="px-3 py-3">
                          {formatScore(registration.puntajePresencial)}
                        </td>
                        <td className="px-3 py-3">{formatDate(registration.createdAt)}</td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-[260px] items-end gap-2">
                            <Link
                              aria-label={`Ver detalle de ${registration.teamName}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-csp-primary text-csp-primary hover:bg-csp-soft"
                              href={adminPath(`/inscripciones/${registration.id}`)}
                              title="Ver detalle"
                            >
                              <svg
                                aria-hidden="true"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.8"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                />
                              </svg>
                            </Link>
                            <Select
                              className="h-9"
                              id={`action-${registration.id}`}
                              onChange={(event) =>
                                handleActionChange(
                                  registration.id,
                                  event.target.value as CompetitiveActionKey,
                                )
                              }
                              options={Object.entries(COMPETITIVE_ACTIONS).map(
                                ([value, action]) => ({
                                  value,
                                  label: action.label,
                                }),
                              )}
                              value={selectedAction}
                            />
                            <Button
                              className="h-9 px-3"
                              isLoading={savingRow}
                              onClick={() => void handleApplyAction(registration)}
                              type="button"
                              variant="secondary"
                            >
                              Aplicar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
