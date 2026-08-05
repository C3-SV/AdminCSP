import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { AdminMutationError, updateRegistrationResultsAsAdmin } from "@/services/admin/serverRegistrationActions";
import { CompetitivePhase, CompetitiveStatus } from "@/types/admin/registration";

export const runtime = "nodejs";

const PHASES = new Set<CompetitivePhase>(["online", "presencial", "cerrado"]);
const STATUSES = new Set<CompetitiveStatus>([
  "pendiente",
  "clasificado",
  "no_clasificado",
]);

function validScore(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000);
}

function errorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
  }
  console.error("Error guardando resultados:", error);
  return NextResponse.json({ ok: false, message: "No fue posible guardar los resultados." }, { status: 500 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      puntajeOnline?: unknown;
      puntajePresencial?: unknown;
      faseActual?: unknown;
      estadoCompetitivo?: unknown;
    };
    if (!validScore(body.puntajeOnline) || !validScore(body.puntajePresencial)) {
      return NextResponse.json({ ok: false, message: "Los puntajes deben ser números iguales o mayores que cero." }, { status: 400 });
    }
    if (!PHASES.has(body.faseActual as CompetitivePhase) || !STATUSES.has(body.estadoCompetitivo as CompetitiveStatus)) {
      return NextResponse.json({ ok: false, message: "La fase o estado competitivo no es válido." }, { status: 400 });
    }
    const admin = await requireAuthorizedAdmin(request);
    const registration = await updateRegistrationResultsAsAdmin({
      id,
      puntajeOnline: body.puntajeOnline,
      puntajePresencial: body.puntajePresencial,
      faseActual: body.faseActual as CompetitivePhase,
      estadoCompetitivo: body.estadoCompetitivo as CompetitiveStatus,
      updatedBy: admin.email,
    });
    return NextResponse.json({ ok: true, registration });
  } catch (error) {
    return errorResponse(error);
  }
}
