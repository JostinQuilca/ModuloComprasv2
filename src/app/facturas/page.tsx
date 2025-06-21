
import { getFacturas, getProveedores } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import type { FacturaCompra } from '@/lib/types';

const formatUTCDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), 'dd/MM/yyyy');
    } catch (error) {
        console.error("Invalid date string:", dateString, error);
        return 'Fecha inválida';
    }
};

const getBadgeVariant = (estado: FacturaCompra['estado']) => {
    switch (estado) {
        case 'Impresa': return 'default';
        case 'Registrada': return 'secondary';
        case 'Cancelada': return 'destructive';
        case 'Pagada': return 'default';
        case 'Pendiente': return 'secondary';
        case 'Anulada': return 'destructive';
        default: return 'outline';
    }
};

const getBadgeClassName = (estado: FacturaCompra['estado']) => {
    switch (estado) {
        case 'Impresa': return 'bg-blue-100 text-blue-800';
        case 'Registrada': return 'bg-yellow-100 text-yellow-800';
        case 'Cancelada': return 'bg-red-100 text-red-800';
        case 'Pagada': return 'bg-green-100 text-green-800';
        case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
        case 'Anulada': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};


export default async function FacturasPage() {
  const [facturasData, proveedoresData] = await Promise.all([
    getFacturas(),
    getProveedores(),
  ]);

  const proveedorMap = new Map(proveedoresData.map(p => [p.cedula_ruc, p.nombre]));
  const facturasConNombre = facturasData.map(factura => ({
    ...factura,
    nombre_proveedor: proveedorMap.get(factura.proveedor_cedula_ruc) || 'Desconocido',
  }));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Gestión de Facturas (Vista Simplificada)</h1>
      </div>
       <div className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Factura Proveedor</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>F. Emisión</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasConNombre.length > 0 ? (
                facturasConNombre.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.numero_factura_proveedor}</TableCell>
                    <TableCell>{item.nombre_proveedor}</TableCell>
                    <TableCell>{formatUTCDate(item.fecha_emision)}</TableCell>
                    <TableCell className="text-right">${(item.total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(item.estado)} 
                             className={getBadgeClassName(item.estado)}>
                        {item.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No se encontraron facturas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    </main>
  );
}
