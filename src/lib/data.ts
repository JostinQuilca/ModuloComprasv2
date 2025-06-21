import type { FacturaCompra, FacturaDetalle, Producto, Proveedor } from '@/lib/types';

const API_BASE_URL_COMPRAS = "https://modulocompras-production-843f.up.railway.app/api";
const API_BASE_URL_AD = "https://adapi-production-16e6.up.railway.app/api/v1";

async function fetchData<T>(url: string, defaultReturnValue: T): Promise<T> {
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            const errorText = await res.text();
            // Log the error instead of throwing, to prevent page crashes on API errors.
            console.error(`API request failed to ${url}: ${res.status} ${res.statusText} - ${errorText}`);
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
  const data = await fetchData<Proveedor[]>(`${API_BASE_URL_COMPRAS}/proveedores`, []);
  if (!Array.isArray(data)) {
    console.error("API response for proveedores is not an array:", data);
    return [];
  };
  // Ensure fecha_creacion is a string for sorting, matching dashboard logic
  return data.map((p) => ({...p, fecha_creacion: p.fecha_creacion || new Date(0).toISOString()}));
}

export async function getFacturas(): Promise<FacturaCompra[]> {
  const data = await fetchData<FacturaCompra[]>(`${API_BASE_URL_COMPRAS}/facturas`, []);
  return Array.isArray(data) ? data : [];
}

export async function getProductos(): Promise<Producto[]> {
    const data = await fetchData<any>(`${API_BASE_URL_AD}/productos/`, []);
    // API could return { data: [...] } or just [...]
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

export async function getDetalles(): Promise<FacturaDetalle[]> {
    const data = await fetchData<FacturaDetalle[]>(`${API_BASE_URL_COMPRAS}/detalles-factura`, []);
    return Array.isArray(data) ? data : [];
}

export async function getFactura(id: number): Promise<(FacturaCompra & {nombre_proveedor: string}) | null> {
    const factura = await fetchData<FacturaCompra | null>(`${API_BASE_URL_COMPRAS}/facturas/${id}`, null);

    if (!factura || typeof factura !== 'object') {
        return null;
    }

    let nombre_proveedor = 'Desconocido';
    if (factura.proveedor_cedula_ruc) {
        const proveedor = await fetchData<Proveedor | null>(`${API_BASE_URL_COMPRAS}/proveedores/${factura.proveedor_cedula_ruc}`, null);
        if (proveedor && proveedor.nombre) {
            nombre_proveedor = proveedor.nombre;
        }
    }
    
    return { ...factura, nombre_proveedor };
}
