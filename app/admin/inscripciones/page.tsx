"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { StatsCards } from "@/components/admin/StatsCards";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { exportRegistrationsToCSV } from "@/lib/csv";
import { getRegistrations } from "@/lib/firebase-registrations";
import { RegistrationDocument, RegistrationStatus } from "@/lib/types";
import { countByStatus } from "@/lib/admin-utils";

function isSameDate(dateISO: string | undefined, dateFilter: string) {
  if (!dateISO || !dateFilter) {
    return true;
  }
  return dateISO.slice(0, 10) === dateFilter;
}

export default function AdminInscripcionesPage() {
  const [registrations, setRegistrations] = useState<RegistrationDocument[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [mockMessage, setMockMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "colegios" | "universidades">(
    "all",
  );
  const [status, setStatus] = useState<"all" | RegistrationStatus>("all");
  const [date, setDate] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getRegistrations();
      if (!mounted) {
        return;
      }

      setRegistrations(response.registrations);
      setUsingMockData(response.usingMockData);
      setMockMessage(response.message ?? "");
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRegistrations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return registrations.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.teamName.toLowerCase().includes(normalizedSearch) ||
        item.institution.toLowerCase().includes(normalizedSearch) ||
        item.teamOmegaUpUser.toLowerCase().includes(normalizedSearch) ||
        (item.category === "colegios" &&
          item.responsible?.fullName?.toLowerCase()?.includes(normalizedSearch)) ||
        false;
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = status === "all" || item.status === status;
      const matchesDate = !date || isSameDate(item.createdAt, date);

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [registrations, search, category, status, date]);

  const stats = useMemo(
    () => [
      { label: "Total equipos", value: registrations.length },
      {
        label: "Colegios",
        value: registrations.filter((item) => item.category === "colegios").length,
      },
      {
        label: "Universidades",
        value: registrations.filter((item) => item.category === "universidades").length,
      },
      { label: "Aprobadas", value: countByStatus(registrations, "aprobada") },
      { label: "En revisión", value: countByStatus(registrations, "en_revision") },
      {
        label: "Pendientes de corrección",
        value: countByStatus(registrations, "pendiente_correccion"),
      },
    ],
    [registrations],
  );

  const handleExportCSV = () => {
    exportRegistrationsToCSV(filteredRegistrations);
    setToast({ message: "CSV exportado correctamente.", variant: "success" });
  };

  const handleCopyEmails = async () => {
    const emails = new Set<string>();

    filteredRegistrations.forEach((registration) => {
      if (registration.contactEmail) {
        emails.add(registration.contactEmail);
      }
      if (registration.category === "colegios" && registration.responsible?.email) {
        emails.add(registration.responsible.email);
      }
      registration.members.forEach((member) => {
        if (member.email) {
          emails.add(member.email);
        }
      });
    });

    if (!emails.size) {
      setToast({
        message: "No hay correos para copiar en la selección actual.",
        variant: "info",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(Array.from(emails).join(", "));
      setToast({ message: "Correos copiados", variant: "success" });
    } catch {
      setToast({ message: "No se pudo copiar al portapapeles.", variant: "error" });
    }
  };

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      <AdminTopbar
        subtitle="Gestión de inscripciones y equipos CSP 2026"
        title="Panel de Control"
      />

      {usingMockData && mockMessage ? (
        <p className="rounded-md border border-csp-warning/40 bg-csp-warning/10 px-3 py-2 text-sm text-csp-black">
          {mockMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleExportCSV} type="button" variant="secondary">
          Exportar CSV
        </Button>
        <Button onClick={handleCopyEmails} type="button" variant="secondary">
          Copiar correos
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-csp-black/70">Cargando inscripciones...</p>
      ) : (
        <>
          <StatsCards stats={stats} />
          <AdminFilters
            category={category}
            date={date}
            onCategoryChange={setCategory}
            onDateChange={setDate}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            search={search}
            status={status}
          />
          <RegistrationsTable registrations={filteredRegistrations} />
        </>
      )}
    </div>
  );
}
