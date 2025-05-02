import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientFormValues } from "./client-form";
import { Business, Service } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type BookingConfirmationProps = {
  business: Business;
  service: Service;
  date: string;
  time: string;
  clientData: ClientFormValues;
  onPrevious: () => void;
  onConfirm: () => void;
};

export default function BookingConfirmation({
  business,
  service,
  date,
  time,
  clientData,
  onPrevious,
  onConfirm,
}: BookingConfirmationProps) {
  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/appointments", {
        businessId: business.id,
        serviceId: service.id,
        date,
        time,
        clientData,
      });
      return res.json();
    },
    onSuccess: () => {
      onConfirm();
    },
  });

  const handleConfirm = () => {
    createAppointmentMutation.mutate();
  };

  const formattedDate = format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Confirme seu agendamento
      </h3>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{business.name}</CardTitle>
          <CardDescription>
            Revise os detalhes do seu agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Serviço</h4>
              <p className="text-sm text-gray-900">{service.name}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Data</h4>
              <p className="text-sm text-gray-900 capitalize">{formattedDate}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Horário</h4>
              <p className="text-sm text-gray-900">{time}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Duração</h4>
              <p className="text-sm text-gray-900">{service.duration} minutos</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Preço</h4>
              <p className="text-sm font-medium text-gray-900">
                R$ {service.price.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seus Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Nome</h4>
              <p className="text-sm text-gray-900">{clientData.name}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="text-sm text-gray-900">{clientData.email}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium text-gray-500">Telefone</h4>
              <p className="text-sm text-gray-900">{clientData.phone}</p>
            </div>
          </div>
          {clientData.notes && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Observações
              </h4>
              <p className="text-sm text-gray-900">{clientData.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            Ao confirmar, você concorda com os termos de uso e política de privacidade.
          </p>
        </CardFooter>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={createAppointmentMutation.isPending}
          className="flex items-center"
        >
          {createAppointmentMutation.isPending
            ? "Processando..."
            : "Confirmar Agendamento"}
        </Button>
      </div>
    </div>
  );
}
