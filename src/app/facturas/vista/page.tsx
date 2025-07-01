import { getFactura, getDetallesByFacturaId, getProductos } from "@/lib/data";
import { notFound } from "next/navigation";
import FacturaVistaClient from "@/components/facturas/facturas-vista-client";

export default async function FacturaVistaPage({
  searchParams,
}: {
  searchParams: { factura_id?: string };
}) {
  const facturaId = searchParams.factura_id
    ? parseInt(searchParams.factura_id, 10)
    : null;

  if (!facturaId || isNaN(facturaId)) {
    return notFound();
  }

  const [factura, detalles, productos] = await Promise.all([
    getFactura(facturaId),
    getDetallesByFacturaId(facturaId),
    getProductos(),
  ]);

  if (!factura) {
    return notFound();
  }

  return (
    <FacturaVistaClient
      factura={factura}
      detalles={detalles}
      productos={productos}
    />
  );
}
