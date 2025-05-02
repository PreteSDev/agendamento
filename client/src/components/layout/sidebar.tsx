import { Link, useLocation } from "wouter";
import { useCopyToClipboard } from "react-use";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Business } from "@shared/schema";
import {
  Calendar,
  Home,
  Clock,
  Scissors,
  Users,
  Settings,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data: business } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Agendamentos", icon: Calendar },
    { path: "/services", label: "Serviços", icon: Scissors },
    { path: "/clients", label: "Clientes", icon: Users },
    { path: "/hours", label: "Horários", icon: Clock },
    { path: "/settings", label: "Configurações", icon: Settings },
  ];

  const handleCopyLink = () => {
    if (business?.slug) {
      const bookingUrl = `${window.location.origin}/booking/${business.slug}`;
      copyToClipboard(bookingUrl);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  return (
    <aside className="bg-gray-800 text-white w-64 flex-shrink-0 h-screen hidden md:block flex flex-col">
      <nav className="mt-5 px-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "group flex items-center px-2 py-2 text-base font-medium rounded-md mb-1",
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
      {business?.slug && (
        <div className="px-4 mt-auto mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">
              Seu link de agendamento
            </h3>
            <div className="flex items-center bg-gray-600 rounded px-2 py-1 text-sm">
              <span className="text-gray-300 truncate text-xs">
                agendafacil.com/{business.slug}
              </span>
              <button
                onClick={handleCopyLink}
                className="ml-2 text-gray-300 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
