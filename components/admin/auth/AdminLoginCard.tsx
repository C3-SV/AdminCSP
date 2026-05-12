"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export function AdminLoginCard() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? "No se pudo iniciar sesion. Verifica correo y contrasena."
          : "No se pudo iniciar sesion.",
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
          Inicia sesion para gestionar las inscripciones de la Copa Salvadoreña de
          Programación 2026.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="admin-email"
          label="Correo"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <Input
          id="admin-password"
          label="Contrasena"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        {error ? (
          <p className="rounded-md border border-csp-error/30 bg-csp-error/10 px-3 py-2 text-sm text-csp-error">
            {error}
          </p>
        ) : null}

        <Button className="w-full" isLoading={isSubmitting} type="submit">
          Iniciar sesion
        </Button>
      </form>
    </Card>
  );
}
