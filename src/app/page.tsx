import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProveedoresClient from '@/components/proveedores/proveedores-client';
import { Proveedor } from '@/lib/types';
import { Logo } from '@/components/icons/logo';

async function getProveedores(): Promise<Proveedor[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/proveedores', {
      cache: 'no-store', // Ensure fresh data on each request
    });
    if (!res.ok) {
      throw new Error('Failed to fetch suppliers');
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function Home() {
  const proveedores = await getProveedores();

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter text-foreground">Procuria</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <ProveedoresClient initialData={proveedores} />
      </main>
    </div>
  );
}
