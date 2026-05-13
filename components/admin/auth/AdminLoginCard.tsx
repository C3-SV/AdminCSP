"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export function AdminLoginCard() {
  const { loginWithGoogle, authError, clearAuthError } = useAdminAuth();
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setLocalError("");
    clearAuthError();
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? "No se pudo iniciar sesión con Google. Intenta nuevamente."
          : "No se pudo iniciar sesión con Google.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md space-y-5 bg-csp-white shadow-csp-lg">
      <div className="space-y-3 text-center">
        <div className="mx-auto w-fit rounded-md bg-csp-primary p-1">
          <Image alt="Logo CSP" height={40} src="/brands/csp-logo-square.png" width={40} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-csp-primary">
          Acceso administrador
        </h1>
        <p className="text-sm text-csp-black/70">
          Inicia sesión con Google para gestionar las inscripciones de la Copa
          Salvadoreña de Programación 2026.
        </p>
      </div>

      <div className="space-y-4">
        {authError ? (
          <p className="rounded-md border border-csp-error/30 bg-csp-error/10 px-3 py-2 text-sm text-csp-error">
            {authError}
          </p>
        ) : null}

        {localError ? (
          <p className="rounded-md border border-csp-error/30 bg-csp-error/10 px-3 py-2 text-sm text-csp-error">
            {localError}
          </p>
        ) : null}

        <Button className="w-full" isLoading={isSubmitting} onClick={handleGoogleLogin} type="button">
          Continuar con Google
        </Button>
      </div>
    </Card>
  );
}
