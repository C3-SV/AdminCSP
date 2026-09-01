import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
  // These files are read by Sharp at runtime. Explicit tracing keeps them in
  // Vercel's serverless functions instead of relying on filesystem inference.
  outputFileTracingIncludes: {
    "/api/admin/registrations/[id]/emails/virtual-instructions": [
      "assets/virtual-card/participacion-virtual-template.png",
      "assets/virtual-card/Poppins-SemiBold.ttf",
    ],
    "/api/admin/registrations/[id]/virtual-card-preview": [
      "assets/virtual-card/participacion-virtual-template.png",
      "assets/virtual-card/Poppins-SemiBold.ttf",
    ],
    "/api/admin/registrations/[id]/emails/diplomas": [
      "assets/diplomas/DIPLOMAS VIRTUALES CSP 2026.pdf",
      "assets/virtual-card/Poppins-SemiBold.ttf",
    ],
    "/api/admin/registrations/[id]/emails/final-instructions": [
      "assets/final-instructions/cronograma-universidades.png",
    ],
    "/api/admin/virtual-card-assets": [
      "assets/virtual-card/participacion-virtual-template.png",
      "assets/virtual-card/Poppins-SemiBold.ttf",
      "assets/competitor-card/competidor-template.png",
      "assets/onsite-card/colegios-finalista.png",
      "assets/onsite-card/universidades-finalista.png",
      "assets/onsite-card/ade-finalista.png",
      "assets/onsite-card/colegios-finalista-story.png",
      "assets/onsite-card/universidades-finalista-story.png",
      "assets/onsite-card/ade-finalista-story.png",
    ],
  },
};

export default nextConfig;
