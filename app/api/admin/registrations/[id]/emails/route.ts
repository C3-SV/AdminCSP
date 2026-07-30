import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { getEmailLogsForRegistrationAsAdmin, getVirtualInstructionsDeliveryMode } from "@/services/admin/serverVirtualInstructions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  console.error("Error consultando historial de correos:", error);
  return NextResponse.json({ ok: false, message: "No fue posible cargar el historial de correos." }, { status: 500 });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await requireAuthorizedAdmin(request);
    return NextResponse.json({
      ok: true,
      logs: await getEmailLogsForRegistrationAsAdmin(id),
      deliveryMode: getVirtualInstructionsDeliveryMode(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
