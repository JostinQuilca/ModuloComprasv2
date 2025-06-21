"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FacturaDetalleSchema } from "@/lib/types";

const API_URL = "https://modulocompras-production-843f.up.railway.app/api/detalles-factura";

type ActionResponse = {
  success: boolean;
  message: string;
};

function formatZodErrors(error: z.ZodError): string {
    const { fieldErrors } = error.flatten();
    const errorMessages = Object.entries(fieldErrors)
        .map(([fieldName, errors]) => `${fieldName}: ${errors?.join(', ')}`)
        .join('; ');
    return `Datos de formulario no válidos: ${errorMessages}`;
}

async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
    let errorMessage = defaultMessage;
    try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || JSON.stringify(errorBody);
    } catch {
        // Ignore if the body is not JSON, the default message will be used.
    }
    throw new Error(errorMessage);
}


export async function addDetalle(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
      factura_id: Number(formData.get('factura_id')),
      producto_id: Number(formData.get('producto_id')),
      cantidad: formData.get('cantidad'),
      precio_unitario: formData.get('precio_unitario'),
      aplica_iva: formData.get('aplica_iva') === 'on',
  };
  
  const validatedFields = FacturaDetalleSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: formatZodErrors(validatedFields.error) };
  }
  
  const nombre_producto = formData.get('nombre_producto') as string | null;
  if (!nombre_producto || nombre_producto === 'Desconocido') {
      return { success: false, message: "No se pudo encontrar el nombre del producto." };
  }

  const dataToSubmit = { ...validatedFields.data, nombre_producto, usuario_creacion: 1 };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
       await handleApiError(response, 'Error al crear el detalle.');
    }

    revalidatePath(`/detalles-factura?factura_id=${dataToSubmit.factura_id}`);
    revalidatePath('/facturas');
    return { success: true, message: "Detalle añadido con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function updateDetalle(
  id: number,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
      factura_id: Number(formData.get('factura_id')),
      producto_id: Number(formData.get('producto_id')),
      cantidad: formData.get('cantidad'),
      precio_unitario: formData.get('precio_unitario'),
      aplica_iva: formData.get('aplica_iva') === 'on',
  };

  const validatedFields = FacturaDetalleSchema.safeParse(rawData);

  if (!validatedFields.success) {
     return { success: false, message: formatZodErrors(validatedFields.error) };
  }

  const nombre_producto = formData.get('nombre_producto') as string | null;
  if (!nombre_producto || nombre_producto === 'Desconocido') {
      return { success: false, message: "No se pudo encontrar el nombre del producto." };
  }
  
  const dataToSubmit = { ...validatedFields.data, nombre_producto, usuario_modificacion: 1 };
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(response, 'Error al actualizar el detalle.');
    }
    
    revalidatePath(`/detalles-factura?factura_id=${dataToSubmit.factura_id}`);
    revalidatePath('/facturas');
    return { success: true, message: "Detalle actualizado con éxito." };
  } catch (error: unknown) {
     return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function deleteDetalle(id: number, factura_id: number): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await handleApiError(response, 'Error al eliminar el detalle.');
    }

    revalidatePath(`/detalles-factura?factura_id=${factura_id}`);
    revalidatePath('/facturas');
    return { success: true, message: "Detalle eliminado con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}
