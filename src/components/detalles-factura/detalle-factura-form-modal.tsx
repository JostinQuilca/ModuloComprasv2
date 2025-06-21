"use client";

import { useEffect, useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { FacturaDetalle, Producto } from "@/lib/types";
import { FacturaDetalleSchema } from "@/lib/types";
import { addDetalle, updateDetalle } from "@/app/detalles-factura/actions";

interface DetalleFacturaFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  detalle: FacturaDetalle | null;
  facturaId: number;
  productos: Producto[];
}

type DetalleFormData = z.infer<typeof FacturaDetalleSchema>;

export default function DetalleFacturaFormModal({ isOpen, setIsOpen, detalle, facturaId, productos }: DetalleFacturaFormModalProps) {
  const isEditMode = !!detalle;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<DetalleFormData>({
    resolver: zodResolver(FacturaDetalleSchema),
    defaultValues: {
      factura_id: facturaId,
      producto_id: undefined,
      cantidad: 1,
      precio_unitario: 0,
      aplica_iva: false,
    },
  });

  const selectedProductId = form.watch("producto_id");

  useEffect(() => {
    if (isEditMode && detalle) {
      form.reset({
        ...detalle,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
      });
    } else {
      form.reset({
        factura_id: facturaId,
        producto_id: undefined,
        cantidad: 1,
        precio_unitario: 0,
        aplica_iva: false,
      });
    }
  }, [detalle, facturaId, form, isOpen, isEditMode]);
  
  useEffect(() => {
      if (selectedProductId && !isEditMode) {
          const product = productos.find(p => p.id_producto === selectedProductId);
          if (product) {
              form.setValue('precio_unitario', parseFloat(product.precio_unitario));
          }
      }
  }, [selectedProductId, productos, form, isEditMode]);

  const action = isEditMode ? updateDetalle.bind(null, detalle.id) : addDetalle;
  const [state, formAction] = useActionState(action, { success: false, message: "" });
  
  useEffect(() => {
    if (!isPending && state.message) {
      if (state.success) {
        toast({ title: isEditMode ? "Actualización Exitosa" : "Creación Exitosa", description: state.message });
        setIsOpen(false);
      } else {
        toast({ title: "Error", description: state.message, variant: "destructive" });
      }
    }
  }, [state, isPending, toast, isEditMode, setIsOpen]);

  const onSubmit = (data: DetalleFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'aplica_iva') {
          if (value === true) formData.append(key, 'on');
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
          <DialogTitle>{isEditMode ? "Editar Producto" : "Añadir Producto a Factura"}</DialogTitle>
           <DialogDescription>
            {isEditMode ? "Actualice los detalles del producto." : "Seleccione un producto y añada los detalles."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="producto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                   <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productos.map(p => <SelectItem key={p.id_producto} value={String(p.id_producto)}>{p.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="precio_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Unitario</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
              control={form.control}
              name="aplica_iva"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel>Aplica IVA (15%)</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
