import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { getEmailDeliverySettings, setEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, settings: await getEmailDeliverySettings() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("No fue posible consultar el bloqueo global de correos:", error);
    return NextResponse.json({ ok: false, message: "No fue posible consultar la configuración de correos." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const body = (await request.json()) as { enabled?: unknown };
    if (typeof body.enabled !== "boolean") return NextResponse.json({ ok: false, message: "El estado de envío debe ser booleano." }, { status: 400 });
    return NextResponse.json({ ok: true, settings: await setEmailDeliveryEnabled(body.enabled, admin.email) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("No fue posible actualizar el bloqueo global de correos:", error);
    return NextResponse.json({ ok: false, message: "No fue posible actualizar la configuración de correos." }, { status: 500 });
  }
}
