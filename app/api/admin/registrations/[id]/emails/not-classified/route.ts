import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { sendNotClassifiedAsAdmin } from "@/services/admin/serverNotClassified";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { operationId?: unknown };
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) {
      return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    }
    const admin = await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, ...(await sendNotClassifiedAsAdmin({ id, operationId: body.operationId, updatedBy: admin.email })) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error enviando correo de no clasificación:", error);
    return NextResponse.json({ ok: false, message: "No fue posible enviar el correo de no clasificación." }, { status: 500 });
  }
}
