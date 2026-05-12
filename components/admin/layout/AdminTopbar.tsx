import { EVENT_SHORT_NAME } from "@/constants/admin";

type AdminTopbarProps = {
  title: string;
  subtitle?: string;
};

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  return (
    <header className="mb-6 rounded-lg border border-csp-soft bg-csp-white px-4 py-4 shadow-csp">
      <p className="text-xs font-semibold uppercase tracking-wide text-csp-blue">
        {EVENT_SHORT_NAME}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-csp-primary">
        {title}
      </h1>
      {subtitle ? <p className="mt-1 text-sm text-csp-black/70">{subtitle}</p> : null}
    </header>
  );
}
