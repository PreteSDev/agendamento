import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
};

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user } = useAuth();
  const isMobile = useMobile();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex">
        {isMobile ? (
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="fixed bottom-4 right-4 z-10 rounded-full shadow-lg"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Sidebar />
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
