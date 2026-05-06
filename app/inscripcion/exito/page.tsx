import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/Card";

type SuccessPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function ExitoPage({ searchParams }: SuccessPageProps) {
  const { id } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-12">
        <Card className="w-full text-center">
          <h1 className="font-display text-3xl font-semibold text-csp-primary">
            Inscripción enviada
          </h1>
          <p className="mt-3 text-csp-black/70">
            Tu equipo fue registrado correctamente. Pronto el comité organizador
            contactará al responsable para confirmar el proceso.
          </p>
          {id ? (
            <p className="mt-2 text-sm text-csp-black/70">
              ID de inscripción: <strong>{id}</strong>
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-csp-blue px-5 text-sm font-semibold text-csp-white hover:bg-csp-primary"
              href="/inscripcion"
            >
              Nueva inscripción
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-csp-primary px-5 text-sm font-semibold text-csp-primary hover:bg-csp-soft"
              href="/"
            >
              Volver al inicio
            </Link>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
