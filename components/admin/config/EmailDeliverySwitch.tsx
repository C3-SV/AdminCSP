"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { Card } from "@/components/ui/Card";
import { getEmailDeliverySettings, setEmailDeliveryEnabled } from "@/services/admin/adminMutations";

type Settings = { enabled: boolean; updatedBy?: string; updatedAt?: string };

function formatUpdatedAt(value?: string) {
  if (!value) return "Sin cambios registrados";
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function EmailDeliverySwitch() {
  const { user } = useAdminAuth();
  const [settings, setSettings] = useState<Settings>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getEmailDeliverySettings({ user }).then((next) => {
      if (active) setSettings(next);
    }).catch((error) => {
      if (active) setMessage(error instanceof Error ? error.message : "No fue posible cargar el estado.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const busy = Boolean(user) && loading;

  const handleChange = async () => {
    if (!user || saving || busy) return;
    const enabled = !settings.enabled;
    setSaving(true);
    setMessage("");
    try {
      setSettings(await setEmailDeliveryEnabled({ user, enabled }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible cambiar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-3 lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-csp-primary">Envío global de correos</h2>
          <p className="text-sm text-csp-black/70">Controla todos los correos transaccionales y operativos del sistema.</p>
        </div>
        <button
          aria-checked={settings.enabled}
          aria-label={settings.enabled ? "Desactivar todos los correos" : "Activar todos los correos"}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csp-primary focus-visible:ring-offset-2 ${settings.enabled ? "bg-csp-blue" : "bg-csp-black/25"}`}
          disabled={busy || saving || !user}
          onClick={() => void handleChange()}
          role="switch"
          type="button"
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${settings.enabled ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>
      <p className={`text-sm font-semibold ${settings.enabled ? "text-csp-blue" : "text-csp-error"}`}>
        {busy ? "Cargando…" : settings.enabled ? "Correos habilitados" : "Correos bloqueados"}
      </p>
      <p className="text-xs text-csp-black/65">Último cambio: {settings.updatedBy ?? "-"} · {formatUpdatedAt(settings.updatedAt)}</p>
      {message ? <p className="rounded-md bg-csp-error/10 px-3 py-2 text-sm text-csp-error">{message}</p> : null}
      {!settings.enabled ? <p className="rounded-md bg-csp-warning/10 px-3 py-2 text-sm">Mientras esté apagado, ningún correo podrá enviarse, incluidos los de registro, indicaciones y clasificación.</p> : null}
    </Card>
  );
}
