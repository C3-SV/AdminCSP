"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminPath } from "@/lib/admin/routes";
import { getRegistrationById } from "@/services/admin/registrations";
import { RegistrationDocument } from "@/types/admin/registration";

export default function AdminInscripcionDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [registration, setRegistration] = useState<RegistrationDocument | null>(null);
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
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <AdminTopbar subtitle={`ID: ${id}`} title="Detalle de inscripción" />
      {usingMockData && message ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {message}
        </p>
      ) : null}

      <Link
        className="inline-flex h-11 items-center justify-center rounded-md border border-csp-primary px-4 text-sm font-semibold text-csp-primary hover:bg-csp-soft"
        href={adminPath("/inscripciones")}
      >
        Volver a inscripciones
      </Link>

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
