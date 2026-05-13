import { AdminAuthStatusCard } from "@/components/admin/auth/AdminAuthStatusCard";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Card } from "@/components/ui/Card";
import {
  EVENT_NAME,
  ONLINE_PHASE_DATE,
  SCHOOL_PRESENTIAL_DATE,
  UNIVERSITY_PRESENTIAL_DATE,
} from "@/constants/admin";
import { firebaseConfigDiagnostics, isFirebaseConfigured } from "@/lib/firebase";

export default function AdminConfiguracionPage() {
  const uploadThingConfigured = Boolean(process.env.UPLOADTHING_TOKEN);
  const diagnosticDetails = firebaseConfigDiagnostics.invalidEnvKeys.length
    ? `Variables pendientes/placeholder: ${firebaseConfigDiagnostics.invalidEnvKeys.join(", ")}`
    : "";

  return (
    <div className="space-y-4">
      <AdminTopbar
        subtitle="Estado de configuracion del modulo y proximos pasos."
        title="Configuracion"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Informacion del evento
          </h2>
          <p className="text-sm text-csp-black/80">{EVENT_NAME}</p>
          <p className="text-sm text-csp-black/70">Fase en linea: {ONLINE_PHASE_DATE}</p>
          <p className="text-sm text-csp-black/70">
            Fase presencial colegios: {SCHOOL_PRESENTIAL_DATE}
          </p>
          <p className="text-sm text-csp-black/70">
            Fase presencial universidades: {UNIVERSITY_PRESENTIAL_DATE}
          </p>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">Firebase</h2>
          <p className="text-sm">
            <strong>Estado:</strong>{" "}
            {isFirebaseConfigured ? "Configurado" : "Pendiente configuracion"}
          </p>
          <p className="text-sm">
            <strong>Firestore:</strong>{" "}
            {isFirebaseConfigured ? "Listo para uso" : "Configuracion incompleta"}
          </p>
          <p className="text-sm">
            <strong>Storage:</strong> UploadThing
          </p>
          {diagnosticDetails ? (
            <p className="rounded-md bg-csp-warning/10 px-2 py-1 text-xs text-csp-black/80">
              {diagnosticDetails}
            </p>
          ) : null}
          <p className="text-sm">
            <strong>UploadThing:</strong>{" "}
            {uploadThingConfigured ? "Token detectado" : "Falta UPLOADTHING_TOKEN"}
          </p>
        </Card>

        <AdminAuthStatusCard />

        <Card className="space-y-2 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Notas de seguridad
          </h2>
          <p className="text-sm text-csp-black/70">
            El acceso admin usa Google Sign-In y una allowlist en Firestore
            (`admin_allowlist`).
          </p>
          <p className="text-sm text-csp-black/70">
            Antes de endurecer reglas en produccion, crea manualmente el primer owner
            desde Firebase Console para bootstrap inicial.
          </p>
        </Card>
      </div>
    </div>
  );
}

