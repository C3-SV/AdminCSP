import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export class AdminAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
  }
}

export async function requireAuthorizedAdmin(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    throw new AdminAuthorizationError("No se recibió una sesión administrativa válida.");
  }

  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new AdminAuthorizationError("La sesión administrativa expiró o no es válida.");
  }

  const email = decodedToken.email?.trim().toLowerCase();
  if (!email) {
    throw new AdminAuthorizationError("La cuenta no tiene un correo verificable.");
  }

  const allowlistSnapshot = await getAdminDb().collection("admin_allowlist").doc(email).get();
  if (!allowlistSnapshot.exists || allowlistSnapshot.data()?.active !== true) {
    throw new AdminAuthorizationError("Tu cuenta no está autorizada para esta acción.", 403);
  }

  return { email, uid: decodedToken.uid, role: allowlistSnapshot.data()?.role === "owner" ? "owner" as const : "admin" as const };
}

export async function requireOwnerAdmin(request: Request) {
  const admin = await requireAuthorizedAdmin(request);
  if (admin.role !== "owner") throw new AdminAuthorizationError("Esta acción requiere una cuenta administradora propietaria.", 403);
  return admin;
}
