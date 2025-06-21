"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export default function FacturaFormModal({ isOpen, setIsOpen, factura, proveedores }: FacturaFormModalProps) {
  const isEditMode = !!factura;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FacturaFormData>({
    resolver: zodResolver(FacturaCompraSchema),
    defaultValues: {
      proveedor_cedula_ruc: "",
      numero_factura_proveedor: "",
      fecha_emision: new Date(),
      fecha_vencimiento: null,
      tipo_pago: "Contado",
      estado: "Registrada",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (factura) {
        form.reset({
          ...factura,
          fecha_emision: parseISO(factura.fecha_emision),
          fecha_vencimiento: factura.fecha_vencimiento ? parseISO(factura.fecha_vencimiento) : null,
        });
      } else {
        form.reset({
          proveedor_cedula_ruc: "",
          numero_factura_proveedor: "",
          fecha_emision: new Date(),
          fecha_vencimiento: null,
          tipo_pago: "Contado",
          estado: "Registrada",
        });
      }
    }
  }, [factura, form, isOpen]);

  const action = isEditMode ? updateFactura.bind(null, factura.id) : addFactura;
  const [state, formAction] = useActionState(action, { success: false, message: "" });
  
  useEffect(() => {
    if (!isPending && state.message) {
      if (state.success) {
        toast({ title: isEditMode ? "Actualización Exitosa" : "Creación Exitosa", description: state.message });
        setIsOpen(false);
        if (state.redirectUrl) {
            router.push(state.redirectUrl);
        }
      } else {
        toast({ title: "Error", description: state.message, variant: "destructive" });
      }
    }
  }, [state, isPending, toast, isEditMode, setIsOpen, router]);

  const onSubmit = (data: FacturaFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    startTransition(() => formAction(formData));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Factura" : "Añadir Nueva Factura"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Actualice los detalles de la factura." : "Ingrese los detalles de la nueva factura."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {proveedores.map(p => <SelectItem key={p.cedula_ruc} value={p.cedula_ruc}>{p.nombre}</SelectItem>)}
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
             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="fecha_emision"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Emisión</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                           <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Elija una fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_vencimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                             <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Elija una fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar Cambios"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
