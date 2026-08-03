import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { sendOnsiteClassificationAsAdmin } from "@/services/admin/serverOnsiteClassification";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { operationId?: unknown; card?: { fileName?: unknown; content?: unknown } };
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    if (!body.card || typeof body.card.fileName !== "string" || typeof body.card.content !== "string") return NextResponse.json({ ok: false, message: "No se recibió una tarjeta válida." }, { status: 400 });
    const admin = await requireAuthorizedAdmin(request);
    const cardAttachment = { fileName: body.card.fileName, content: body.card.content };
    return NextResponse.json({ ok: true, ...(await sendOnsiteClassificationAsAdmin({ id, operationId: body.operationId, updatedBy: admin.email, cardAttachment })) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error enviando clasificación presencial:", error);
    return NextResponse.json({ ok: false, message: "No fue posible enviar la clasificación presencial." }, { status: 500 });
  }
}
