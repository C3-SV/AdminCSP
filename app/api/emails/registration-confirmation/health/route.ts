import { NextResponse } from "next/server";
import {
  getAllowedOrigins,
  getRegistrationConfirmationHealthFlags,
} from "@/lib/email/registrationConfirmationDiagnostics";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function isOriginAllowed(origin: string | null) {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(body: Record<string, unknown>, status: number, origin: string | null) {
  return NextResponse.json(body, {
    status,
    headers: getCorsHeaders(origin),
  });
}

function isProductionEnvironment() {
  return process.env.VERCEL_ENV === "production";
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ ok: false, message: "Origin not allowed." }, 403, origin);
  }

  if (!isProductionEnvironment()) {
    return jsonResponse({ ok: false, message: "Not found." }, 404, origin);
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ ok: false, message: "Origin not allowed." }, 403, origin);
  }

  if (!isProductionEnvironment()) {
    return jsonResponse({ ok: false, message: "Not found." }, 404, origin);
  }

  const base = getRegistrationConfirmationHealthFlags();

  let firebaseAdminReady = base.firebaseAdminReady;
  if (firebaseAdminReady) {
    try {
      getAdminDb();
    } catch {
      firebaseAdminReady = false;
    }
  }

  const body = {
    ok: base.originsConfigured && firebaseAdminReady && base.brevoConfigReady && base.templateIdValid,
    originsConfigured: base.originsConfigured,
    firebaseAdminReady,
    brevoConfigReady: base.brevoConfigReady,
    templateIdValid: base.templateIdValid,
  };

  return jsonResponse(body, 200, origin);
}
