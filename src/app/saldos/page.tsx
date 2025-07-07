import { getFacturas, getProveedores } from "@/lib/data";
import SaldosProveedorClient from "@/components/saldos/saldos-proveedor-client";

export default async function SaldosPage() {
  const [proveedores, facturas] = await Promise.all([
    getProveedores(),
    getFacturas(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">
          Reporte de Saldos de Proveedor
        </h1>
      </div>
      <SaldosProveedorClient proveedores={proveedores} facturas={facturas} />
    </main>
  );
}
