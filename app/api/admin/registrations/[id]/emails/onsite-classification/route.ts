import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { sendOnsiteClassificationAsAdmin } from "@/services/admin/serverOnsiteClassification";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { operationId?: unknown; cards?: { post?: { fileName?: unknown; content?: unknown }; story?: { fileName?: unknown; content?: unknown } } };
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    if (!body.cards?.post || !body.cards?.story || typeof body.cards.post.fileName !== "string" || typeof body.cards.post.content !== "string" || typeof body.cards.story.fileName !== "string" || typeof body.cards.story.content !== "string") return NextResponse.json({ ok: false, message: "No se recibieron las dos tarjetas válidas." }, { status: 400 });
    const admin = await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, ...(await sendOnsiteClassificationAsAdmin({ id, operationId: body.operationId, updatedBy: admin.email, cardAttachments: { post: body.cards.post as { fileName: string; content: string }, story: body.cards.story as { fileName: string; content: string } } })) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error enviando clasificación presencial:", error);
    return NextResponse.json({ ok: false, message: "No fue posible enviar la clasificación presencial." }, { status: 500 });
  }
}
