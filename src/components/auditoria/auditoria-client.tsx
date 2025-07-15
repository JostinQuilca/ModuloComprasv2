"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
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
import { ArrowUpDown, ChevronDown, Filter } from "lucide-react";
import { AuditoriaLog } from "@/lib/types";
import { Card } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type SortKey = keyof AuditoriaLog | "details_string";

interface AuditoriaClientProps {
  initialData: AuditoriaLog[];
}

const formatUTCDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy, HH:mm:ss", { locale: es });
  } catch (error) {
    console.error("Invalid date string:", dateString, error);
    return "Fecha inválida";
  }
};

const getBadgeVariant = (accion: string) => {
  switch (accion.toUpperCase()) {
    case "CREACIÓN":
    case "INSERT":
      return "default";
    case "CONSULTA":
    case "SELECT":
      return "secondary";
    case "ELIMINACIÓN":
    case "DELETE":
      return "destructive";
    case "ACTUALIZACIÓN":
    case "UPDATE":
      return "outline";
    default:
      return "secondary";
  }
};

const getBadgeClassName = (accion: string) => {
  switch (accion.toUpperCase()) {
    case "CREACIÓN":
    case "INSERT":
      return "bg-green-100 text-green-800 border-green-200";
    case "CONSULTA":
    case "SELECT":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ELIMINACIÓN":
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-200";
    case "ACTUALIZACIÓN":
    case "UPDATE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDetails = (details: Record<string, any>): string => {
  if (!details) return "N/A";

  if (details.tipo) {
    return details.tipo;
  }

  if (details.antes && details.despues) {
    const changes = Object.keys(details.despues)
      .map((key) => {
        if (details.antes[key] !== details.despues[key]) {
          return `${key}: '${details.antes[key]}' -> '${details.despues[key]}'`;
        }
        return null;
      })
      .filter(Boolean)
      .join("; ");
    return `Cambios: ${changes || "Sin cambios detectados."}`;
  }

  if (details.nuevo) {
    return `Nuevo registro: ${JSON.stringify(details.nuevo)}`;
  }

  if (details.eliminado) {
    return `Registro eliminado: ${JSON.stringify(details.eliminado)}`;
  }

  return JSON.stringify(details, null, 2);
};

export default function AuditoriaClient({ initialData }: AuditoriaClientProps) {
  const [data] = React.useState<AuditoriaLog[]>(
    initialData.map((log) => ({
      ...log,
      details_string: formatDetails(log.details),
    }))
  );
  const [filter, setFilter] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "asc" | "desc";
  } | null>({ key: "timestamp", direction: "desc" });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof AuditoriaLog];
        const bValue = b[sortConfig.key as keyof AuditoriaLog];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(
    () =>
      sortedData.filter(
        (item) =>
          item.accion.toLowerCase().includes(filter.toLowerCase()) ||
          item.modulo.toLowerCase().includes(filter.toLowerCase()) ||
          item.tabla.toLowerCase().includes(filter.toLowerCase()) ||
          item.nombre_rol.toLowerCase().includes(filter.toLowerCase()) ||
          (item as any).details_string
            .toLowerCase()
            .includes(filter.toLowerCase())
      ),
    [sortedData, filter]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const gridTemplateColumns =
    "50px minmax(200px, 1fr) 150px 150px 150px minmax(150px, 1fr)";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por acción, módulo, tabla, etc..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>
      <Card className="border shadow-sm rounded-lg overflow-hidden">
        {/* Header */}
        <div
          className="grid bg-muted/50 font-medium text-muted-foreground p-4"
          style={{ gridTemplateColumns }}
        >
          <div className="w-[50px]"></div>
          <div
            className="cursor-pointer"
            onClick={() => handleSort("timestamp")}
          >
            <span className="flex items-center gap-2">
              Fecha y Hora <ArrowUpDown className="h-4 w-4" />
            </span>
          </div>
          <div className="cursor-pointer" onClick={() => handleSort("accion")}>
            <span className="flex items-center gap-2">
              Acción <ArrowUpDown className="h-4 w-4" />
            </span>
          </div>
          <div className="cursor-pointer" onClick={() => handleSort("modulo")}>
            <span className="flex items-center gap-2">
              Módulo <ArrowUpDown className="h-4 w-4" />
            </span>
          </div>
          <div className="cursor-pointer" onClick={() => handleSort("tabla")}>
            <span className="flex items-center gap-2">
              Tabla <ArrowUpDown className="h-4 w-4" />
            </span>
          </div>
          <div>Usuario/Rol</div>
        </div>

        {/* Body */}
        <Accordion type="single" collapsible className="w-full">
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <AccordionItem
                value={`item-${item.id}`}
                key={item.id}
                className="border-b last:border-b-0"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-muted/50 p-0 text-sm font-normal">
                  <div
                    className="grid w-full p-4 text-left"
                    style={{ gridTemplateColumns }}
                  >
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    <div>{formatUTCDate(item.timestamp)}</div>
                    <div>
                      <Badge
                        variant={getBadgeVariant(item.accion)}
                        className={getBadgeClassName(item.accion)}
                      >
                        {item.accion}
                      </Badge>
                    </div>
                    <div className="font-medium">{item.modulo}</div>
                    <div>{item.tabla}</div>
                    <div>{item.nombre_rol || "N/A"}</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted/80 p-4">
                    <h4 className="font-semibold mb-2">
                      Detalles del Registro:
                    </h4>
                    <pre className="text-sm text-muted-foreground bg-background p-3 rounded-md overflow-auto whitespace-pre-wrap break-words">
                      {formatDetails(item.details)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <div className="text-center h-24 flex items-center justify-center">
              No se encontraron registros de auditoría.
            </div>
          )}
        </Accordion>
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
