"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminPath } from "@/lib/admin/routes";
import { registrationDetailHref } from "@/lib/admin/registrationNavigation";
import { getRegistrationById, getRegistrations } from "@/services/admin/registrations";
import { RegistrationDocument } from "@/types/admin/registration";

export default function AdminInscripcionDetallePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const navigationKey = searchParams.get("nav") ?? "";
  const requestedNavigationIds = useMemo(() => navigationKey.split(",").map((value) => value.trim()).filter(Boolean), [navigationKey]);
  const requestedBackPath = searchParams.get("back") ?? "/inscripciones";
  const backPath = ["/inscripciones", "/colegios", "/universidades", "/ade"].includes(requestedBackPath)
    ? requestedBackPath
    : "/inscripciones";
  const [registration, setRegistration] = useState<RegistrationDocument | null>(null);
  const [navigationIds, setNavigationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getRegistrationById(id);
      if (!mounted) {
        return;
      }
      setRegistration(response.registration);
      setUsingMockData(response.usingMockData);
      setMessage(response.message ?? "");
      if (requestedNavigationIds.length) {
        setNavigationIds(requestedNavigationIds.includes(id) ? requestedNavigationIds : [id, ...requestedNavigationIds]);
      } else {
        const fallback = await getRegistrations();
        setNavigationIds(fallback.registrations.map((item) => item.id));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigationKey, requestedNavigationIds]);

  const currentIndex = navigationIds.indexOf(id);
  const previousId = currentIndex > 0 ? navigationIds[currentIndex - 1] : undefined;
  const nextId = currentIndex >= 0 && currentIndex < navigationIds.length - 1 ? navigationIds[currentIndex + 1] : undefined;

  return (
    <div className="space-y-4">
      <AdminTopbar subtitle={`ID: ${id}`} title="Detalle de inscripción" />
      {message ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link className="inline-flex h-11 items-center justify-center rounded-md border border-csp-primary px-4 text-sm font-semibold text-csp-primary hover:bg-csp-soft" href={adminPath(backPath)}>
          Volver a inscripciones
        </Link>
        {previousId ? (
          <Link className="inline-flex h-11 items-center justify-center rounded-md border border-csp-primary px-4 text-sm font-semibold text-csp-primary hover:bg-csp-soft" href={registrationDetailHref(previousId, navigationIds, backPath)}>
            ← Inscripción anterior
          </Link>
        ) : <span className="inline-flex h-11 items-center justify-center rounded-md border border-csp-soft px-4 text-sm text-csp-black/40">← Inscripción anterior</span>}
        {nextId ? (
          <Link className="inline-flex h-11 items-center justify-center rounded-md bg-csp-blue px-4 text-sm font-semibold text-csp-white hover:bg-csp-primary" href={registrationDetailHref(nextId, navigationIds, backPath)}>
            Siguiente inscripción →
          </Link>
        ) : <span className="inline-flex h-11 items-center justify-center rounded-md border border-csp-soft px-4 text-sm text-csp-black/40">Siguiente inscripción →</span>}
        {currentIndex >= 0 ? <span className="text-sm text-csp-black/65">{currentIndex + 1} de {navigationIds.length}</span> : null}
      </div>

      {loading ? (
        <p className="text-sm text-csp-black/70">Cargando detalle...</p>
      ) : registration ? (
        <RegistrationDetail registration={registration} usingMockData={usingMockData} />
      ) : (
        <EmptyState
          description="No se encontró la inscripción solicitada."
          title="Inscripción no disponible"
        />
      )}
    </div>
  );
}
