import Image from "next/image";
import { EVENT_NAME } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="mt-10 border-t border-csp-white/15 bg-csp-primary">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <p className="text-xs text-csp-white/85">{EVENT_NAME} - 2026</p>
        <div className="flex items-center gap-3">
          <Image
            alt="Logo CSP horizontal"
            height={22}
            src="/brands/csp-logo-horizontal.png"
            style={{ width: "auto", height: "auto" }}
            width={112}
          />
          <span className="text-csp-white/40">|</span>
          <Image
            alt="Logo C3"
            height={20}
            src="/brands/c3-logo-main.png"
            style={{ width: "auto", height: "auto" }}
            width={20}
          />
        </div>
      </div>
    </footer>
  );
}
