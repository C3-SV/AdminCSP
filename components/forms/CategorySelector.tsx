import Link from "next/link";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

export function CategorySelector() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CATEGORY_OPTIONS.map((category) => (
        <Card key={category.value} className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-csp-primary">
              {category.label}
            </h2>
            <p className="mt-1 text-sm text-csp-black/70">{category.description}</p>
          </div>
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-csp-primary px-4 text-sm font-semibold text-csp-primary transition hover:bg-csp-soft"
            href={`/inscripcion/registro?categoria=${category.value}`}
          >
            Seleccionar
          </Link>
        </Card>
      ))}
    </div>
  );
}
