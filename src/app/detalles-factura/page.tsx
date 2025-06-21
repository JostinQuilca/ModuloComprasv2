import DetallesFacturaClient from '@/components/detalles-factura/detalles-factura-client';
import { getFactura, getDetalles, getProductos } from '@/lib/data';
import { notFound } from 'next/navigation';

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
