import { NextResponse } from "next/server";
import { LABORATORY_OPTIONS } from "@/constants/admin";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError, updateLaboratoryAssignmentAsAdmin } from "@/services/admin/serverRegistrationActions";
import type { LaboratoryAssignment } from "@/types/admin/registration";

export const runtime = "nodejs";

const LABORATORIES = new Set<LaboratoryAssignment>(LABORATORY_OPTIONS.map(({ value }) => value));

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { laboratorioAsignado?: unknown };
    if (body.laboratorioAsignado !== null && !LABORATORIES.has(body.laboratorioAsignado as LaboratoryAssignment)) {
      return NextResponse.json({ ok: false, message: "El laboratorio seleccionado no es válido." }, { status: 400 });
    }
    const admin = await requireAuthorizedAdmin(request);
    const registration = await updateLaboratoryAssignmentAsAdmin({ id, laboratorioAsignado: body.laboratorioAsignado as LaboratoryAssignment | null, updatedBy: admin.email });
    return NextResponse.json({ ok: true, registration });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    console.error("Error guardando laboratorio:", error);
    return NextResponse.json({ ok: false, message: "No fue posible guardar el laboratorio." }, { status: 500 });
  }
}
