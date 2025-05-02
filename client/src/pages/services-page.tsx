import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import ServiceCard from "@/components/services/service-card";
import ServiceForm from "@/components/services/service-form";
import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ServicesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleAddService = () => {
    setEditingService(undefined);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  return (
    <AdminLayout title="Serviços">
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleAddService}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">Carregando serviços...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEditService}
            />
          ))}

          <div
            onClick={handleAddService}
            className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer"
          >
            <div className="px-4 py-5 sm:p-6 flex items-center justify-center">
              <span className="text-gray-500">
                <Plus className="h-6 w-6" />
              </span>
              <span className="ml-3 text-gray-600 font-medium">Adicionar serviço</span>
            </div>
          </div>
        </div>
      )}

      <ServiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingService={editingService}
      />
    </AdminLayout>
  );
}
