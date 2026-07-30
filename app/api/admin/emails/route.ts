import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { getAllAdminEmailLogsAsAdmin } from "@/services/admin/serverVirtualInstructions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, logs: await getAllAdminEmailLogsAsAdmin() });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error("Error consultando correos de admin:", error);
    return NextResponse.json({ ok: false, message: "No fue posible cargar los correos de admin." }, { status: 500 });
  }
}
