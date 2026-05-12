import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin/routes";

export default function HomePage() {
  redirect(ADMIN_ROUTES.root);
}
