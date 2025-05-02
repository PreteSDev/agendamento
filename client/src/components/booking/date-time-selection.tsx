import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isWithinInterval,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Business, BusinessHours, Appointment, Service } from "@shared/schema";

type DateTimeSelectionProps = {
  onDateTimeSelect: (date: string, time: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  businessId: number;
  selectedService?: Service;
  selectedDate?: string;
  selectedTime?: string;
};

export default function DateTimeSelection({
  onDateTimeSelect,
  onPrevious,
  onNext,
  businessId,
  selectedService,
  selectedDate,
  selectedTime,
}: DateTimeSelectionProps) {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [time, setTime] = useState<string | undefined>(selectedTime);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const { data: business } = useQuery<Business>({
    queryKey: [`/api/business/${businessId}`],
  });

  const { data: businessHours } = useQuery<BusinessHours[]>({
    queryKey: [`/api/business/${businessId}/hours`],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: [
      `/api/business/${businessId}/appointments`,
      date ? format(date, "yyyy-MM-dd") : undefined,
    ],
    enabled: !!date,
  });

  // Generate available time slots for the selected date
  useEffect(() => {
    if (!date || !businessHours || !selectedService) {
      setAvailableTimes([]);
      return;
    }

    const dayOfWeek = format(date, "EEEE", { locale: ptBR }).toLowerCase();
    const hoursForDay = businessHours.find(
      (hours) => hours.dayOfWeek.toLowerCase() === dayOfWeek
    );

    if (!hoursForDay || !hoursForDay.isOpen) {
      setAvailableTimes([]);
      return;
    }

    // Parse business hours
    const openTime = hoursForDay.openTime;
    const closeTime = hoursForDay.closeTime;
    
    // Generate time slots between open and close time
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);
    
    const startDate = setMinutes(setHours(date, openHour), openMinute);
    const endDate = setMinutes(setHours(date, closeHour), closeMinute);
    
    // Time slot interval in minutes (e.g., every 30 minutes)
    const slotInterval = 30;
    const serviceDuration = selectedService.duration;
    
    const times: string[] = [];
    let currentTime = startDate;
    
    while (
      currentTime.getTime() + serviceDuration * 60000 <=
      endDate.getTime()
    ) {
      const timeString = format(currentTime, "HH:mm");
      
      // Check if the time slot conflicts with existing appointments
      const isAvailable = !appointments?.some((appointment) => {
        const appointmentStartTime = new Date(`${appointment.date}T${appointment.time}`);
        const appointmentEndTime = new Date(
          appointmentStartTime.getTime() +
            (appointment.serviceDuration || 60) * 60000
        );
        
        const slotStartTime = new Date(`${format(date, "yyyy-MM-dd")}T${timeString}`);
        const slotEndTime = new Date(
          slotStartTime.getTime() + serviceDuration * 60000
        );
        
        return (
          (slotStartTime >= appointmentStartTime &&
            slotStartTime < appointmentEndTime) ||
          (slotEndTime > appointmentStartTime &&
            slotEndTime <= appointmentEndTime) ||
          (slotStartTime <= appointmentStartTime &&
            slotEndTime >= appointmentEndTime)
        );
      });
      
      if (isAvailable) {
        times.push(timeString);
      }
      
      // Move to next slot
      currentTime = new Date(
        currentTime.getTime() + slotInterval * 60000
      );
    }
    
    setAvailableTimes(times);
  }, [date, businessHours, appointments, selectedService]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setTime(undefined); // Reset time when date changes
  };

  const handleTimeSelect = (selectedTime: string) => {
    setTime(selectedTime);
  };

  const handleContinue = () => {
    if (date && time) {
      onDateTimeSelect(format(date, "yyyy-MM-dd"), time);
      onNext();
    }
  };

  // Determine which days should be disabled based on business hours
  const isDayDisabled = (day: Date) => {
    // Disable past days
    if (day < startOfDay(new Date())) {
      return true;
    }
    
    // Disable days further than 2 months in the future
    if (day > addMonths(new Date(), 2)) {
      return true;
    }
    
    // Disable days when business is closed
    if (businessHours) {
      const dayOfWeek = format(day, "EEEE", { locale: ptBR }).toLowerCase();
      const hoursForDay = businessHours.find(
        (hours) => hours.dayOfWeek.toLowerCase() === dayOfWeek
      );
      
      return !hoursForDay || !hoursForDay.isOpen;
    }
    
    return false;
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Selecione a data e horário
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>
              Selecione uma data disponível para o agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={isDayDisabled}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horário</CardTitle>
            <CardDescription>
              {date
                ? availableTimes.length > 0
                  ? "Selecione um horário disponível"
                  : "Não há horários disponíveis nesta data"
                : "Selecione uma data primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {date && availableTimes.length > 0 ? (
              <RadioGroup
                value={time}
                onValueChange={handleTimeSelect}
                className="grid grid-cols-3 gap-2"
              >
                {availableTimes.map((timeSlot) => (
                  <div key={timeSlot}>
                    <RadioGroupItem
                      value={timeSlot}
                      id={`time-${timeSlot}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`time-${timeSlot}`}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      {timeSlot}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                {date
                  ? "Não há horários disponíveis para esta data."
                  : "Selecione uma data para ver os horários disponíveis."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Voltar
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!date || !time}
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
