import { NextResponse } from "next/server";
import { isCompetitiveActionKey } from "@/lib/admin/competitiveActions";
import { requireAuthorizedAdmin, AdminAuthorizationError } from "@/lib/admin/serverAuth";
import { applyCompetitiveActionAsAdmin, AdminMutationError } from "@/services/admin/serverRegistrationActions";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  console.error("Error aplicando acción competitiva:", error);
  return NextResponse.json(
    { ok: false, message: "No fue posible actualizar la fase competitiva." },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: unknown; operationId?: unknown };
    if (!isCompetitiveActionKey(body.action)) {
      return NextResponse.json({ ok: false, message: "Acción competitiva inválida." }, { status: 400 });
    }
    if (
      typeof body.operationId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)
    ) {
      return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    }

    const admin = await requireAuthorizedAdmin(request);
    const result = await applyCompetitiveActionAsAdmin({
      id,
      action: body.action,
      operationId: body.operationId,
      updatedBy: admin.email,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
