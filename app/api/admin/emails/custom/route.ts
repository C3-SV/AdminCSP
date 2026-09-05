import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";
import { sendCustomEmailAsAdmin } from "@/services/admin/serverCustomEmail";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAuthorizedAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.operationId !== "string" || !/^[a-zA-Z0-9_-]{16,120}$/.test(body.operationId)) {
      return NextResponse.json({ ok: false, message: "Identificador de operación inválido." }, { status: 400 });
    }
    const result = await sendCustomEmailAsAdmin({
      operationId: body.operationId,
      updatedBy: admin.email,
      input: {
        to: typeof body.to === "string" ? body.to : "",
        cc: typeof body.cc === "string" ? body.cc : "",
        bcc: typeof body.bcc === "string" ? body.bcc : "",
        subject: typeof body.subject === "string" ? body.subject : "",
        content: typeof body.content === "string" ? body.content : "",
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AdminAuthorizationError || error instanceof AdminMutationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error("Error enviando correo personalizado:", error);
    return NextResponse.json({ ok: false, message: "No fue posible enviar el correo personalizado." }, { status: 500 });
  }
}
