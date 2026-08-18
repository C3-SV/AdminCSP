import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireOwnerAdmin } from "@/lib/admin/serverAuth";
import { backfillDiplomaParticipation } from "@/services/admin/diplomaParticipationMigration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireOwnerAdmin(request);
    return NextResponse.json({ ok: true, ...(await backfillDiplomaParticipation(admin.email)) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error migrando participación para diplomas:", error);
    return NextResponse.json({ ok: false, message: "No fue posible completar la migración de participación." }, { status: 500 });
  }
}
