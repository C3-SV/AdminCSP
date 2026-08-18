import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import type { DiplomaPhase } from "@/lib/diplomas/teamDiplomas";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { getTeamDiplomaPreviewAsAdmin, sendTeamDiplomasAsAdmin } from "@/services/admin/serverDiplomas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPhase(value: string | null): DiplomaPhase | null {
  return value === "virtual" || value === "presencial" ? value : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const phase = getPhase(new URL(request.url).searchParams.get("phase"));
    if (!phase) return NextResponse.json({ ok: false, message: "La fase de diploma no es válida." }, { status: 400 });
    await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, ...(await getTeamDiplomaPreviewAsAdmin({ id, phase })) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error preparando vista previa de diplomas:", error);
    return NextResponse.json({ ok: false, message: "No fue posible preparar el envío de diplomas." }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { operationId?: unknown; phase?: unknown };
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) {
      return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    }
    const phase = getPhase(typeof body.phase === "string" ? body.phase : null);
    if (!phase) {
      return NextResponse.json({ ok: false, message: "La fase de diploma no es válida." }, { status: 400 });
    }
    const admin = await requireAuthorizedAdmin(request);
    return NextResponse.json({ ok: true, ...(await sendTeamDiplomasAsAdmin({ id, phase, operationId: body.operationId, updatedBy: admin.email })) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error enviando diplomas:", error);
    return NextResponse.json({ ok: false, message: "No fue posible enviar los diplomas." }, { status: 500 });
  }
}
