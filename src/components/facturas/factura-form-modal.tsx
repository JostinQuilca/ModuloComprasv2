"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import type { FacturaCompra, Proveedor } from "@/lib/types";
import { FacturaCompraSchema } from "@/lib/types";
import { addFactura, updateFactura } from "@/app/facturas/actions";

interface FacturaFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  factura: (FacturaCompra & { nombre_proveedor: string }) | null;
  proveedores: Proveedor[];
}

type FacturaFormData = z.infer<typeof FacturaCompraSchema>;

export default function FacturaFormModal({
  isOpen,
  setIsOpen,
  factura,
  proveedores,
}: FacturaFormModalProps) {
  const isEditMode = !!factura;
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();

  const form = useForm<FacturaFormData>({
    resolver: zodResolver(FacturaCompraSchema),
    defaultValues: {
      proveedor_cedula_ruc: "",
      numero_factura_proveedor: "",
      fecha_emision: new Date(),
      fecha_vencimiento: null,
      tipo_pago: "Contado",
      estado: "Registrada",
      subtotal: 0,
      iva: 0,
      total: 0,
    },
  });

  const { reset, watch } = form;
  const fechaEmision = watch("fecha_emision");

  useEffect(() => {
    if (isOpen) {
      if (factura && isEditMode) {
        reset({
          ...factura,
          fecha_emision: parseISO(factura.fecha_emision),
          fecha_vencimiento: factura.fecha_vencimiento
            ? parseISO(factura.fecha_vencimiento)
            : null,
        });
      } else {
        reset({
          proveedor_cedula_ruc: "",
          numero_factura_proveedor: "",
          fecha_emision: new Date(),
          fecha_vencimiento: null,
          tipo_pago: "Contado",
          estado: "Registrada",
          subtotal: 0,
          iva: 0,
          total: 0,
        });
      }
    }
  }, [factura, isOpen, isEditMode, reset]);

  const onSubmit = (data: FacturaFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, format(value, "yyyy-MM-dd"));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      try {
        const action = isEditMode
          ? updateFactura.bind(null, factura!.id)
          : addFactura;
        const result = await action(null, formData);

        if (result.success) {
          if (!isEditMode && result.data?.id) {
            toast({
              title: "Factura Creada",
              description: "Ahora puede añadir los detalles.",
            });
            setIsOpen(false);
            router.push(`/detalles-factura?factura_id=${result.data.id}`);
          } else {
            toast({
              title: "Actualización Exitosa",
              description: result.message,
            });
            setIsOpen(false);
          }
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error Inesperado",
          description: `Ocurrió un error guardando la factura: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Editar Encabezado de Factura"
              : "Añadir Nueva Factura"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Actualice los detalles del encabezado de la factura."
              : "Ingrese los detalles principales de la nueva factura."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="factura-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="proveedor_cedula_ruc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un proveedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.cedula_ruc} value={p.cedula_ruc}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero_factura_proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="001-001-000000123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditMode ? (
                <FormField
                  control={form.control}
                  name="fecha_emision"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Emisión</FormLabel>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elija una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value as Date}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={es}
                            formatters={{
                              formatWeekdayName: (day) =>
                                format(day, "cccccc", { locale: es })
                                  .charAt(0)
                                  .toUpperCase(),
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormItem>
                  <FormLabel>Fecha de Emisión</FormLabel>
                  <FormControl>
                    <Input
                      value={format(new Date(), "PPP", { locale: es })}
                      disabled
                      className="cursor-default"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Elija una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={{ before: fechaEmision }}
                          initialFocus
                          locale={es}
                          formatters={{
                            formatWeekdayName: (day) =>
                              format(day, "cccccc", { locale: es })
                                .charAt(0)
                                .toUpperCase(),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Contado">Contado</SelectItem>
                        <SelectItem value="Crédito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Registrada">Registrada</SelectItem>
                        <SelectItem value="Impresa">Impresa</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="factura-form" disabled={isSaving}>
            {isSaving
              ? "Guardando..."
              : isEditMode
              ? "Guardar Cambios"
              : "Crear y Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
