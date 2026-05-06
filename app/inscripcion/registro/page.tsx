import { redirect } from "next/navigation";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RegistrationCategory } from "@/lib/types";

type RegistrationPageProps = {
  searchParams: Promise<{
    categoria?: string | string[];
  }>;
};

function parseCategory(value?: string | string[]): RegistrationCategory | null {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized === "colegios" || normalized === "universidades") {
    return normalized;
  }
  return null;
}

export default async function RegistroPage({ searchParams }: RegistrationPageProps) {
  const params = await searchParams;
  const category = parseCategory(params.categoria);

  if (!category) {
    redirect("/inscripcion");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="mb-2 font-display text-3xl font-semibold text-csp-primary">
          Formulario de inscripción
        </h1>
        <p className="mb-6 text-sm text-csp-black/70">
          Completa los 6 pasos para registrar oficialmente al equipo.
        </p>
        <RegistrationForm category={category} key={category} />
      </main>
      <PublicFooter />
    </div>
  );
}
