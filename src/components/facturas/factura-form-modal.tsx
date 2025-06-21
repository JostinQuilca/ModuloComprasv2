"use client";

import { useEffect, useActionState, useTransition, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
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
import type { FacturaCompra, Proveedor, Producto, FacturaDetalle } from "@/lib/types";
import { FacturaCompraSchema, FacturaDetalleSchema } from "@/lib/types";
import { addFactura, updateFactura, type ActionResponse as FacturaActionResponse } from "@/app/facturas/actions";
import { addDetalle } from "@/app/detalles-factura/actions";
import { Combobox } from "../ui/combobox";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Switch } from "../ui/switch";
import { Label } from "@/components/ui/label";

interface FacturaFormModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  factura: (FacturaCompra & { nombre_proveedor: string }) | null;
  proveedores: Proveedor[];
  productos: Producto[];
}

type FacturaFormData = z.infer<typeof FacturaCompraSchema>;
type TempDetalle = Omit<FacturaDetalle, 'id' | 'factura_id' | 'nombre_producto'> & {
    producto_id: number;
    nombre_producto: string;
};

const IVA_RATE = 0.15;

export default function FacturaFormModal({ isOpen, setIsOpen, factura, proveedores, productos }: FacturaFormModalProps) {
  const isEditMode = !!factura;
  const { toast } = useToast();
  const [isSaving, startTransition] = useTransition();
  const router = useRouter();

  const [detalles, setDetalles] = useState<TempDetalle[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [appliesIva, setAppliesIva] = useState(false);

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

  const productOptions = productos.map(p => ({
    value: String(p.id_producto),
    label: `[${p.codigo}] ${p.nombre}`
  }));

  useEffect(() => {
    if (isOpen) {
      // Reset details when opening
      setDetalles([]);
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

  useEffect(() => {
    if (selectedProduct) {
      const product = productos.find(p => String(p.id_producto) === selectedProduct);
      if (product) {
        setPrice(parseFloat(product.precio_unitario));
      }
    } else {
      setPrice(0);
    }
  }, [selectedProduct, productos]);

  const handleAddDetalle = () => {
    if (!selectedProduct || quantity <= 0 || price < 0) {
      toast({ title: "Error", description: "Por favor, complete los detalles del producto.", variant: "destructive"});
      return;
    }

    const product = productos.find(p => String(p.id_producto) === selectedProduct);
    if (!product) {
      toast({ title: "Error", description: "Producto no encontrado.", variant: "destructive"});
      return;
    }

    const subtotal = quantity * price;
    const iva = appliesIva ? subtotal * IVA_RATE : 0;
    const total = subtotal + iva;

    const nuevoDetalle: TempDetalle = {
      producto_id: product.id_producto,
      nombre_producto: product.nombre,
      cantidad,
      precio_unitario: price,
      aplica_iva: appliesIva,
      subtotal,
      iva,
      total,
    };
    
    setDetalles(prev => [...prev, nuevoDetalle]);

    // Reset fields
    setSelectedProduct(undefined);
    setQuantity(1);
    setPrice(0);
    setAppliesIva(false);
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };


  const onSubmit = (data: FacturaFormData) => {
    startTransition(async () => {
      const headerFormData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof Date) {
          headerFormData.append(key, value.toISOString());
        } else if (value !== null && value !== undefined) {
          headerFormData.append(key, String(value));
        }
      });
      
      if (isEditMode) {
        const result = await updateFactura(factura.id, null, headerFormData);
        if (result.success) {
          toast({ title: "Actualización Exitosa", description: result.message });
          setIsOpen(false);
        } else {
          toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        router.refresh();
        return;
      }

      // --- Create Mode ---
      if (detalles.length === 0) {
        toast({ title: "Error", description: "Debe añadir al menos un producto a la factura.", variant: "destructive"});
        return;
      }
      
      const headerResult: FacturaActionResponse = await addFactura(null, headerFormData);

      if (!headerResult.success || !headerResult.factura?.id) {
          toast({ title: "Error al crear factura", description: headerResult.message, variant: "destructive" });
          return;
      }
      
      const newFacturaId = headerResult.factura.id;
      
      const detailPromises = detalles.map(detalle => {
        const detailFormData = new FormData();
        Object.entries(detalle).forEach(([key, value]) => {
           if (value !== null && value !== undefined) {
                if (key === 'aplica_iva') {
                    if (value === true) detailFormData.append(key, 'on');
                } else {
                    detailFormData.append(key, String(value));
                }
           }
        });
        detailFormData.append('factura_id', String(newFacturaId));
        return addDetalle(null, detailFormData);
      });

      const detailResults = await Promise.all(detailPromises);
      const failedDetails = detailResults.filter(r => !r.success);

      if (failedDetails.length > 0) {
          toast({
              title: "Factura Creada con Errores",
              description: `El encabezado se guardó, pero ${failedDetails.length} de ${detalles.length} productos no se pudieron añadir. Por favor, revise los detalles.`,
              variant: "destructive",
              duration: 5000,
          });
      } else {
          toast({ title: "Éxito", description: "Factura y detalles creados correctamente." });
      }
      
      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Factura" : "Añadir Nueva Factura"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Actualice los detalles de la factura." : "Ingrese los detalles de la nueva factura y añada los productos."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Header Form */}
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {!isEditMode && (
              <>
                <Separator className="my-6" />

                {/* Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Detalles de la Factura</h3>
                  {/* Add Detail Form */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 border rounded-lg">
                    <div className="md:col-span-2">
                       <Label>Producto</Label>
                       <Combobox
                          options={productOptions}
                          value={selectedProduct}
                          onChange={setSelectedProduct}
                          placeholder="Seleccione un producto"
                          searchPlaceholder="Buscar producto..."
                        />
                    </div>
                     <div>
                       <Label>Cantidad</Label>
                       <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1"/>
                    </div>
                     <div>
                       <Label>Precio Unit.</Label>
                       <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} step="0.01" min="0"/>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <Label>Aplica IVA</Label>
                        <Switch checked={appliesIva} onCheckedChange={setAppliesIva} />
                    </div>
                    <div>
                      <Button type="button" onClick={handleAddDetalle} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4"/> Añadir
                      </Button>
                    </div>
                  </div>

                  {/* Details Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">P. Unitario</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Aún no se han añadido productos.</TableCell>
                          </TableRow>
                        ) : (
                          detalles.map((d, index) => (
                            <TableRow key={index}>
                              <TableCell>{d.nombre_producto}</TableCell>
                              <TableCell className="text-right">{d.cantidad}</TableCell>
                              <TableCell className="text-right">${d.precio_unitario.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${d.subtotal.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">${d.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetalle(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Factura")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
