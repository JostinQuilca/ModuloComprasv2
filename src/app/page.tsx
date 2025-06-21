import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, DollarSign, Activity } from 'lucide-react';
import { Proveedor } from "@/lib/types";
import DashboardChart from '@/components/dashboard/dashboard-chart';

async function getProveedores(): Promise<Proveedor[]> {
  try {
    const res = await fetch('https://modulocompras-production-843f.up.railway.app/api/proveedores', {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch providers');
      return [];
    }
    const data = await res.json();
    // Ensure fecha_creacion is a string for sorting
    return data.map(p => ({...p, fecha_creacion: p.fecha_creacion || new Date(0).toISOString()}));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function DashboardPage() {
  const proveedores = await getProveedores();
  const totalProveedores = proveedores.length;
  // Mock data for dashboard
  const facturasPendientes = 15;
  const totalPagado = 125340.50;
  const nuevosProveedoresMes = 5;

  const recentProveedores = proveedores
    .sort((a, b) => new Date(b.fecha_creacion!).getTime() - new Date(a.fecha_creacion!).getTime())
    .slice(0, 5);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProveedores}</div>
            <p className="text-xs text-muted-foreground">+2% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facturasPendientes}</div>
            <p className="text-xs text-muted-foreground">3 nuevas esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPagado.toLocaleString('es-EC')}</div>
            <p className="text-xs text-muted-foreground">En el último trimestre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{nuevosProveedoresMes}</div>
            <p className="text-xs text-muted-foreground">Nuevos proveedores este mes</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Facturas de los últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <DashboardChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proveedores Recientes</CardTitle>
            <CardDescription>
              Los últimos 5 proveedores añadidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProveedores.length > 0 ? (
                  recentProveedores.map((proveedor) => (
                    <TableRow key={proveedor.cedula_ruc}>
                      <TableCell>
                        <div className="font-medium">{proveedor.nombre}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {proveedor.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <Badge variant={proveedor.estado ? "default" : "secondary"} className={proveedor.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {proveedor.estado ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                     <TableCell colSpan={2} className="text-center">No hay proveedores recientes.</TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
