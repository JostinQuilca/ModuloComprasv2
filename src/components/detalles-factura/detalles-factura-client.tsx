"use client";

import * as React from "react";
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";

import type { FacturaCompra, FacturaDetalle, Producto } from "@/lib/types";

interface DetallesFacturaClientProps {
    factura: FacturaCompra & { nombre_proveedor: string };
    initialDetalles: FacturaDetalle[];
    productos: Producto[];
}

const formatUTCDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), "dd MMM, yyyy", { locale: es });
    } catch (error) {
        const simpleDate = new Date(dateString);
        if (!isNaN(simpleDate.getTime())) {
            const userTimezoneOffset = simpleDate.getTimezoneOffset() * 60000;
            return format(new Date(simpleDate.getTime() + userTimezoneOffset), "dd MMM, yyyy", { locale: es });
        }
        console.error("Invalid date string:", dateString, error);
        return 'Fecha inválida';
    }
};

const getBadgeVariant = (estado: FacturaCompra['estado']) => {
    switch (estado) {
        case 'Impresa': return 'default';
        case 'Registrada': return 'secondary';
        case 'Cancelada': return 'destructive';
        default: return 'outline';
    }
};

export default function DetallesFacturaClient({ factura, initialDetalles, productos }: DetallesFacturaClientProps) {
    const [detalles, setDetalles] = React.useState(initialDetalles);

    React.useEffect(() => {
        setDetalles(initialDetalles);
    }, [initialDetalles]);

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
                    Vista Previa de Factura
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información de la Factura</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground"># Factura Proveedor:</span>
                            <span>{factura.numero_factura_proveedor}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Proveedor:</span>
                            <span>{factura.nombre_proveedor}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">F. Emisión:</span>
                            <span>{formatUTCDate(factura.fecha_emision)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">F. Vencimiento:</span>
                            <span>{formatUTCDate(factura.fecha_vencimiento)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo de Pago:</span>
                            <span>{factura.tipo_pago}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge variant={getBadgeVariant(factura.estado)}>{factura.estado}</Badge>
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
                <CardHeader>
                    <CardTitle>Productos en la Factura</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    <TableCell colSpan={6} className="h-24 text-center">No hay productos en esta factura.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
