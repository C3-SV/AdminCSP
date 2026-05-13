"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLoginCard } from "@/components/admin/auth/AdminLoginCard";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { ADMIN_ROUTES, isAdminRootPath } from "@/lib/admin/routes";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { user, loading, isAuthorizedAdmin } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if ((!user || !isAuthorizedAdmin) && !isAdminRootPath(pathname)) {
      router.replace(ADMIN_ROUTES.root);
    }
  }, [isAuthorizedAdmin, loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-csp-background px-4">
        <p className="rounded-md bg-csp-white px-4 py-3 text-sm text-csp-black/70 shadow-csp">
          Cargando...
        </p>
      </div>
    );
  }

  if (!user || !isAuthorizedAdmin) {
    if (isAdminRootPath(pathname)) {
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
