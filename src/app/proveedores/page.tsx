import ProveedoresClient from '@/components/proveedores/proveedores-client';
import { getProveedores } from '@/lib/data';

export default async function ProveedoresPage() {
  const proveedores = await getProveedores();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Gestión de Proveedores</h1>
      </div>
      <ProveedoresClient initialData={proveedores} />
    </main>
  );
}
