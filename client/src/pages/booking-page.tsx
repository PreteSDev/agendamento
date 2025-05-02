import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Business, Service, BusinessHours } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BookingSteps from "@/components/booking/booking-steps";
import ServiceSelection from "@/components/booking/service-selection";
import DateTimeSelection from "@/components/booking/date-time-selection";
import ClientForm, { ClientFormValues } from "@/components/booking/client-form";
import BookingConfirmation from "@/components/booking/booking-confirmation";
import BookingSuccess from "@/components/booking/booking-success";

export default function BookingPage() {
  const { businessSlug } = useParams();
  const [_, navigate] = useLocation();
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientFormValues | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  const { data: business, isLoading: isLoadingBusiness } = useQuery<Business>({
    queryKey: [`/api/business/${businessSlug}`],
    enabled: !!businessSlug,
  });

  // Redirect if business not found
  useEffect(() => {
    if (!isLoadingBusiness && !business) {
      navigate("/not-found");
    }
  }, [business, isLoadingBusiness, navigate]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleClientDataSubmit = (data: ClientFormValues) => {
    setClientData(data);
    setStep(4); // Move to confirmation step
  };

  const handleConfirmBooking = () => {
    setIsBooked(true);
    setStep(5); // Move to success step
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  if (isLoadingBusiness) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return null; // Will redirect through the useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary py-6 px-4 sm:px-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white">
            Agendar no {business.name}
          </h2>
          {step > 1 && !isBooked && (
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => setStep(1)} // Reset to first step
            >
              Recomeçar
            </Button>
          )}
        </div>
      </header>
      
      <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
        {!isBooked ? (
          <>
            <BookingSteps activeStep={step} />
            
            {step === 1 && (
              <ServiceSelection
                onServiceSelect={handleServiceSelect}
                onNext={handleNext}
                businessId={business.id}
                selectedServiceId={selectedService?.id}
              />
            )}
            
            {step === 2 && selectedService && (
              <DateTimeSelection
                onDateTimeSelect={handleDateTimeSelect}
                onPrevious={handlePrevious}
                onNext={handleNext}
                businessId={business.id}
                selectedService={selectedService}
                selectedDate={selectedDate || undefined}
                selectedTime={selectedTime || undefined}
              />
            )}
            
            {step === 3 && (
              <ClientForm
                onClientDataSubmit={handleClientDataSubmit}
                onPrevious={handlePrevious}
                defaultValues={clientData || undefined}
              />
            )}
            
            {step === 4 && selectedService && selectedDate && selectedTime && clientData && (
              <BookingConfirmation
                business={business}
                service={selectedService}
                date={selectedDate}
                time={selectedTime}
                clientData={clientData}
                onPrevious={handlePrevious}
                onConfirm={handleConfirmBooking}
              />
            )}
          </>
        ) : (
          <BookingSuccess
            business={business}
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            clientName={clientData?.name}
          />
        )}
      </main>
      
      <footer className="border-t bg-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} AgendaFácil. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-primary">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary">
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
