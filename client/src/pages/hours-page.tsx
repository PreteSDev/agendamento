import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import BusinessHoursForm from "@/components/hours/business-hours-form";
import { BusinessHours } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X } from "lucide-react";

export default function HoursPage() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: businessHours, isLoading } = useQuery<BusinessHours[]>({
    queryKey: ["/api/hours"],
  });

  const updateHoursMutation = useMutation({
    mutationFn: async (data: Partial<BusinessHours>) => {
      const res = await apiRequest("POST", "/api/hours", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Horários atualizados",
        description: "Os horários de funcionamento foram atualizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hours"] });
      setSelectedDay(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar os horários: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleUpdateHours = (data: Partial<BusinessHours>) => {
    updateHoursMutation.mutate(data);
  };

  const formatDayOfWeek = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTimeRange = (openTime: string, closeTime: string) => {
    return `${openTime} - ${closeTime}`;
  };

  // Sort days of week in correct order
  const sortDays = (days: BusinessHours[]) => {
    const dayOrder = [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ];
    return [...days].sort(
      (a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    );
  };

  return (
    <AdminLayout title="Horários de Funcionamento">
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurar Horários</CardTitle>
            <CardDescription>
              Defina os horários de funcionamento do seu negócio para cada dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                Carregando horários...
              </div>
            ) : businessHours && businessHours.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortDays(businessHours).map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell className="font-medium">
                        {formatDayOfWeek(hour.dayOfWeek)}
                      </TableCell>
                      <TableCell>
                        {hour.isOpen ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="mr-1 h-3 w-3" /> Aberto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <X className="mr-1 h-3 w-3" /> Fechado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hour.isOpen
                          ? formatTimeRange(hour.openTime, hour.closeTime)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          className="text-primary hover:text-primary/80"
                          onClick={() => setSelectedDay(hour.dayOfWeek)}
                        >
                          Editar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Nenhum horário configurado
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dicas de Funcionamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Configure seus horários corretamente</h4>
                  <p className="text-sm text-gray-500">
                    Definir seus horários de funcionamento ajuda seus clientes a
                    saberem quando podem agendar. Horários precisos evitam
                    cancelamentos e aumentam a satisfação.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Intervalos entre agendamentos</h4>
                  <p className="text-sm text-gray-500">
                    Nosso sistema evita automaticamente conflitos de agendamento,
                    garantindo que você tenha tempo suficiente entre atendimentos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BusinessHoursForm
        open={!!selectedDay}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        day={selectedDay}
        hours={businessHours?.find((hour) => hour.dayOfWeek === selectedDay)}
        onSubmit={handleUpdateHours}
      />
    </AdminLayout>
  );
}
