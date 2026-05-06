"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/inscripciones", label: "Inscripciones" },
  { href: "/admin/estadisticas", label: "Estadísticas" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-csp-soft bg-csp-white p-4 md:flex md:flex-col">
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
            (item.href !== "/admin" && pathname.startsWith(item.href));

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
      <div className="mt-auto border-t border-csp-soft pt-4">
        <p className="mb-2 text-xs text-csp-black/60">C3</p>
        <Image
          alt="Logo C3 fondo azul"
          className="rounded-md"
          height={44}
          src="/brands/c3-logo-blue-bg.png"
          width={44}
        />
      </div>
    </aside>
  );
}
