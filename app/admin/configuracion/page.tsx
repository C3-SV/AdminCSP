import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Card } from "@/components/ui/Card";
import {
  EVENT_NAME,
  ONLINE_PHASE_DATE,
  SCHOOL_PRESENTIAL_DATE,
  UNIVERSITY_PRESENTIAL_DATE,
} from "@/lib/constants";
import { firebaseConfigDiagnostics, isFirebaseConfigured } from "@/lib/firebase";

export default function AdminConfiguracionPage() {
  const uploadThingConfigured = Boolean(process.env.UPLOADTHING_TOKEN);
  const diagnosticDetails = firebaseConfigDiagnostics.invalidEnvKeys.length
    ? `Variables pendientes/placeholder: ${firebaseConfigDiagnostics.invalidEnvKeys.join(", ")}`
    : "";

  return (
    <div className="space-y-4">
      <AdminTopbar
        subtitle="Estado de configuración del módulo y próximos pasos."
        title="Configuración"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Información del evento
          </h2>
          <p className="text-sm text-csp-black/80">{EVENT_NAME}</p>
          <p className="text-sm text-csp-black/70">
            Fase en línea: {ONLINE_PHASE_DATE}
          </p>
          <p className="text-sm text-csp-black/70">
            Fase presencial colegios: {SCHOOL_PRESENTIAL_DATE}
          </p>
          <p className="text-sm text-csp-black/70">
            Fase presencial universidades: {UNIVERSITY_PRESENTIAL_DATE}
          </p>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Firebase
          </h2>
          <p className="text-sm">
            <strong>Estado:</strong>{" "}
            {isFirebaseConfigured ? "Configurado" : "Pendiente configuración"}
          </p>
          <p className="text-sm">
            <strong>Firestore:</strong>{" "}
            {isFirebaseConfigured ? "Listo para uso" : "Configuración incompleta"}
          </p>
          <p className="text-sm">
            <strong>Storage:</strong>{" "}
            UploadThing
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

        <Card className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-csp-primary">
            Integraciones futuras
          </h2>
          <p className="text-sm text-csp-black/70">Email automático</p>
          <p className="text-sm text-csp-black/70">Exportación avanzada</p>
          <p className="text-sm text-csp-black/70">Autenticación admin</p>
          <p className="text-xs text-csp-black/60">
            TODO: Proteger rutas admin y revisar privacidad/permisos de documentos en
            producción.
          </p>
        </Card>
      </div>
    </div>
  );
}
