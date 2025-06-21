import FacturasClient from '@/components/facturas/facturas-client';
import type { FacturaCompra, Proveedor } from '@/lib/types';

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

export default async function FacturasPage() {
  const facturas = await getFacturas();
  const proveedores = await getProveedores();

  // Create a map for quick lookup
  const proveedorMap = new Map(proveedores.map(p => [p.cedula_ruc, p.nombre]));

  // Add provider name to each invoice
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
      />
    </main>
  );
}
