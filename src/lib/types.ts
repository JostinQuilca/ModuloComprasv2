import { z } from "zod";

export const ProveedorSchema = z.object({
  cedula_ruc: z.string()
    .min(10, "Cédula/RUC debe tener al menos 10 caracteres.")
    .max(20, "Cédula/RUC no puede tener más de 20 caracteres."),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  ciudad: z.string().min(3, "La ciudad debe tener al menos 3 caracteres."),
  tipo_proveedor: z.enum(["Crédito", "Contado"], { required_error: "El tipo de proveedor es requerido." }),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
  telefono: z.string().min(7, "El teléfono debe tener al menos 7 caracteres."),
  email: z.string().email("Dirección de email inválida."),
  estado: z.boolean().default(true),
});

export type Proveedor = {
  cedula_ruc: string;
  nombre: string;
  ciudad: string;
  tipo_proveedor: 'Crédito' | 'Contado';
  direccion: string;
  telefono: string;
  email: string;
  estado: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  usuario_creacion?: number;
  usuario_modificacion?: number;
};

export const ProductoSchema = z.object({
    id_producto: z.number(),
    codigo: z.string(),
    nombre: z.string(),
    precio_unitario: z.string(),
    descripcion: z.string().nullable(),
    id_categoria: z.number(),
});

export type Producto = z.infer<typeof ProductoSchema>;

export const FacturaCompraSchema = z.object({
  id: z.number().optional(),
  proveedor_id: z.string().min(1, "El proveedor es requerido."),
  numero_factura: z.string().min(1, "El número de factura es requerido."),
  fecha_emision: z.date({ required_error: "La fecha de emisión es requerida."}),
  fecha_vencimiento: z.date({ required_error: "La fecha de vencimiento es requerida."}),
  subtotal: z.number().optional().default(0),
  iva: z.number().optional().default(0),
  total: z.number().optional().default(0),
  estado: z.enum(["Pendiente", "Pagada", "Anulada"]),
});

export type FacturaCompra = {
  id: number;
  proveedor_id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Pendiente' | 'Pagada' | 'Anulada';
  fecha_creacion?: string;
  usuario_creacion?: number;
};

export const FacturaDetalleSchema = z.object({
    id: z.number().optional(),
    factura_id: z.number({ required_error: "El ID de la factura es requerido."}),
    producto_id: z.number({ required_error: "El producto es requerido." }),
    cantidad: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
    precio_unitario: z.coerce.number().min(0, "El precio no puede ser negativo."),
    aplica_iva: z.boolean().default(false),
});

export type FacturaDetalle = {
    id: number;
    factura_id: number;
    producto_id: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    aplica_iva: boolean;
    subtotal: number;
    iva: number;
    total: number;
    usuario_creacion?: number;
    fecha_creacion?: string;
}
