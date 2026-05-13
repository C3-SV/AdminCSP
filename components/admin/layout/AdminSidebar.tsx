"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { Button } from "@/components/ui/Button";
import { ADMIN_ROUTES } from "@/lib/admin/routes";
import { cn } from "@/utils/admin";

const navItems = [
  { href: ADMIN_ROUTES.root, label: "Resumen" },
  { href: ADMIN_ROUTES.inscripciones, label: "Inscripciones" },
  { href: ADMIN_ROUTES.estadisticas, label: "Estadísticas" },
  { href: ADMIN_ROUTES.autorizados, label: "Autorizados" },
  { href: ADMIN_ROUTES.configuracion, label: "Configuración" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, adminProfile } = useAdminAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      router.replace(ADMIN_ROUTES.root);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-csp-soft bg-csp-white p-4 md:w-64">
      <div className="flex items-center gap-3 border-b border-csp-soft pb-4">
        <div className="rounded-md bg-csp-primary p-1">
          <Image alt="Logo CSP" height={40} src="/brands/csp-logo-square.png" width={40} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-csp-primary">
            Panel Admin
          </p>
          <p className="text-xs text-csp-black/70">CSP 2026</p>
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== ADMIN_ROUTES.root && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-csp-soft text-csp-primary"
                  : "text-csp-black/80 hover:bg-csp-soft/70",
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-md bg-csp-soft/70 px-3 py-2 text-xs text-csp-black/70">
        <p className="font-semibold text-csp-primary">Sesión</p>
        <p className="truncate">{adminProfile?.email ?? "Sin correo"}</p>
        <p>Rol: {adminProfile?.role ?? "-"}</p>
      </div>

      <div className="mt-auto border-t border-csp-soft pt-4">
        <Button
          className="mb-3 w-full"
          isLoading={isSigningOut}
          onClick={handleLogout}
          type="button"
          variant="secondary"
        >
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
