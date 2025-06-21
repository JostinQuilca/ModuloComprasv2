"use client";

import * as React from "react";
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Pencil, PlusCircle, Trash2 } from "lucide-react";

import type { FacturaCompra, FacturaDetalle, Producto } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import DetalleFacturaFormModal from "./detalle-factura-form-modal";
import DeleteDetalleDialog from "./delete-detalle-dialog";
import { deleteDetalle } from "@/app/detalles-factura/actions";

interface DetallesFacturaClientProps {
    factura: FacturaCompra & { nombre_proveedor: string };
    initialDetalles: FacturaDetalle[];
    productos: Producto[];
}

export default function DetallesFacturaClient({ factura, initialDetalles, productos }: DetallesFacturaClientProps) {
    const [detalles, setDetalles] = React.useState(initialDetalles);
    const [isModalOpen, setModalOpen] = React.useState(false);
    const [editingDetalle, setEditingDetalle] = React.useState<FacturaDetalle | null>(null);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deletingDetalle, setDeletingDetalle] = React.useState<FacturaDetalle | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        setDetalles(initialDetalles);
    }, [initialDetalles]);

    const handleOpenAddModal = () => {
        setEditingDetalle(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (detalle: FacturaDetalle) => {
        setEditingDetalle(detalle);
        setModalOpen(true);
    };

    const handleOpenDeleteDialog = (detalle: FacturaDetalle) => {
        setDeletingDetalle(detalle);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingDetalle) return;

        const result = await deleteDetalle(deletingDetalle.id, deletingDetalle.factura_id);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setDeleteDialogOpen(false);
        setDeletingDetalle(null);
    };
    
    return (
        <>
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-7 w-7">
                    <Link href="/facturas">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver a Facturas</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Detalles de Factura
                </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información de la Factura</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground"># Factura:</span>
                            <span>{factura.numero_factura}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Proveedor:</span>
                            <span>{factura.nombre_proveedor}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">F. Emisión:</span>
                            <span>{format(new Date(factura.fecha_emision), "dd MMM, yyyy", { locale: es })}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">F. Vencimiento:</span>
                            <span>{format(new Date(factura.fecha_vencimiento), "dd MMM, yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge variant={factura.estado === 'Pagada' ? 'default' : factura.estado === 'Pendiente' ? 'secondary' : 'destructive'}>{factura.estado}</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen Financiero</CardTitle>
                    </CardHeader>
                     <CardContent className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span>${factura.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IVA (15%):</span>
                            <span>${factura.iva.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base">
                            <span className="text-muted-foreground">Total:</span>
                            <span>${factura.total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Productos en la Factura</CardTitle>
                        <CardDescription>Lista de todos los artículos incluidos.</CardDescription>
                    </div>
                    <Button onClick={handleOpenAddModal}>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Añadir Producto
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Acciones</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Precio Unit.</TableHead>
                                <TableHead>Aplica IVA</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detalles.length > 0 ? (
                                detalles.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(d)}><Pencil className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(d)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                                        </TableCell>
                                        <TableCell>{d.nombre_producto}</TableCell>
                                        <TableCell className="text-right">{d.cantidad}</TableCell>
                                        <TableCell className="text-right">${d.precio_unitario.toFixed(2)}</TableCell>
                                        <TableCell>{d.aplica_iva ? 'Sí' : 'No'}</TableCell>
                                        <TableCell className="text-right">${d.subtotal.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${d.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No hay productos en esta factura.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DetalleFacturaFormModal
                isOpen={isModalOpen}
                setIsOpen={setModalOpen}
                detalle={editingDetalle}
                facturaId={factura.id}
                productos={productos}
            />

            <DeleteDetalleDialog
                isOpen={isDeleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                detalleInfo={deletingDetalle ? `${deletingDetalle.cantidad} x ${deletingDetalle.nombre_producto}` : ''}
            />
        </>
    );
}
