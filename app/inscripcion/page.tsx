import { CategorySelector } from "@/components/forms/CategorySelector";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function InscripcionPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-csp-primary">
            Inscripción de equipos
          </h1>
          <p className="mt-2 text-sm text-csp-black/70">
            Selecciona la categoría para continuar el registro.
          </p>
        </div>
        <CategorySelector />
      </main>
      <PublicFooter />
    </div>
  );
}
