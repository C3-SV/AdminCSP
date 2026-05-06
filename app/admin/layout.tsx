import { ReactNode } from "react";
import { AdminAuthGate } from "@/components/auth/AdminAuthGate";
import { AdminAuthProvider } from "@/components/auth/AdminAuthProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminAuthGate>{children}</AdminAuthGate>
    </AdminAuthProvider>
  );
}
