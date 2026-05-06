"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLoginCard } from "@/components/auth/AdminLoginCard";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAdminAuth } from "@/components/auth/AdminAuthProvider";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/admin") {
      router.replace("/admin");
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-csp-background px-4">
        <p className="rounded-md bg-csp-white px-4 py-3 text-sm text-csp-black/70 shadow-csp">
          Cargando...
        </p>
      </div>
    );
  }

  if (!user) {
    if (pathname === "/admin") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-csp-background px-4 py-10">
          <AdminLoginCard />
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-csp-background px-4">
        <p className="rounded-md bg-csp-white px-4 py-3 text-sm text-csp-black/70 shadow-csp">
          Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-csp-background">
      <AdminSidebar />
      <main className="w-full flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
