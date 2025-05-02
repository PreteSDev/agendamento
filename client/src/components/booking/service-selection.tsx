import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign } from "lucide-react";

type ServiceSelectionProps = {
  onServiceSelect: (service: Service) => void;
  onNext: () => void;
  businessId: number;
  selectedServiceId?: number;
};

export default function ServiceSelection({
  onServiceSelect,
  onNext,
  businessId,
  selectedServiceId,
}: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<number | undefined>(
    selectedServiceId
  );

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: [`/api/business/${businessId}/services`],
  });

  const handleSelectService = (serviceId: number) => {
    setSelectedService(serviceId);
    const service = services?.find((s) => s.id === serviceId);
    if (service) {
      onServiceSelect(service);
    }
  };

  const handleContinue = () => {
    if (selectedService) {
      onNext();
    }
  };

  if (isLoading) {
    return <div className="py-6">Carregando serviços...</div>;
  }

  if (!services || services.length === 0) {
    return (
      <div className="py-6">
        Este estabelecimento ainda não cadastrou serviços disponíveis.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Selecione o serviço
      </h3>

      <RadioGroup
        value={selectedService?.toString()}
        onValueChange={(value) => handleSelectService(parseInt(value))}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {services.map((service) => (
          <div
            key={service.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors
              ${
                selectedService === service.id
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 hover:border-primary hover:bg-blue-50"
              }`}
          >
            <RadioGroupItem
              value={service.id.toString()}
              id={`service-${service.id}`}
              className="sr-only"
            />
            <Label
              htmlFor={`service-${service.id}`}
              className="flex items-center cursor-pointer"
            >
              <div
                className={`h-4 w-4 rounded-full border ${
                  selectedService === service.id
                    ? "border-primary"
                    : "border-gray-300"
                } flex-shrink-0`}
              >
                {selectedService === service.id && (
                  <div className="h-2 w-2 rounded-full bg-primary m-0.5"></div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  {service.name}
                </h4>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 mr-4 flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {service.duration} min
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex items-center">
                    <DollarSign className="mr-1 h-3 w-3" />
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
                {service.description && (
                  <p className="mt-1 text-xs text-gray-500">
                    {service.description}
                  </p>
                )}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedService}
          className="flex items-center"
        >
          Continuar
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
