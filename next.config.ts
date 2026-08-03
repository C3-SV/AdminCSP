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
    "/api/admin/virtual-card-assets": [
      "assets/virtual-card/participacion-virtual-template.png",
      "assets/virtual-card/Poppins-SemiBold.ttf",
      "assets/onsite-card/colegios-finalista.png",
      "assets/onsite-card/universidades-finalista.png",
      "assets/onsite-card/ade-finalista.png",
    ],
  },
};

export default nextConfig;
