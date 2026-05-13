"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import {
  createAllowlistEntry,
  listAllowlistEntries,
  normalizeAdminEmail,
  updateAllowlistEntryActive,
  updateAllowlistEntryRole,
} from "@/services/admin/allowlist";
import { AdminAllowlistEntry, AdminAllowlistRole } from "@/types/admin/auth";
import { formatDate } from "@/utils/admin";

const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminAutorizadosPage() {
  const { adminProfile, isOwner } = useAdminAuth();
  const [entries, setEntries] = useState<AdminAllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminAllowlistRole>("admin");
  const [submitting, setSubmitting] = useState(false);
  const [savingEntryId, setSavingEntryId] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const actorEmail = adminProfile?.email ?? "";

  const loadEntries = useCallback(async () => {
    if (!isOwner) {
      setEntries([]);
      setLoading(false);
      setLoadingError("");
      return;
    }

    setLoading(true);
    setLoadingError("");
    try {
      const nextEntries = await listAllowlistEntries();
      setEntries(nextEntries);
    } catch (error) {
      console.error("No se pudo cargar la allowlist:", error);
      setLoadingError("No se pudo cargar la lista de autorizados.");
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEntries();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadEntries]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.email.localeCompare(b.email)),
    [entries],
  );

  const handleAddEntry = async () => {
    const normalizedEmail = normalizeAdminEmail(newEmail);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setToast({ message: "Ingresa un correo válido.", variant: "error" });
      return;
    }

    if (entries.some((entry) => entry.email === normalizedEmail)) {
      setToast({ message: "Ese correo ya existe en la lista de autorizados.", variant: "info" });
      return;
    }

    if (!actorEmail) {
      setToast({ message: "No se pudo identificar al owner actual.", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await createAllowlistEntry({
        email: normalizedEmail,
        role: newRole,
        actorEmail,
      });
      setNewEmail("");
      setNewRole("admin");
      setToast({ message: "Correo autorizado agregado.", variant: "success" });
      await loadEntries();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudo agregar el correo autorizado.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleUpdate = async (email: string, role: AdminAllowlistRole) => {
    if (!actorEmail) return;
    setSavingEntryId(email);
    try {
      await updateAllowlistEntryRole({ email, role, actorEmail });
      setEntries((current) =>
        current.map((item) =>
          item.email === email
            ? {
                ...item,
                role,
                updatedAt: new Date().toISOString(),
                updatedBy: normalizeAdminEmail(actorEmail),
              }
            : item,
        ),
      );
      setToast({ message: "Rol actualizado.", variant: "success" });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "No se pudo actualizar el rol.",
        variant: "error",
      });
    } finally {
      setSavingEntryId("");
    }
  };

  const handleActiveUpdate = async (email: string, active: boolean) => {
    if (!actorEmail) return;
    setSavingEntryId(email);
    try {
      await updateAllowlistEntryActive({ email, active, actorEmail });
      setEntries((current) =>
        current.map((item) =>
          item.email === email
            ? {
                ...item,
                active,
                updatedAt: new Date().toISOString(),
                updatedBy: normalizeAdminEmail(actorEmail),
              }
            : item,
        ),
      );
      setToast({
        message: active ? "Correo activado." : "Correo desactivado.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "No se pudo actualizar el estado.",
        variant: "error",
      });
    } finally {
      setSavingEntryId("");
    }
  };

  return (
    <div className="space-y-4">
      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}

      <AdminTopbar
        subtitle="Gestiona los correos que pueden entrar al panel admin con Google."
        title="Autorizados"
      />

      {!isOwner ? (
        <Card>
          <p className="text-sm text-csp-black/80">
            Tu rol es <strong>{adminProfile?.role ?? "admin"}</strong>. Solo un owner
            puede administrar la lista de correos autorizados.
          </p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-csp-primary">
              Agregar correo autorizado
            </h2>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_150px]">
              <Input
                id="new-allowlist-email"
                label="Correo"
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="correo@dominio.com"
                type="email"
                value={newEmail}
              />
              <Select
                id="new-allowlist-role"
                label="Rol"
                onChange={(event) => setNewRole(event.target.value as AdminAllowlistRole)}
                options={roleOptions}
                value={newRole}
              />
              <div className="flex items-end">
                <Button
                  className="w-full"
                  isLoading={submitting}
                  onClick={handleAddEntry}
                  type="button"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-csp-primary">
              Lista de autorizados
            </h2>
            {loading ? (
              <p className="text-sm text-csp-black/70">Cargando autorizados...</p>
            ) : loadingError ? (
              <p className="rounded-md border border-csp-error/30 bg-csp-error/10 px-3 py-2 text-sm text-csp-error">
                {loadingError}
              </p>
            ) : !sortedEntries.length ? (
              <p className="text-sm text-csp-black/70">
                No hay correos autorizados registrados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-csp-soft text-left text-csp-black/70">
                      <th className="py-2 pr-4 font-semibold">Correo</th>
                      <th className="py-2 pr-4 font-semibold">Rol</th>
                      <th className="py-2 pr-4 font-semibold">Estado</th>
                      <th className="py-2 pr-4 font-semibold">Actualizado</th>
                      <th className="py-2 pr-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry) => {
                      const isSelf = normalizeAdminEmail(entry.email) === actorEmail;
                      const isSavingRow = savingEntryId === entry.email;
                      const canEdit = !isSelf;

                      return (
                        <tr className="border-b border-csp-soft/60" key={entry.id}>
                          <td className="py-2 pr-4">{entry.email}</td>
                          <td className="py-2 pr-4">
                            <Select
                              className="h-9"
                              disabled={isSavingRow || !canEdit}
                              onChange={(event) =>
                                void handleRoleUpdate(
                                  entry.email,
                                  event.target.value as AdminAllowlistRole,
                                )
                              }
                              options={roleOptions}
                              value={entry.role}
                            />
                          </td>
                          <td className="py-2 pr-4">
                            {entry.active ? (
                              <span className="rounded bg-csp-accent/15 px-2 py-1 text-xs text-csp-accent">
                                Activo
                              </span>
                            ) : (
                              <span className="rounded bg-csp-error/15 px-2 py-1 text-xs text-csp-error">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-csp-black/70">
                            {formatDate(entry.updatedAt ?? entry.createdAt)}
                          </td>
                          <td className="py-2 pr-4">
                            <Button
                              disabled={!canEdit}
                              isLoading={isSavingRow}
                              onClick={() => void handleActiveUpdate(entry.email, !entry.active)}
                              type="button"
                              variant={entry.active ? "danger" : "secondary"}
                            >
                              {entry.active ? "Desactivar" : "Activar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
