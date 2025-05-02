import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { Business } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const businessFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(3, "URL personalizada deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "URL personalizada deve conter apenas letras minúsculas, números e hífens"),
  type: z.string(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  address: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "salon",
      description: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  // Update form when business data is loaded
  useState(() => {
    if (business) {
      form.reset({
        name: business.name,
        slug: business.slug,
        type: business.type,
        description: business.description || "",
        phone: business.phone || "",
        email: business.email || "",
        address: business.address || "",
      });
    }
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: BusinessFormValues) => {
      const res = await apiRequest("PATCH", "/api/business", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do seu negócio foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Não foi possível atualizar as configurações: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BusinessFormValues) => {
    updateBusinessMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const copyBookingLink = () => {
    if (business?.slug) {
      const url = `${window.location.origin}/booking/${business.slug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link de agendamento foi copiado para a área de transferência.",
      });
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Negócio</CardTitle>
            <CardDescription>
              Configure as informações básicas do seu negócio
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Negócio</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do seu negócio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Personalizada</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {window.location.origin}/booking/
                          </span>
                          <Input placeholder="sua-url" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Esta será a URL utilizada pelos seus clientes para agendar serviços
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Negócio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de negócio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="salon">Salão de Beleza</SelectItem>
                          <SelectItem value="repair_shop">Oficina Mecânica</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva seu negócio..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta descrição será exibida na página de agendamento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contato@seudominio.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Endereço completo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={updateBusinessMutation.isPending}
                >
                  {updateBusinessMutation.isPending
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link de Agendamento</CardTitle>
            <CardDescription>
              Compartilhe este link com seus clientes para que possam agendar serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={
                  business?.slug
                    ? `${window.location.origin}/booking/${business.slug}`
                    : "Configure a URL personalizada primeiro"
                }
              />
              <Button
                onClick={copyBookingLink}
                disabled={!business?.slug}
              >
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>
              Gerencie sua conta e faça logout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Sair da Conta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você será desconectado do sistema. Para entrar novamente, será necessário fazer login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
