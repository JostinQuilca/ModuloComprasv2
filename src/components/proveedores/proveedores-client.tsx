"use client";

import * as React from "react";
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
} from "lucide-react";
import { Proveedor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ProveedorFormModal from "./proveedor-form-modal";
import DeleteProveedorDialog from "./delete-proveedor-dialog";
import { deleteProveedor } from "@/app/proveedores/actions";
import { Card } from "../ui/card";

type SortKey = keyof Proveedor;

export default function ProveedoresClient({ initialData }: { initialData: Proveedor[] }) {
  const [data, setData] = React.useState<Proveedor[]>(initialData);
  const [filter, setFilter] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);
  
  const [isAddOrEditModalOpen, setAddOrEditModalOpen] = React.useState(false);
  const [editingProveedor, setEditingProveedor] = React.useState<Proveedor | null>(null);

  const [isDeleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingProveedor, setDeletingProveedor] = React.useState<Proveedor | null>(null);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();

  React.useEffect(() => {
    setData(initialData);
    setCurrentPage(1); // Reset to first page when data changes
  }, [initialData]);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            return sortConfig.direction === 'asc' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() =>
    sortedData.filter(
      (item) =>
        (item.nombre || "").toLowerCase().includes(filter.toLowerCase()) ||
        (item.cedula_ruc || "").includes(filter) ||
        (item.email || "").toLowerCase().includes(filter.toLowerCase())
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
  };
  
  const handleOpenAddModal = () => {
    setEditingProveedor(null);
    setAddOrEditModalOpen(true);
  };
  
  const handleOpenEditModal = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setAddOrEditModalOpen(true);
  };
  
  const handleOpenDeleteDialog = (proveedor: Proveedor) => {
    setDeletingProveedor(proveedor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProveedor) return;
    
    const result = await deleteProveedor(deletingProveedor.cedula_ruc);
    if(result.success) {
      // Data will be re-fetched by revalidatePath, no need to manually update state
      toast({
        title: "Éxito",
        description: result.message,
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setDeletingProveedor(null);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar proveedores por nombre, RUC, o email..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset page on filter change
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleOpenAddModal} className="shrink-0">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Proveedor
          </Button>
        </div>
        <Card className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acciones</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("cedula_ruc")}>
                  <span className="flex items-center gap-2">Cédula/RUC <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("nombre")}>
                   <span className="flex items-center gap-2">Nombre <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("estado")}>
                  <span className="flex items-center gap-2">Estado <ArrowUpDown className="h-4 w-4" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.cedula_ruc}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(item)}>
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(item)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{item.cedula_ruc}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.telefono}</TableCell>
                    <TableCell>{item.ciudad}</TableCell>
                    <TableCell>{item.tipo_proveedor}</TableCell>
                    <TableCell>
                      <Badge variant={item.estado ? "default" : "secondary"} className={item.estado ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {item.estado ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No se encontraron resultados.
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
      
      <ProveedorFormModal
        isOpen={isAddOrEditModalOpen}
        setIsOpen={setAddOrEditModalOpen}
        proveedor={editingProveedor}
      />
      
      <DeleteProveedorDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        proveedorName={deletingProveedor?.nombre}
      />
    </>
  );
}
