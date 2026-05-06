import Link from "next/link";
import Image from "next/image";

export function PublicHeader() {
  return (
    <header className="border-b border-csp-white/15 bg-csp-primary">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-2.5">
        <Link className="flex items-center" href="/">
          <Image
            alt="Copa Salvadorena de Programacion"
            height={24}
            priority
            src="/brands/csp-logo-horizontal.png"
            style={{ width: "auto", height: "auto" }}
            width={122}
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-md border border-csp-white/40 px-3 py-1.5 text-xs font-semibold text-csp-white hover:bg-csp-white/10"
            href="/admin"
          >
            Acceso admin
          </Link>
        </div>
      </div>
    </header>
  );
}
