"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { getAdminEmailHistory } from "@/services/admin/adminMutations";
import type { EmailLog } from "@/types/admin/email";
import { formatDate } from "@/utils/admin";

const TYPE_LABELS: Record<EmailLog["emailType"], string> = {
  virtual_instructions: "Indicaciones fase virtual",
  classified_to_onsite: "Clasificado a presencial",
  not_classified: "No clasificado",
  final_instructions: "Indicaciones Finales",
  diplomas_virtual: "Diplomas fase virtual",
  diplomas_presencial: "Diplomas fase presencial",
  finalist: "Finalista",
  winner: "Ganador",
  custom: "Correo personalizado",
};

export default function AdminCorreosPage() {
  const { user } = useAdminAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setLogs(await getAdminEmailHistory({ user }));
    } catch (error) {
      setToast(error instanceof Error ? error.message : "No fue posible cargar los correos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    getAdminEmailHistory({ user })
      .then((history) => {
        if (active) setLogs(history);
      })
      .catch((error: unknown) => {
        if (active) setToast(error instanceof Error ? error.message : "No fue posible cargar los correos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => [log.teamName, log.to, ...(log.toEmails ?? []), log.subject, log.emailType, ...log.cc, ...(log.bcc ?? [])].join(" ").toLowerCase().includes(term));
  }, [logs, search]);

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast} variant="error" /> : null}
      <AdminTopbar subtitle="Historial consolidado de comunicaciones operativas" title="Correos enviados" />
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-csp-soft bg-csp-white p-4">
        <Input id="email-search" label="Buscar" onChange={(event) => setSearch(event.target.value)} placeholder="Equipo, destinatario o tipo..." value={search} />
        <Button isLoading={loading} onClick={() => void load()} type="button" variant="secondary">Actualizar</Button>
      </div>
      {loading ? <p className="text-sm text-csp-black/70">Cargando correos...</p> : !filtered.length ? <EmptyState description="No hay correos administrativos registrados." title="Sin correos" /> : (
        <div className="overflow-x-auto rounded-lg border border-csp-soft bg-csp-white shadow-csp">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-csp-soft/70 text-csp-primary">
              <tr>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Equipo</th>
                <th className="px-3 py-3">Tipo y asunto</th>
                <th className="px-3 py-3">Destinatarios</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Enviado por</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr className="border-t border-csp-soft align-top" key={log.id}>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(log.createdAt)}</td>
                  <td className="px-3 py-3 font-medium text-csp-primary">{log.teamName || "—"}</td>
                  <td className="max-w-xs px-3 py-3">
                    <p className="font-medium">{TYPE_LABELS[log.emailType]}</p>
                    <p className="mt-1 text-xs text-csp-black/60">{log.subject || "Sin asunto"}</p>
                  </td>
                  <td className="max-w-sm px-3 py-3 text-xs">
                    <p><strong>Para:</strong> {(log.toEmails?.length ? log.toEmails : [log.to]).join(", ")}</p>
                    {log.cc.length ? <p className="mt-1"><strong>CC:</strong> {log.cc.join(", ")}</p> : null}
                    {log.bcc?.length ? <p className="mt-1"><strong>CCO:</strong> {log.bcc.join(", ")}</p> : null}
                  </td>
                  <td className="px-3 py-3">{log.status}</td>
                  <td className="px-3 py-3">{log.createdBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
