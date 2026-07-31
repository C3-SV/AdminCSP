import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { sendVirtualInstructionsAsAdmin } from "@/services/admin/serverVirtualInstructions";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  console.error("Error enviando indicaciones virtuales:", error);
  return NextResponse.json({ ok: false, message: "No fue posible enviar las indicaciones." }, { status: 500 });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      operationId?: unknown;
      card?: { fileName?: unknown; content?: unknown };
    };
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) {
      return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    }
    const admin = await requireAuthorizedAdmin(request);
    if (
      !body.card ||
      typeof body.card.fileName !== "string" ||
      typeof body.card.content !== "string"
    ) {
      return NextResponse.json({ ok: false, message: "No se recibió una tarjeta válida." }, { status: 400 });
    }
    const cardAttachment = { fileName: body.card.fileName, content: body.card.content };
    return NextResponse.json({
      ok: true,
      ...(await sendVirtualInstructionsAsAdmin({
        id,
        operationId: body.operationId,
        updatedBy: admin.email,
        cardAttachment,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
