import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="text-center">
      <h3 className="font-display text-lg font-semibold text-csp-primary">{title}</h3>
      <p className="mt-2 text-sm text-csp-black/70">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
