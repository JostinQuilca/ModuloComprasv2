"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FacturaCompraSchema } from "@/lib/types";
import { format } from 'date-fns';

const API_URL = "https://modulocompras-production-843f.up.railway.app/api/facturas";

type ActionResponse = {
  success: boolean;
  message: string;
  redirectUrl?: string;
};

function formatZodErrors(error: z.ZodError): string {
    const { fieldErrors } = error.flatten();
    const errorMessages = Object.entries(fieldErrors)
        .map(([fieldName, errors]) => `${fieldName}: ${errors?.join(', ')}`)
        .join('; ');
    return `Datos de formulario no válidos: ${errorMessages}`;
}

export async function addFactura(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
      proveedor_cedula_ruc: formData.get('proveedor_cedula_ruc'),
      numero_factura: formData.get('numero_factura'),
      fecha_emision: new Date(formData.get('fecha_emision') as string),
      fecha_vencimiento: new Date(formData.get('fecha_vencimiento') as string),
      estado: formData.get('estado'),
  };
  
  const validatedFields = FacturaCompraSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: formatZodErrors(validatedFields.error),
    };
  }
  
  const dataToSubmit = {
      ...validatedFields.data,
      fecha_emision: format(validatedFields.data.fecha_emision, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      fecha_vencimiento: format(validatedFields.data.fecha_vencimiento, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      subtotal: 0,
      iva: 0,
      total: 0,
      usuario_creacion: 1, // Mock user ID
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Error al crear la factura.');
    }
    
    const newFactura = await response.json();

    revalidatePath("/facturas");
    return { 
        success: true, 
        message: "Factura creada con éxito. Redirigiendo...",
        redirectUrl: `/detalles-factura?factura_id=${newFactura.id}`
    };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function updateFactura(
  id: number,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
    const rawData = {
      proveedor_cedula_ruc: formData.get('proveedor_cedula_ruc'),
      numero_factura: formData.get('numero_factura'),
      fecha_emision: new Date(formData.get('fecha_emision') as string),
      fecha_vencimiento: new Date(formData.get('fecha_vencimiento') as string),
      estado: formData.get('estado'),
  };

  const validatedFields = FacturaCompraSchema.safeParse(rawData);

  if (!validatedFields.success) {
     return {
      success: false,
      message: formatZodErrors(validatedFields.error),
    };
  }

  const dataToSubmit = {
      ...validatedFields.data,
      fecha_emision: format(validatedFields.data.fecha_emision, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      fecha_vencimiento: format(validatedFields.data.fecha_vencimiento, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      usuario_modificacion: 1, // Mock user ID
  };
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar la factura.');
    }
    
    revalidatePath("/facturas");
    revalidatePath(`/detalles-factura?factura_id=${id}`);
    return { success: true, message: "Factura actualizada con éxito." };
  } catch (error: unknown) {
     return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function deleteFactura(id: number): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar la factura.');
    }

    revalidatePath("/facturas");
    return { success: true, message: "Factura eliminada con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}
