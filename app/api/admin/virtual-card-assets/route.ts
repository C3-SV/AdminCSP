import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assetsDirectory = path.join(process.cwd(), "assets", "virtual-card");

export async function GET(request: Request) {
  try {
    await requireAuthorizedAdmin(request);
    const [template, font] = await Promise.all([
      readFile(path.join(assetsDirectory, "participacion-virtual-template.png")),
      readFile(path.join(assetsDirectory, "Poppins-SemiBold.ttf")),
    ]);
    return NextResponse.json(
      { template: template.toString("base64"), font: font.toString("base64") },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("No fue posible cargar recursos de tarjeta:", error);
    return NextResponse.json({ message: "No fue posible cargar los recursos de la tarjeta." }, { status: 500 });
  }
}
