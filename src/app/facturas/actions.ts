"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FacturaCompra, FacturaCompraSchema } from "@/lib/types";
import { format } from 'date-fns';

const API_URL = "https://modulocompras-production-843f.up.railway.app/api/facturas";

export type ActionResponse = {
  success: boolean;
  message: string;
  factura?: FacturaCompra;
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
        if (errorBody.error && typeof errorBody.error === 'string') {
          errorMessage = errorBody.error;
        } else if (errorBody.message) {
          errorMessage = errorBody.message
        } else {
          errorMessage = JSON.stringify(errorBody);
        }
    } catch {
        // Ignore if the body is not JSON, the default message will be used.
    }
    throw new Error(errorMessage);
}

export async function addFactura(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const fechaVencimientoValue = formData.get('fecha_vencimiento');
  const rawData = {
      proveedor_cedula_ruc: formData.get('proveedor_cedula_ruc'),
      numero_factura_proveedor: formData.get('numero_factura_proveedor'),
      fecha_emision: new Date(formData.get('fecha_emision') as string),
      fecha_vencimiento: fechaVencimientoValue ? new Date(fechaVencimientoValue as string) : null,
      estado: formData.get('estado'),
      tipo_pago: formData.get('tipo_pago'),
      subtotal: Number(formData.get('subtotal') ?? 0),
      iva: Number(formData.get('iva') ?? 0),
      total: Number(formData.get('total') ?? 0),
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
      numero_factura: `TEMP-${Date.now()}`,
      fecha_emision: format(validatedFields.data.fecha_emision, "yyyy-MM-dd"),
      fecha_vencimiento: validatedFields.data.fecha_vencimiento 
        ? format(validatedFields.data.fecha_vencimiento, "yyyy-MM-dd")
        : null,
      usuario_creacion: 1, 
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
       await handleApiError(response, 'Error al crear la factura.');
    }
    
    const newFactura = await response.json();

    revalidatePath("/facturas");
    return { 
        success: true, 
        message: "Factura creada con éxito.",
        factura: newFactura,
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
    const fechaVencimientoValue = formData.get('fecha_vencimiento');
    const rawData = {
      proveedor_cedula_ruc: formData.get('proveedor_cedula_ruc'),
      numero_factura_proveedor: formData.get('numero_factura_proveedor'),
      fecha_emision: new Date(formData.get('fecha_emision') as string),
      fecha_vencimiento: fechaVencimientoValue ? new Date(fechaVencimientoValue as string) : null,
      estado: formData.get('estado'),
      tipo_pago: formData.get('tipo_pago'),
      subtotal: Number(formData.get('subtotal') ?? 0),
      iva: Number(formData.get('iva') ?? 0),
      total: Number(formData.get('total') ?? 0),
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
      fecha_emision: format(validatedFields.data.fecha_emision, "yyyy-MM-dd"),
      fecha_vencimiento: validatedFields.data.fecha_vencimiento
        ? format(validatedFields.data.fecha_vencimiento, "yyyy-MM-dd")
        : null,
      usuario_modificacion: 1,
  };
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(response, 'Error al actualizar la factura.');
    }
    
    const updatedFactura = await response.json();
    
    revalidatePath("/facturas");
    revalidatePath(`/detalles-factura?factura_id=${id}`);
    return { 
        success: true, 
        message: "Factura actualizada con éxito.",
        factura: updatedFactura,
    };
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
      await handleApiError(response, 'Error al eliminar la factura.');
    }

    revalidatePath("/facturas");
    return { success: true, message: "Factura eliminada con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}
