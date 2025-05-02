import { cn } from "@/lib/utils";

type BookingStepsProps = {
  activeStep: number;
};

type Step = {
  id: number;
  name: string;
};

const steps: Step[] = [
  { id: 1, name: "Serviço" },
  { id: 2, name: "Data e Hora" },
  { id: 3, name: "Seus Dados" },
  { id: 4, name: "Confirmação" }
];

export default function BookingSteps({ activeStep }: BookingStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center w-full">
            {/* Connecting line */}
            {index > 0 && (
              <div
                className={cn(
                  "w-full h-0.5 mb-4",
                  activeStep >= step.id ? "bg-primary" : "bg-gray-200"
                )}
              />
            )}
            
            {/* Step circles with number */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                  activeStep >= step.id
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {step.id}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs md:text-sm font-medium",
                  activeStep >= step.id ? "text-gray-900" : "text-gray-500"
                )}
              >
                {step.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
