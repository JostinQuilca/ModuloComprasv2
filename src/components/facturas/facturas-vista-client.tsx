"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { printFactura } from "@/app/facturas/actions";
import type { FacturaCompra, FacturaDetalle, Producto } from "@/lib/types";
import { Card } from "../ui/card";
import { useSearchParams } from "next/navigation";

interface FacturaVistaClientProps {
  factura: FacturaCompra & { nombre_proveedor: string };
  detalles: FacturaDetalle[];
  productos: Producto[];
}

export default function FacturaVistaClient({
  factura,
  detalles,
  productos,
}: FacturaVistaClientProps) {
  const { toast } = useToast();
  const [isPrinting, startPrinting] = useTransition();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const autoprint = searchParams.get("autoprint");
    if (autoprint === "true") {
      // Use a small timeout to allow the page to render fully before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handlePrint = () => {
    startPrinting(async () => {
      if (factura.estado !== "Impresa") {
        const result = await printFactura(factura.id);
        if (result.success) {
          toast({ title: "Estado Actualizado", description: result.message });
          window.print();
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
          return; // Stop if state update fails
        }
      } else {
        window.print();
      }
    });
  };

  const formatUTCDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return format(
        new Date(date.getTime() + userTimezoneOffset),
        "dd MMMM, yyyy",
        { locale: es }
      );
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const getBadgeVariant = (estado: FacturaCompra["estado"]) => {
    switch (estado) {
      case "Impresa":
        return "default";
      case "Registrada":
        return "secondary";
      case "Cancelada":
        return "destructive";
      default:
        return "outline";
    }
  };

  const productoMap = new Map(productos.map((p) => [p.id_producto, p.codigo]));
  const isModificationDisabled =
    factura.estado === "Impresa" || factura.estado === "Cancelada";

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-4 no-print">
          <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/facturas">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver a Facturas</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Vista de Factura
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              variant="outline"
              disabled={isPrinting || factura.estado === "Cancelada"}
            >
              {isPrinting ? "Procesando..." : "Imprimir"}
            </Button>
          </div>
        </div>

        <Card className="p-6 mt-4 printable-area">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold">FACTURA</h2>
              <p className="text-destructive font-semibold">
                {factura.numero_factura_proveedor}
              </p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-semibold">Fecha Emisión:</span>{" "}
                {formatUTCDate(factura.fecha_emision)}
              </p>
              <p>
                <span className="font-semibold">Fecha Vencimiento:</span>{" "}
                {formatUTCDate(factura.fecha_vencimiento)}
              </p>
              <Badge variant={getBadgeVariant(factura.estado)} className="mt-2">
                {factura.estado}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold border-b pb-2 mb-2">PROVEEDOR</h3>
              <p className="font-bold text-lg">{factura.nombre_proveedor}</p>
              <p>RUC/C.I.: {factura.proveedor_cedula_ruc}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalles.length > 0 ? (
                detalles.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {productoMap.get(d.producto_id) || "N/A"}
                    </TableCell>
                    <TableCell>{d.nombre_producto}</TableCell>
                    <TableCell className="text-right">{d.cantidad}</TableCell>
                    <TableCell className="text-right">
                      ${d.precio_unitario.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${d.subtotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No hay productos en esta factura.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-xs">
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">Subtotal:</span>
                <span>${factura.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">IVA (15%):</span>
                <span>${factura.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold text-primary">
                <span>Total:</span>
                <span>${factura.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-4 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold">Tipo de Pago:</span>{" "}
              {factura.tipo_pago}
            </p>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print,
          .no-print * {
            display: none !important;
          }
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 1rem;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </main>
  );
}
