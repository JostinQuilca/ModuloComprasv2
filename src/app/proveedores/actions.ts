"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProveedorSchema } from "@/lib/types";

const API_URL = "https://modulocompras-production-843f.up.railway.app/api/proveedores";

type ActionResponse = {
  success: boolean;
  message: string;
};

function formatZodErrors(error: z.ZodError): string {
    const { fieldErrors } = error.flatten();
    const errorMessages = Object.entries(fieldErrors)
        .map(([fieldName, errors]) => `${fieldName}: ${errors.join(', ')}`)
        .join('; ');
    return errorMessages;
}

export async function addProveedor(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = ProveedorSchema.safeParse({
    ...rawData,
    estado: rawData.estado === "on",
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: `Datos de formulario no válidos: ${formatZodErrors(validatedFields.error)}`,
    };
  }
  
  const dataToSubmit = {
      ...validatedFields.data,
      usuario_creacion: 1, // Mock user ID
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Error al crear el proveedor.');
    }

    revalidatePath("/");
    return { success: true, message: "Proveedor añadido con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function updateProveedor(
  cedula_ruc: string,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = ProveedorSchema.safeParse({
    ...rawData,
    estado: rawData.estado === "on",
  });

  if (!validatedFields.success) {
     return {
      success: false,
      message: `Datos de formulario no válidos: ${formatZodErrors(validatedFields.error)}`,
    };
  }

  const dataToSubmit = {
      ...validatedFields.data,
      usuario_modificacion: 1, // Mock user ID
  };
  
  try {
    const response = await fetch(`${API_URL}/${cedula_ruc}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el proveedor.');
    }
    
    revalidatePath("/");
    return { success: true, message: "Proveedor actualizado con éxito." };
  } catch (error: unknown) {
     return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}

export async function deleteProveedor(cedula_ruc: string): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_URL}/${cedula_ruc}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el proveedor.');
    }

    revalidatePath("/");
    return { success: true, message: "Proveedor eliminado con éxito." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "Ocurrió un error desconocido." };
  }
}
