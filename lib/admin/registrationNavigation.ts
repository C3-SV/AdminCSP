import { adminPath } from "@/lib/admin/routes";

export function registrationDetailHref(id: string, ids: string[], backPath: string) {
  const params = new URLSearchParams();
  if (ids.length) params.set("nav", ids.join(","));
  params.set("back", backPath);
  return adminPath(`/inscripciones/${encodeURIComponent(id)}?${params.toString()}`);
}
