import FacturasClient from "@/components/facturas/facturas-client";
import { getFacturas, getProveedores, getProductos } from "@/lib/data";

export default async function FacturasPage() {
  const [facturasData, proveedoresData, productosData] = await Promise.all([
    getFacturas(),
    getProveedores(),
    getProductos(),
  ]);

  const proveedorMap = new Map(
    proveedoresData.map((p) => [p.cedula_ruc, p.nombre])
  );
  const facturasConNombre = facturasData.map((factura) => ({
    ...factura,
    nombre_proveedor:
      proveedorMap.get(factura.proveedor_cedula_ruc) || "Desconocido",
  }));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">
          Gestión de Facturas
        </h1>
      </div>
      <FacturasClient
        initialFacturas={facturasConNombre}
        initialProveedores={proveedoresData}
        initialProductos={productosData}
      />
    </main>
  );
}
