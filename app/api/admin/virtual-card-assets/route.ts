import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAuthorizedAdmin } from "@/lib/admin/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const virtualAssetsDirectory = path.join(process.cwd(), "assets", "virtual-card");
const onsiteAssetsDirectory = path.join(process.cwd(), "assets", "onsite-card");

export async function GET(request: Request) {
  try {
    await requireAuthorizedAdmin(request);
    const [template, font, competitorTemplate, colegios, universidades, ade, colegiosStory, universidadesStory, adeStory] = await Promise.all([
      readFile(path.join(virtualAssetsDirectory, "participacion-virtual-template.png")),
      readFile(path.join(virtualAssetsDirectory, "Poppins-SemiBold.ttf")),
      readFile(path.join(process.cwd(), "assets", "competitor-card", "competidor-template.png")),
      readFile(path.join(onsiteAssetsDirectory, "colegios-finalista.png")),
      readFile(path.join(onsiteAssetsDirectory, "universidades-finalista.png")),
      readFile(path.join(onsiteAssetsDirectory, "ade-finalista.png")),
      readFile(path.join(onsiteAssetsDirectory, "colegios-finalista-story.png")),
      readFile(path.join(onsiteAssetsDirectory, "universidades-finalista-story.png")),
      readFile(path.join(onsiteAssetsDirectory, "ade-finalista-story.png")),
    ]);
    return NextResponse.json(
      {
        template: template.toString("base64"),
        font: font.toString("base64"),
        competitorTemplate: competitorTemplate.toString("base64"),
        onsiteTemplates: {
          colegios: colegios.toString("base64"),
          universidades: universidades.toString("base64"),
          ade: ade.toString("base64"),
        },
        onsiteStoryTemplates: {
          colegios: colegiosStory.toString("base64"),
          universidades: universidadesStory.toString("base64"),
          ade: adeStory.toString("base64"),
        },
      },
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
