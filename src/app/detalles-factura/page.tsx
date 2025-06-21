import DetallesFacturaClient from '@/components/detalles-factura/detalles-factura-client';
import type { FacturaCompra, FacturaDetalle, Producto, Proveedor } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getFactura(id: number): Promise<(FacturaCompra & {nombre_proveedor: string}) | null> {
    try {
        const res = await fetch(`https://modulocompras-production-843f.up.railway.app/api/facturas/${id}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const factura = await res.json();

        const provRes = await fetch(`https://modulocompras-production-843f.up.railway.app/api/proveedores/${factura.proveedor_id}`, { cache: 'no-store' });
        if (!provRes.ok) {
            factura.nombre_proveedor = 'Desconocido';
        } else {
            const proveedor: Proveedor = await provRes.json();
            factura.nombre_proveedor = proveedor.nombre;
        }

        return factura;

    } catch (error) {
        console.error(error);
        return null;
    }
}

async function getDetalles(): Promise<FacturaDetalle[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/detalles-factura', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('No se pudieron cargar los detalles de factura');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getProductos(): Promise<Producto[]> {
    try {
        const res = await fetch('https://adapi-production-16e6.up.railway.app/api/v1/productos/', {
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('No se pudieron cargar los productos');
        const responseData = await res.json();
        // API could return { data: [...] } or just [...]
        return Array.isArray(responseData) ? responseData : responseData.data || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}


export default async function DetallesFacturaPage({ searchParams }: { searchParams: { factura_id?: string } }) {
  const facturaId = searchParams.factura_id ? parseInt(searchParams.factura_id, 10) : null;

  if (!facturaId || isNaN(facturaId)) {
    return notFound();
  }

  const [factura, todosLosDetalles, productos] = await Promise.all([
    getFactura(facturaId),
    getDetalles(),
    getProductos()
  ]);

  if (!factura) {
    return notFound();
  }

  const detallesDeEstaFactura = todosLosDetalles.filter(d => d.factura_id === facturaId);
  const productoMap = new Map(productos.map(p => [p.id_producto, p.nombre]));

  const detallesConNombres = detallesDeEstaFactura.map(detalle => ({
      ...detalle,
      nombre_producto: productoMap.get(detalle.producto_id) || 'Producto no encontrado'
  }));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DetallesFacturaClient 
        factura={factura} 
        initialDetalles={detallesConNombres} 
        productos={productos}
      />
    </main>
  );
}
