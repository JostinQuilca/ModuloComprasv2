"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
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

  const action = isEditMode ? updateProveedor.bind(null, proveedor.cedula_ruc) : addProveedor;
  const [state, formAction] = useFormState(action, { success: false, message: "" });
  
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: isEditMode ? "Update Successful" : "Creation Successful", description: state.message });
        setIsOpen(false);
      } else {
        toast({ title: "Error", description: state.message, variant: "destructive" });
      }
    }
  }, [state, toast, isEditMode, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of the existing supplier." : "Enter the details for the new supplier."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form action={formAction} className="space-y-4">
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier Inc." {...field} />
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
                    <Input placeholder="contact@supplier.com" {...field} />
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
                      <FormLabel>Phone</FormLabel>
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
                      <FormLabel>City</FormLabel>
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
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
                      <FormLabel>Supplier Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                      <FormLabel>Active</FormLabel>
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? "Save Changes" : "Create Supplier"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
