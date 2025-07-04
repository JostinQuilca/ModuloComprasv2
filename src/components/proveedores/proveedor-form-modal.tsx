"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Proveedor, ProveedorSchema } from "@/lib/types";
import { addProveedor, updateProveedor } from "@/app/proveedores/actions";

interface ProveedorFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  proveedor: Proveedor | null;
}

export default function ProveedorFormModal({ isOpen, setIsOpen, proveedor }: ProveedorFormModalProps) {
  const isEditMode = !!proveedor;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ProveedorSchema>>({
    resolver: zodResolver(ProveedorSchema),
    defaultValues: {
      cedula_ruc: "",
      nombre: "",
      ciudad: "",
      direccion: "",
      telefono: "",
      email: "",
      tipo_proveedor: "Contado",
      estado: true,
    },
  });

  useEffect(() => {
    if (proveedor) {
      form.reset(proveedor);
    } else {
      form.reset({
        cedula_ruc: "",
        nombre: "",
        ciudad: "",
        direccion: "",
        telefono: "",
        email: "",
        tipo_proveedor: "Contado",
        estado: true,
      });
    }
  }, [proveedor, form, isOpen]);

  const onSubmit = (data: z.infer<typeof ProveedorSchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'estado') {
        if (value === true) {
          formData.append(key, 'on');
        }
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const action = isEditMode ? updateProveedor.bind(null, proveedor!.cedula_ruc) : addProveedor;
      const result = await action(null, formData);

      if (result.success) {
        toast({ title: isEditMode ? "Actualización Exitosa" : "Creación Exitosa", description: result.message });
        setIsOpen(false);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Proveedor" : "Añadir Nuevo Proveedor"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Actualice los detalles del proveedor existente." : "Ingrese los detalles para el nuevo proveedor."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cedula_ruc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula/RUC</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Proveedor S.A." {...field} />
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
                    <Input placeholder="contacto@proveedor.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Quito" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Principal 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="tipo_proveedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Proveedor</FormLabel>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <FormLabel>Activo</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Proveedor")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
