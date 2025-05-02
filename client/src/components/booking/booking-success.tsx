import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Business, Service } from "@shared/schema";

type BookingSuccessProps = {
  business?: Business;
  service?: Service | null;
  date?: string | null;
  time?: string | null;
  clientName?: string;
};

export default function BookingSuccess({
  business,
  service,
  date,
  time,
  clientName,
}: BookingSuccessProps) {
  const formattedDate = date
    ? format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "";

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
        <p className="text-gray-600">
          Seu agendamento foi realizado com sucesso.
        </p>
      </div>

      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
          <CardDescription>
            Guarde estas informações para referência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Cliente</h4>
              <p>{clientName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Scissors className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Serviço</h4>
              <p>{service?.name}</p>
              <p className="text-sm text-gray-500">
                {service?.duration} minutos - R$ {service?.price.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Data</h4>
              <p className="capitalize">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Horário</h4>
              <p>{time}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500">
            Você receberá um email de confirmação com os detalhes do seu agendamento.
          </p>
          <div className="flex justify-center w-full">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Fazer novo agendamento
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">
          Obrigado por escolher {business?.name}
        </h3>
        <p className="text-gray-600 max-w-md">
          Estamos ansiosos para atendê-lo. Se precisar fazer alguma alteração,
          entre em contato conosco diretamente.
        </p>
      </div>
    </div>
  );
}
