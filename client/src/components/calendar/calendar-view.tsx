import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AppointmentWithClientAndService } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarViewProps = {
  mode?: "month" | "week" | "day";
  onModeChange?: (mode: "month" | "week" | "day") => void;
};

export default function CalendarView({
  mode = "month",
  onModeChange,
}: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<AppointmentWithClientAndService | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  const { data: appointments } = useQuery<AppointmentWithClientAndService[]>({
    queryKey: ["/api/appointments"],
  });

  const events = appointments?.map((appointment) => ({
    id: appointment.id,
    title: `${appointment.client.name} - ${appointment.service.name}`,
    start: new Date(`${appointment.date}T${appointment.time}`),
    end: new Date(
      new Date(`${appointment.date}T${appointment.time}`).getTime() +
        appointment.service.duration * 60000
    ),
    resource: appointment,
  })) || [];

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event.resource);
    setIsEventDetailsOpen(true);
  };

  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Agenda</h3>
          <div className="mt-3 md:mt-0 flex space-x-3">
            <Button
              variant={mode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange?.("day")}
            >
              <i className="fas fa-calendar-day mr-2"></i>
              Dia
            </Button>
            <Button
              variant={mode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange?.("week")}
            >
              <i className="fas fa-calendar-week mr-2"></i>
              Semana
            </Button>
            <Button
              variant={mode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange?.("month")}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              Mês
            </Button>
          </div>
        </div>

        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            culture="pt-BR"
            messages={{
              next: "Próximo",
              previous: "Anterior",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Evento",
              allDay: "Dia inteiro",
              noEventsInRange: "Não há eventos neste período",
            }}
            views={{
              month: true,
              week: true,
              day: true,
            }}
            view={mode}
            onView={(view) => onModeChange?.(view as "month" | "week" | "day")}
            onSelectEvent={handleEventSelect}
          />
        </div>
      </CardContent>

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações sobre o agendamento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente</p>
                <p className="text-base">{selectedEvent.client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contato</p>
                <p className="text-base">{selectedEvent.client.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Serviço</p>
                <p className="text-base">{selectedEvent.service.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data e Hora</p>
                <p className="text-base">
                  {format(new Date(selectedEvent.date), "dd/MM/yyyy")} às{" "}
                  {selectedEvent.time}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duração</p>
                <p className="text-base">{selectedEvent.service.duration} minutos</p>
              </div>
              {selectedEvent.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Observações</p>
                  <p className="text-base">{selectedEvent.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
