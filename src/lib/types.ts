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
