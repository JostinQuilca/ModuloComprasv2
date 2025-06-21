import { z } from "zod";

export const ProveedorSchema = z.object({
  cedula_ruc: z.string()
    .min(10, "Cédula/RUC must be at least 10 characters.")
    .max(20, "Cédula/RUC can't be more than 20 characters."),
  nombre: z.string().min(3, "Name must be at least 3 characters."),
  ciudad: z.string().min(3, "City must be at least 3 characters."),
  tipo_proveedor: z.enum(["Crédito", "Contado"], { required_error: "Supplier type is required." }),
  direccion: z.string().min(5, "Address must be at least 5 characters."),
  telefono: z.string().min(7, "Phone must be at least 7 characters."),
  email: z.string().email("Invalid email address."),
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
