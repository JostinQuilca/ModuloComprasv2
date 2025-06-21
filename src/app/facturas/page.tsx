
import FacturasClient from '@/components/facturas/facturas-client';

export default function FacturasPage() {

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Gestión de Facturas</h1>
      </div>
      <FacturasClient />
    </main>
  );
}
