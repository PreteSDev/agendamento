import { useState } from "react";
import { Service } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ServiceCardProps = {
  service: Service;
  onEdit: (service: Service) => void;
};

export default function ServiceCard({ service, onEdit }: ServiceCardProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteServiceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/services/${service.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível remover o serviço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteServiceMutation.mutate();
  };

  // Determine icon class and color based on service type
  let iconClass = "fas fa-cut";
  let bgColorClass = "bg-primary";

  if (service.name.toLowerCase().includes("color") || service.name.toLowerCase().includes("pintura")) {
    iconClass = "fas fa-palette";
    bgColorClass = "bg-secondary";
  } else if (service.name.toLowerCase().includes("barba")) {
    iconClass = "fas fa-user-alt";
    bgColorClass = "bg-blue-500";
  } else if (service.name.toLowerCase().includes("escova") || service.name.toLowerCase().includes("brush")) {
    iconClass = "fas fa-air-freshener";
    bgColorClass = "bg-accent";
  } else if (service.name.toLowerCase().includes("manicure") || service.name.toLowerCase().includes("unha")) {
    iconClass = "fas fa-hand-sparkles";
    bgColorClass = "bg-purple-500";
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bgColorClass} rounded-md p-3`}>
            <i className={`${iconClass} text-white`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
            <p className="mt-1 text-sm text-gray-500">Duração: {service.duration} minutos</p>
          </div>
          <span className="inline-flex text-lg font-medium text-gray-900">
            R$ {service.price.toFixed(2)}
          </span>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="text-sm text-primary hover:text-indigo-700 mr-4"
            onClick={() => onEdit(service)}
          >
            Editar
          </button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <button
                className="text-sm text-red-500 hover:text-red-700"
                disabled={deleteServiceMutation.isPending}
              >
                Remover
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Serviço</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o serviço "{service.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
