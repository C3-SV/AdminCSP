import type { CompetitiveActionKey } from "@/lib/admin/competitiveActions";
import type { RegistrationDocument, RegistrationStatus } from "@/types/admin/registration";

type FirebaseSessionUser = {
  getIdToken: () => Promise<string>;
};

type ApiResponse = {
  ok: boolean;
  message?: string;
  registration?: RegistrationDocument;
};

async function requestAdminMutation(
  user: FirebaseSessionUser | null,
  path: string,
  init: RequestInit,
): Promise<RegistrationDocument> {
  if (!user) {
    throw new Error("Tu sesión administrativa no está disponible. Inicia sesión nuevamente.");
  }

  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok || !body.ok || !body.registration) {
    throw new Error(body.message || "No fue posible completar la actualización.");
  }
  return body.registration;
}

export function saveRegistrationStatus({
  user,
  id,
  status,
  adminNotes,
}: {
  user: FirebaseSessionUser | null;
  id: string;
  status: RegistrationStatus;
  adminNotes: string;
}) {
  return requestAdminMutation(user, `/api/admin/registrations/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNotes }),
  });
}

export function applyCompetitiveAction({
  user,
  id,
  action,
  operationId,
}: {
  user: FirebaseSessionUser | null;
  id: string;
  action: CompetitiveActionKey;
  operationId: string;
}) {
  return requestAdminMutation(
    user,
    `/api/admin/registrations/${encodeURIComponent(id)}/competitive-actions`,
    {
      method: "POST",
      body: JSON.stringify({ action, operationId }),
    },
  );
}
