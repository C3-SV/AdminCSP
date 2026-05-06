import { REGISTRATION_STATUS_OPTIONS } from "@/lib/constants";
import { RegistrationStatus } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type AdminFiltersProps = {
  search: string;
  category: "all" | "colegios" | "universidades";
  status: "all" | RegistrationStatus;
  date: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: "all" | "colegios" | "universidades") => void;
  onStatusChange: (value: "all" | RegistrationStatus) => void;
  onDateChange: (value: string) => void;
};

export function AdminFilters({
  search,
  category,
  status,
  date,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onDateChange,
}: AdminFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-csp-soft bg-csp-white p-4 md:grid-cols-4">
      <Input
        id="filter-search"
        label="Búsqueda"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Equipo, institución, responsable..."
        value={search}
      />
      <Select
        id="filter-category"
        label="Categoría"
        onChange={(event) =>
          onCategoryChange(event.target.value as "all" | "colegios" | "universidades")
        }
        options={[
          { value: "all", label: "Todas" },
          { value: "colegios", label: "Colegios" },
          { value: "universidades", label: "Universidades" },
        ]}
        value={category}
      />
      <Select
        id="filter-status"
        label="Estado"
        onChange={(event) =>
          onStatusChange(event.target.value as "all" | RegistrationStatus)
        }
        options={[
          { value: "all", label: "Todos" },
          ...REGISTRATION_STATUS_OPTIONS,
        ]}
        value={status}
      />
      <Input
        id="filter-date"
        label="Fecha"
        onChange={(event) => onDateChange(event.target.value)}
        type="date"
        value={date}
      />
    </div>
  );
}
