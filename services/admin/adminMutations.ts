import type { CompetitiveActionKey } from "@/lib/admin/competitiveActions";
import type { EmailLog } from "@/types/admin/email";
import type { RegistrationDocument, RegistrationStatus } from "@/types/admin/registration";

type FirebaseSessionUser = {
  getIdToken: () => Promise<string>;
};

type ApiResponse = {
  ok: boolean;
  message?: string;
  registration?: RegistrationDocument;
  logs?: EmailLog[];
  log?: EmailLog;
  deliveryMode?: "live" | "dry_run";
};

async function authorizedRequest(
  user: FirebaseSessionUser | null,
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse> {
  if (!user) {
    throw new Error("Tu sesión administrativa no está disponible. Inicia sesión nuevamente.");
  }
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok || !body.ok) throw new Error(body.message || "No fue posible completar la operación.");
  return body;
}

async function requestAdminMutation(
  user: FirebaseSessionUser | null,
  path: string,
  init: RequestInit,
): Promise<RegistrationDocument> {
  const body = await authorizedRequest(user, path, init);
  if (!body.registration) throw new Error("No se recibió la inscripción actualizada.");
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
    { method: "POST", body: JSON.stringify({ action, operationId }) },
  );
}

export async function getRegistrationEmailHistory({
  user,
  id,
}: {
  user: FirebaseSessionUser | null;
  id: string;
}) {
  const body = await authorizedRequest(user, `/api/admin/registrations/${encodeURIComponent(id)}/emails`);
  return { logs: body.logs ?? [], deliveryMode: body.deliveryMode ?? "dry_run" };
}

export async function getAdminEmailHistory({ user }: { user: FirebaseSessionUser | null }) {
  const body = await authorizedRequest(user, "/api/admin/emails");
  return body.logs ?? [];
}

export async function sendVirtualInstructions({
  user,
  id,
  operationId,
  card,
}: {
  user: FirebaseSessionUser | null;
  id: string;
  operationId: string;
  card: { fileName: string; content: string };
}) {
  const body = await authorizedRequest(
    user,
    `/api/admin/registrations/${encodeURIComponent(id)}/emails/virtual-instructions`,
    { method: "POST", body: JSON.stringify({ operationId, card }) },
  );
  if (!body.registration) throw new Error("No se recibió la inscripción actualizada.");
  return { registration: body.registration, log: body.log };
}
