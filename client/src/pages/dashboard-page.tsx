import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import StatCard from "@/components/dashboard/stat-card";
import CalendarView from "@/components/calendar/calendar-view";
import { Calendar, UserCheck, Scissors, DollarSign } from "lucide-react";
import { Business, AppointmentWithClientAndService } from "@shared/schema";

export default function DashboardPage() {
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  const { data: business } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const { data: dashboardStats } = useQuery<{
    todayAppointments: number;
    newClients: number;
    totalServices: number;
    weeklyRevenue: number;
    percentChange: {
      clients: number;
      revenue: number;
    };
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Agendamentos Hoje"
          value={dashboardStats?.todayAppointments || 0}
          icon={<Calendar className="h-5 w-5 text-white" />}
          bgColor="bg-primary"
        />
        <StatCard
          title="Novos Clientes"
          value={dashboardStats?.newClients || 0}
          icon={<UserCheck className="h-5 w-5 text-white" />}
          bgColor="bg-secondary"
          change={
            dashboardStats?.percentChange.clients
              ? {
                  value: `${dashboardStats.percentChange.clients > 0 ? "+" : ""}${dashboardStats.percentChange.clients}%`,
                  isPositive: dashboardStats.percentChange.clients >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Serviços Oferecidos"
          value={dashboardStats?.totalServices || 0}
          icon={<Scissors className="h-5 w-5 text-white" />}
          bgColor="bg-purple-500"
        />
        <StatCard
          title="Receita Semanal"
          value={`R$ ${dashboardStats?.weeklyRevenue?.toFixed(2) || "0.00"}`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          bgColor="bg-accent"
          change={
            dashboardStats?.percentChange.revenue
              ? {
                  value: `${dashboardStats.percentChange.revenue > 0 ? "+" : ""}${dashboardStats.percentChange.revenue}%`,
                  isPositive: dashboardStats.percentChange.revenue >= 0,
                }
              : undefined
          }
        />
      </div>

      {/* Calendar Section */}
      <CalendarView
        mode={calendarMode}
        onModeChange={setCalendarMode}
      />
    </AdminLayout>
  );
}
