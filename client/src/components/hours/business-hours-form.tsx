import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessHours } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const dayNamesMap: Record<string, string> = {
  "domingo": "Domingo",
  "segunda-feira": "Segunda-feira",
  "terça-feira": "Terça-feira",
  "quarta-feira": "Quarta-feira",
  "quinta-feira": "Quinta-feira",
  "sexta-feira": "Sexta-feira",
  "sábado": "Sábado",
};

const formSchema = z.object({
  dayOfWeek: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato inválido. Use HH:MM",
  }),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato inválido. Use HH:MM",
  }),
}).refine((data) => {
  if (!data.isOpen) return true;
  const [openHour, openMinute] = data.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = data.closeTime.split(":").map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  return closeMinutes > openMinutes;
}, {
  message: "O horário de fechamento deve ser posterior ao horário de abertura",
  path: ["closeTime"],
});

type FormValues = z.infer<typeof formSchema>;

type BusinessHoursFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: string | null;
  hours?: BusinessHours;
  onSubmit: (data: Partial<BusinessHours>) => void;
};

export default function BusinessHoursForm({
  open,
  onOpenChange,
  day,
  hours,
  onSubmit,
}: BusinessHoursFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dayOfWeek: hours?.dayOfWeek || "",
      isOpen: hours?.isOpen ?? true,
      openTime: hours?.openTime || "09:00",
      closeTime: hours?.closeTime || "18:00",
    },
  });

  // Update form when hours change
  useState(() => {
    if (hours) {
      form.reset({
        dayOfWeek: hours.dayOfWeek,
        isOpen: hours.isOpen,
        openTime: hours.openTime,
        closeTime: hours.closeTime,
      });
    } else if (day) {
      form.reset({
        dayOfWeek: day,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      });
    }
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Editar Horário - {day ? dayNamesMap[day] : ""}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isOpen"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Aberto neste dia
                    </FormLabel>
                    <FormDescription>
                      Ative para definir este dia como aberto para agendamentos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("isOpen") && (
              <>
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Abertura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="09:00" />
                      </FormControl>
                      <FormDescription>
                        Use o formato 24h (ex: 09:00)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Fechamento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="18:00" />
                      </FormControl>
                      <FormDescription>
                        Use o formato 24h (ex: 18:00)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
