"use client";

import * as React from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Filter,
  Pencil,
  PlusCircle,
  Trash2,
  Eye,
} from "lucide-react";
import type { FacturaCompra, Proveedor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import FacturaFormModal from "./factura-form-modal";
import DeleteFacturaDialog from "./delete-factura-dialog";
import { deleteFactura } from "@/app/facturas/actions";
import { Card } from "../ui/card";
import { format, parseISO } from "date-fns";

type FacturaConNombre = FacturaCompra & { nombre_proveedor: string };
type SortKey = keyof FacturaConNombre | 'id';

const formatUTCDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const date = parseISO(dateString);
        // Adjust for timezone offset to prevent hydration errors
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), 'dd/MM/yyyy');
    } catch (error) {
        console.error("Invalid date string:", dateString, error);
        return 'Fecha inválida';
    }
};

export default function FacturasClient({ initialData, proveedores }: { initialData: FacturaConNombre[], proveedores: Proveedor[] }) {
  const [data, setData] = React.useState<FacturaConNombre[]>(initialData);
  const [filter, setFilter] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [editingFactura, setEditingFactura] = React.useState<FacturaConNombre | null>(null);

  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingFactura, setDeletingFactura] = React.useState<FacturaConNombre | null>(null);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof FacturaConNombre];
        const bValue = b[sortConfig.key as keyof FacturaConNombre];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() =>
    sortedData.filter(
      (item) =>
        item.nombre_proveedor.toLowerCase().includes(filter.toLowerCase()) ||
        item.numero_factura.toLowerCase().includes(filter.toLowerCase()) ||
        item.estado.toLowerCase().includes(filter.toLowerCase())
    ),
    [sortedData, filter]
  );
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);
  
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const handleOpenAddModal = () => {
    setEditingFactura(null);
    setModalOpen(true);
  };
  
  const handleOpenEditModal = (factura: FacturaConNombre) => {
    setEditingFactura(factura);
    setModalOpen(true);
  };
  
  const handleOpenDeleteDialog = (factura: FacturaConNombre) => {
    setDeletingFactura(factura);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFactura) return;
    
    const result = await deleteFactura(deletingFactura.id);
    if(result.success) {
      toast({ title: "Éxito", description: result.message });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setDeleteDialogOpen(false);
    setDeletingFactura(null);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por proveedor, # de factura o estado..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleOpenAddModal} className="shrink-0">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Factura
          </Button>
        </div>
        <Card className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acciones</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("numero_factura")}>
                  <span className="flex items-center gap-2"># Factura <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("nombre_proveedor")}>
                   <span className="flex items-center gap-2">Proveedor <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
                <TableHead>F. Emisión</TableHead>
                <TableHead>F. Vencimiento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("estado")}>
                  <span className="flex items-center gap-2">Estado <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" title="Ver Detalles">
                         <Link href={`/detalles-factura?factura_id=${item.id}`}>
                           <Eye className="h-5 w-5 text-blue-600" />
                         </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(item)} title="Editar Factura">
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(item)} title="Eliminar Factura">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{item.numero_factura}</TableCell>
                    <TableCell>{item.nombre_proveedor}</TableCell>
                    <TableCell>{formatUTCDate(item.fecha_emision)}</TableCell>
                    <TableCell>{formatUTCDate(item.fecha_vencimiento)}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.estado === 'Pagada' ? 'default' : item.estado === 'Pendiente' ? 'secondary' : 'destructive'} 
                             className={item.estado === 'Pagada' ? 'bg-green-100 text-green-800' : item.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {item.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No se encontraron facturas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
      
      <FacturaFormModal
        isOpen={isModalOpen}
        setIsOpen={setModalOpen}
        factura={editingFactura}
        proveedores={proveedores}
      />
      
      <DeleteFacturaDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        facturaNumero={deletingFactura?.numero_factura}
      />
    </>
  );
}
