import FacturasClient from '@/components/facturas/facturas-client';
import type { FacturaCompra, Proveedor, Producto } from '@/lib/types';

async function getFacturas(): Promise<FacturaCompra[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/facturas', {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('No se pudieron cargar las facturas');
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getProveedores(): Promise<Proveedor[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/proveedores', {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('No se pudieron cargar los proveedores');
    }
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
        return Array.isArray(responseData) ? responseData : responseData.data || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}


export default async function FacturasPage() {
  const [facturas, proveedores, productos] = await Promise.all([
      getFacturas(),
      getProveedores(),
      getProductos(),
  ]);

  const proveedorMap = new Map(proveedores.map(p => [p.cedula_ruc, p.nombre]));

  const facturasConNombreProveedor = facturas.map(factura => ({
    ...factura,
    nombre_proveedor: proveedorMap.get(factura.proveedor_cedula_ruc) || 'Desconocido',
  }));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Gestión de Facturas</h1>
      </div>
      <FacturasClient 
        initialData={facturasConNombreProveedor} 
        proveedores={proveedores} 
        productos={productos}
      />
    </main>
  );
}