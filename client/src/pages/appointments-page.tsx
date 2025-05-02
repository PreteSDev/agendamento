import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminLayout from "@/components/layout/admin-layout";
import CalendarView from "@/components/calendar/calendar-view";
import { AppointmentWithClientAndService } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Calendar, Clock, User, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AppointmentsPage() {
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithClientAndService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<AppointmentWithClientAndService[]>({
    queryKey: ["/api/appointments"],
  });

  const markAsCompletedMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/appointments/${appointmentId}`,
        { status: "completed" }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento concluído",
        description: "O status do agendamento foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o agendamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/appointments/${appointmentId}`,
        { status: "cancelled" }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsCancelDialogOpen(false);
      setIsDetailsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível cancelar o agendamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (appointment: AppointmentWithClientAndService) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleCancelAppointment = () => {
    if (selectedAppointment) {
      cancelAppointmentMutation.mutate(selectedAppointment.id);
    }
  };

  const handleMarkAsCompleted = () => {
    if (selectedAppointment) {
      markAsCompletedMutation.mutate(selectedAppointment.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmado</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Agendamentos">
      <div className="mt-6">
        <CalendarView
          mode={calendarMode}
          onModeChange={setCalendarMode}
        />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lista de Agendamentos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os seus agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">Carregando agendamentos...</div>
            ) : appointments && appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.client.name}</TableCell>
                        <TableCell>{appointment.service.name}</TableCell>
                        <TableCell>
                          {format(new Date(appointment.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Abrir menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(appointment)}
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                              {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    markAsCompletedMutation.mutate(appointment.id);
                                  }}
                                >
                                  Marcar como concluído
                                </DropdownMenuItem>
                              )}
                              {appointment.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setIsCancelDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  Cancelar agendamento
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Nenhum agendamento encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Cliente</h4>
                  <p>{selectedAppointment.client.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAppointment.client.phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedAppointment.client.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Scissors className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Serviço</h4>
                  <p>{selectedAppointment.service.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAppointment.service.duration} minutos - R${" "}
                    {selectedAppointment.service.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Data</h4>
                  <p>
                    {format(
                      new Date(selectedAppointment.date),
                      "EEEE, dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Horário</h4>
                  <p>{selectedAppointment.time}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Observações</h4>
                    <p>{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 text-gray-500 mt-0.5 flex items-center justify-center">
                  <span className="block h-2 w-2 rounded-full bg-gray-500"></span>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <div>{getStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            {selectedAppointment &&
              selectedAppointment.status !== "completed" &&
              selectedAppointment.status !== "cancelled" && (
                <Button
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="text-red-600"
                >
                  Cancelar
                </Button>
              )}
            <div className="flex space-x-2">
              {selectedAppointment &&
                selectedAppointment.status !== "completed" &&
                selectedAppointment.status !== "cancelled" && (
                  <Button onClick={handleMarkAsCompleted}>
                    Marcar como Concluído
                  </Button>
                )}
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter agendamento</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
