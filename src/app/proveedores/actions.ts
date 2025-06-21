"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProveedorSchema } from "@/lib/types";

const API_URL = "https://modulocompras-production-843f.up.railway.app/api/proveedores";

type ActionResponse = {
  success: boolean;
  message: string;
};

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
      message: "Invalid form data. Please check the fields.",
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
       throw new Error(errorData.message || 'Failed to create supplier.');
    }

    revalidatePath("/");
    return { success: true, message: "Supplier added successfully." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
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
      message: "Invalid form data. Please check the fields.",
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
      throw new Error(errorData.message || 'Failed to update supplier.');
    }
    
    revalidatePath("/");
    return { success: true, message: "Supplier updated successfully." };
  } catch (error: unknown) {
     return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}

export async function deleteProveedor(cedula_ruc: string): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_URL}/${cedula_ruc}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete supplier.');
    }

    revalidatePath("/");
    return { success: true, message: "Supplier deleted successfully." };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
