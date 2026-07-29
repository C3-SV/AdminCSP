import { NextResponse } from "next/server";
import { requireAuthorizedAdmin, AdminAuthorizationError } from "@/lib/admin/serverAuth";
import { updateRegistrationStatusAsAdmin, AdminMutationError } from "@/services/admin/serverRegistrationActions";
import { RegistrationStatus } from "@/types/admin/registration";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<RegistrationStatus>([
  "recibida",
  "en_revision",
  "aprobada",
  "rechazada",
  "pendiente_correccion",
]);

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  console.error("Error actualizando estado de inscripción:", error);
  return NextResponse.json(
    { ok: false, message: "No fue posible guardar el estado de inscripción." },
    { status: 500 },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown; adminNotes?: unknown };
    if (!VALID_STATUSES.has(body.status as RegistrationStatus)) {
      return NextResponse.json({ ok: false, message: "Estado de inscripción inválido." }, { status: 400 });
    }
    if (typeof body.adminNotes !== "string") {
      return NextResponse.json({ ok: false, message: "Las notas administrativas son inválidas." }, { status: 400 });
    }

    const admin = await requireAuthorizedAdmin(request);
    const registration = await updateRegistrationStatusAsAdmin({
      id,
      status: body.status as RegistrationStatus,
      adminNotes: body.adminNotes,
      updatedBy: admin.email,
    });
    return NextResponse.json({ ok: true, registration });
  } catch (error) {
    return errorResponse(error);
  }
}
