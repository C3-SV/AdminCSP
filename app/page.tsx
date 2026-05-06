import Link from "next/link";
import Image from "next/image";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { EVENT_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-16">
        <section className="w-full rounded-lg border border-csp-soft bg-csp-white p-8 text-center shadow-csp">
          <div className="mx-auto w-fit rounded-lg bg-csp-primary p-3">
            <Image
              alt="Logo CSP"
              height={140}
              priority
              src="/brands/csp-logo-square.png"
              width={140}
            />
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold text-csp-primary">
            {EVENT_NAME}
          </h1>
          <p className="mt-2 text-csp-black/70">Sitio oficial en proceso.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md bg-csp-blue px-5 text-sm font-semibold text-csp-white hover:bg-csp-primary"
              href="/inscripcion"
            >
              Ir a inscripcion
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-xs text-csp-black/60">Organiza:</span>
            <Image
              alt="Logo C3"
              height={28}
              src="/brands/c3-logo-main.png"
              style={{ width: "auto", height: "auto" }}
              width={28}
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
