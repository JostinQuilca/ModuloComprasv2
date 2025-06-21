import ProveedoresClient from '@/components/proveedores/proveedores-client';
import { Proveedor } from '@/lib/types';

async function getProveedores(): Promise<Proveedor[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/proveedores', {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch proveedores: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

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
