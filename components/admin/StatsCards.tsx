import { Card } from "@/components/ui/Card";

type StatsCardItem = {
  label: string;
  value: number;
};

type StatsCardsProps = {
  stats: StatsCardItem[];
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="text-sm text-csp-black/70">{stat.label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-csp-primary">
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
