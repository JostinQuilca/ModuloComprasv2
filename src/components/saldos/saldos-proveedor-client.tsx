"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowUpDown, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Proveedor, FacturaCompra } from "@/lib/types";

interface SaldosProveedorClientProps {
  proveedores: Proveedor[];
  facturas: FacturaCompra[];
}

interface ReporteData {
  cedula_ruc: string;
  nombre: string;
  saldo: number;
}

type SortKey = keyof ReporteData;

export default function SaldosProveedorClient({
  proveedores,
  facturas,
}: SaldosProveedorClientProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();
  const [reportData, setReportData] = React.useState<ReporteData[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "asc" | "desc";
  } | null>(null);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Fechas requeridas",
        description:
          "Por favor, seleccione una fecha de inicio y una fecha de fin.",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Error de validación",
        description:
          "Las fechas seleccionadas no son válidas. Verifique el rango.",
        variant: "destructive",
      });
      return;
    }

    const facturasCredito = facturas.filter((f) => {
      const fechaEmision = new Date(f.fecha_emision);
      return (
        f.tipo_pago === "Crédito" &&
        f.estado !== "Cancelada" &&
        fechaEmision >= startDate &&
        fechaEmision <= endDate
      );
    });

    if (facturasCredito.length === 0) {
      toast({
        title: "Sin resultados",
        description:
          "No se encontraron proveedores o créditos para el rango de fechas seleccionado.",
      });
      setReportData([]);
      return;
    }

    const saldosPorProveedor: { [key: string]: number } = {};

    facturasCredito.forEach((f) => {
      saldosPorProveedor[f.proveedor_cedula_ruc] =
        (saldosPorProveedor[f.proveedor_cedula_ruc] || 0) + f.total;
    });

    const proveedorMap = new Map(
      proveedores.map((p) => [p.cedula_ruc, p.nombre])
    );

    const generatedData: ReporteData[] = Object.entries(saldosPorProveedor)
      .map(([cedula_ruc, saldo]) => ({
        cedula_ruc,
        nombre: proveedorMap.get(cedula_ruc) || "Proveedor Desconocido",
        saldo,
      }))
      .filter((item) => item.saldo > 0);

    setReportData(generatedData);
    if (generatedData.length === 0) {
      toast({
        title: "Sin resultados",
        description:
          "No se encontraron saldos pendientes para el rango de fechas seleccionado.",
      });
    }
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...reportData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [reportData, sortConfig]);

  const handleSort = (key: SortKey) => {
    if (reportData.length < 2) {
      toast({
        title: "No se puede ordenar",
        description: "No hay suficientes datos para ordenar.",
      });
      return;
    }
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalSaldo = React.useMemo(() => {
    return sortedData.reduce((acc, item) => acc + item.saldo, 0);
  }, [sortedData]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const formattedStartDate = startDate ? format(startDate, "dd/MM/yyyy") : "";
    const formattedEndDate = endDate ? format(endDate, "dd/MM/yyyy") : "";

    doc.text("Reporte de Saldos de Proveedor", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Rango de fechas: ${formattedStartDate} - ${formattedEndDate}`,
      14,
      22
    );

    autoTable(doc, {
      startY: 28,
      head: [["Proveedor", "Saldo Pendiente"]],
      body: sortedData.map((item) => [
        item.nombre,
        `$${item.saldo.toFixed(2)}`,
      ]),
      foot: [["Total General", `$${totalSaldo.toFixed(2)}`]],
      showFoot: "lastPage",
      footStyles: {
        fontStyle: "bold",
        fillColor: [230, 230, 230],
        textColor: 20,
      },
    });

    doc.save("reporte_saldos_proveedores.pdf");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
          <CardDescription>
            Seleccione un rango de fechas para generar el reporte de saldos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP", { locale: es })
                  ) : (
                    <span>Fecha de inicio</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "PPP", { locale: es })
                  ) : (
                    <span>Fecha de fin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={startDate ? { before: startDate } : undefined}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleGenerateReport}>Generar Reporte</Button>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Resultados del Reporte</CardTitle>
              <CardDescription>
                Proveedores con saldos de crédito en el período seleccionado.
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("saldo")}
                  >
                    <span className="flex items-center justify-end gap-2">
                      Saldo Pendiente <ArrowUpDown className="h-4 w-4" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item) => (
                  <TableRow key={item.cedula_ruc}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell className="text-right">
                      ${item.saldo.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-end font-bold text-lg">
            Total: ${totalSaldo.toFixed(2)}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
