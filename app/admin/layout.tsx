import { ReactNode } from "react";
import { AdminAuthGate } from "@/components/admin/auth/AdminAuthGate";
import { AdminAuthProvider } from "@/components/admin/auth/AdminAuthProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminAuthGate>{children}</AdminAuthGate>
    </AdminAuthProvider>
  );
}
