import { cn } from "@/lib/utils";

export type StepState = "default" | "valid" | "invalid";

type StepperProps = {
  steps: readonly string[];
  currentStep: number;
  stepStates: StepState[];
  onStepClick: (index: number) => void;
};

function getStateClass(stepState: StepState, isActive: boolean) {
  if (stepState === "valid") return "bg-csp-accent text-csp-white";
  if (stepState === "invalid") return "bg-csp-error text-csp-white";
  if (isActive) return "bg-csp-primary text-csp-white";
  return "bg-csp-soft text-csp-primary border border-csp-primary/25";
}

export function Stepper({
  steps,
  currentStep,
  stepStates,
  onStepClick,
}: StepperProps) {
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const state = stepStates[index] ?? "default";

          return (
            <li key={step} className="flex items-center gap-3">
              <button
                className="flex flex-col items-center gap-1"
                onClick={() => onStepClick(index)}
                type="button"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    getStateClass(state, isActive),
                  )}
                >
                  {state === "valid" ? "✓" : index + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive ? "text-csp-primary" : "text-csp-black/65",
                  )}
                >
                  {step}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <div className="h-[2px] w-8 bg-csp-neutral/30" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
