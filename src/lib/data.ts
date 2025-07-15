import type {
  FacturaCompra,
  FacturaDetalle,
  Producto,
  Proveedor,
  AuditoriaLog,
} from "@/lib/types";

const API_BASE_URL_COMPRAS = "https://modulocompras.onrender.com/api";
const API_BASE_URL_AD = "https://ad-xglt.onrender.com/api/v1";
const API_BASE_URL_SEGURIDAD =
  "https://aplicacion-de-seguridad-v2.onrender.com/api";

async function fetchData<T>(url: string, defaultReturnValue: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const errorText = await res.text();
      // Log the error instead of throwing, to prevent page crashes on API errors.
      console.error(
        `API request failed to ${url}: ${res.status} ${res.statusText} - ${errorText}`
      );
      return defaultReturnValue;
    }
    // Handle cases where response might be empty
    const text = await res.text();
    if (!text) {
      return defaultReturnValue;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error(`Failed to fetch from ${url}`, error);
    return defaultReturnValue;
  }
}

export async function getProveedores(): Promise<Proveedor[]> {
  const data = await fetchData<Proveedor[]>(
    `${API_BASE_URL_COMPRAS}/proveedores`,
    []
  );
  if (!Array.isArray(data)) {
    console.error("API response for proveedores is not an array:", data);
    return [];
  }
  // Ensure fecha_creacion is a string for sorting, matching dashboard logic
  return data.map((p) => ({
    ...p,
    fecha_creacion: p.fecha_creacion || new Date(0).toISOString(),
  }));
}

export async function getFacturas(): Promise<FacturaCompra[]> {
  const data = await fetchData<any[]>(`${API_BASE_URL_COMPRAS}/facturas`, []);
  if (!Array.isArray(data)) {
    console.error("API response for facturas is not an array:", data);
    return [];
  }
  return data.map((factura) => ({
    ...factura,
    subtotal: parseFloat(factura.subtotal) || 0,
    iva: parseFloat(factura.iva) || 0,
    total: parseFloat(factura.total) || 0,
  }));
}

export async function getProductos(): Promise<Producto[]> {
  // Fetch from the new URL structure
  const data = await fetchData<any>(`${API_BASE_URL_AD}/productos`, []);
  let productos: any[] = [];

  // Adapt to the new response structure which might be { "productos": [...] }
  if (data && Array.isArray(data.productos)) {
    productos = data.productos;
  }
  // Handle if the response is a direct array
  else if (Array.isArray(data)) {
    productos = data;
  }
  // If the structure is unexpected, return an empty array
  else {
    return [];
  }

  // Map the response to match the Producto type, handling the 'pvp' field
  return productos.map((p) => ({
    ...p,
    precio_unitario: String(p.pvp ?? p.precio_unitario ?? "0.00"),
    descripcion: p.descripcion ?? null,
    id_categoria: p.id_categoria ?? 0,
  }));
}

export async function getDetalles(): Promise<FacturaDetalle[]> {
  const data = await fetchData<any[]>(
    `${API_BASE_URL_COMPRAS}/detalles-factura`,
    []
  );
  if (!Array.isArray(data)) {
    console.error("API response for detalles-factura is not an array:", data);
    return [];
  }
  return data.map((detalle) => ({
    ...detalle,
    cantidad: parseInt(String(detalle.cantidad), 10) || 0,
    precio_unitario: parseFloat(String(detalle.precio_unitario)) || 0,
    subtotal: parseFloat(String(detalle.subtotal)) || 0,
    iva: parseFloat(String(detalle.iva)) || 0,
    total: parseFloat(String(detalle.total)) || 0,
  }));
}

export async function getFactura(
  id: number
): Promise<(FacturaCompra & { nombre_proveedor: string }) | null> {
  const factura = await fetchData<any | null>(
    `${API_BASE_URL_COMPRAS}/facturas/${id}`,
    null
  );

  if (!factura || typeof factura !== "object") {
    return null;
  }

  let nombre_proveedor = "Desconocido";
  if (factura.proveedor_cedula_ruc) {
    const proveedor = await fetchData<Proveedor | null>(
      `${API_BASE_URL_COMPRAS}/proveedores/${factura.proveedor_cedula_ruc}`,
      null
    );
    if (proveedor && proveedor.nombre) {
      nombre_proveedor = proveedor.nombre;
    }
  }

  return {
    ...factura,
    nombre_proveedor,
    subtotal: parseFloat(factura.subtotal) || 0,
    iva: parseFloat(factura.iva) || 0,
    total: parseFloat(factura.total) || 0,
  };
}

export async function getDetallesByFacturaId(
  facturaId: number
): Promise<FacturaDetalle[]> {
  const [allDetalles, allProductos] = await Promise.all([
    getDetalles(),
    getProductos(),
  ]);

  const productoMap = new Map(
    allProductos.map((p) => [p.id_producto, p.nombre])
  );

  const facturaDetalles = allDetalles.filter((d) => d.factura_id === facturaId);

  const detallesConNombres = facturaDetalles.map((detalle) => ({
    ...detalle,
    nombre_producto:
      productoMap.get(detalle.producto_id) || "Producto no encontrado",
  }));

  return detallesConNombres;
}

export async function getAuditoriaLogs(): Promise<AuditoriaLog[]> {
  const data = await fetchData<AuditoriaLog[]>(
    `${API_BASE_URL_SEGURIDAD}/auditoria`,
    []
  );
  if (!Array.isArray(data)) {
    console.error("API response for auditoria is not an array:", data);
    return [];
  }
  // Filter to only show logs from the 'compras' module
  return data.filter((log) => log.modulo.toLowerCase() === "compras");
}
