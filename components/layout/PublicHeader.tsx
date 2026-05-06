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
      </div>
    </header>
  );
}
