import { NextResponse } from "next/server";
import { isVirtualCardDebugEnabled, generateVirtualParticipationCard } from "@/lib/cards/virtualParticipationCard";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isVirtualCardDebugEnabled()) {
      return NextResponse.json({ ok: false, message: "La depuración de tarjetas no está habilitada." }, { status: 404 });
    }
    await requireAuthorizedAdmin(request);
    const { id } = await context.params;
    const snapshot = await getAdminDb().collection("registrations").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, message: "No se encontró una inscripción real." }, { status: 404 });
    }
    const card = await generateVirtualParticipationCard(
      mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {}),
      { debug: true },
    );
    return new NextResponse(new Uint8Array(card.buffer), {
      headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="${card.fileName}"` },
    });
  } catch (error) {
    const status = error instanceof AdminAuthorizationError ? error.status : 422;
    const message = error instanceof Error ? error.message : "No fue posible generar la tarjeta.";
    return NextResponse.json({ ok: false, message }, { status });
  }
}
