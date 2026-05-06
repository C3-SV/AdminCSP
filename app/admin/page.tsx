"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { getRegistrations } from "@/lib/firebase-registrations";
import { RegistrationDocument } from "@/lib/types";

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<RegistrationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getRegistrations();
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
  }, []);

  return (
    <div className="space-y-4">
      <AdminTopbar
        subtitle="Resumen rápido y accesos del módulo de inscripciones."
        title="Panel de Control"
      />
      {usingMockData && message ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-csp-black/70">Cargando dashboard...</p>
      ) : (
        <AdminDashboard registrations={registrations} />
      )}
    </div>
  );
}
