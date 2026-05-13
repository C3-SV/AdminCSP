"use client";

import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { Card } from "@/components/ui/Card";

export function AdminAuthStatusCard() {
  const {
    user,
    adminProfile,
    loadingAuth,
    loadingAuthorization,
    isAuthorizedAdmin,
    authError,
  } = useAdminAuth();

  return (
    <Card className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-csp-primary">
        Auth admin (Google + allowlist)
      </h2>
      <p className="text-sm">
        <strong>Sesion Google:</strong> {user ? "Activa" : "Sin sesion"}
      </p>
      <p className="text-sm">
        <strong>Correo:</strong> {user?.email ?? "-"}
      </p>
      <p className="text-sm">
        <strong>Verificacion auth:</strong> {loadingAuth ? "En proceso" : "Completada"}
      </p>
      <p className="text-sm">
        <strong>Verificacion allowlist:</strong>{" "}
        {loadingAuthorization ? "En proceso" : "Completada"}
      </p>
      <p className="text-sm">
        <strong>Autorizado:</strong> {isAuthorizedAdmin ? "Si" : "No"}
      </p>
      <p className="text-sm">
        <strong>Rol:</strong> {adminProfile?.role ?? "-"}
      </p>
      {authError ? (
        <p className="rounded-md bg-csp-error/10 px-2 py-1 text-xs text-csp-error">
          {authError}
        </p>
      ) : null}
    </Card>
  );
}

