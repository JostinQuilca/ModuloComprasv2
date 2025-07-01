"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { FacturaCompraSchema, FacturaDetalleSchema } from "@/lib/types";
import {
  formatZodErrors,
  handleApiError,
  type ActionResponse,
} from "@/lib/actions-utils";
import { getDetallesByFacturaId } from "@/lib/data";

const API_URL = "https://modulocompras.onrender.com/api/detalles-factura";
const FACTURAS_API_URL = "https://modulocompras.onrender.com/api/facturas";
const IVA_RATE = 0.15;

/**
 * Recalcula y actualiza los totales (subtotal, iva, total) de una factura
 * basándose en sus detalles actuales.
 * @param facturaId El ID de la factura a actualizar.
 */
async function updateFacturaTotals(facturaId: number) {
  try {
    // 1. Obtener todos los detalles para la factura
    const detalles = await getDetallesByFacturaId(facturaId);

    // 2. Calcular los nuevos totales
    const subtotal = detalles.reduce((acc, d) => acc + d.subtotal, 0);
    const iva = detalles.reduce((acc, d) => acc + d.iva, 0);
    const total = subtotal + iva;

    // 3. Obtener el objeto de factura actual completo
    const facturaRes = await fetch(`${FACTURAS_API_URL}/${facturaId}`);
    if (!facturaRes.ok) {
      await handleApiError(
        facturaRes,
        `No se pudo obtener la factura ${facturaId} para actualizar totales.`
      );
    }
    const currentFactura = await facturaRes.json();

    // 4. Validar y formatear los datos para la solicitud PUT
    const validatedFields = FacturaCompraSchema.safeParse({
      ...currentFactura,
      subtotal,
      iva,
      total,
      fecha_emision: new Date(currentFactura.fecha_emision),
      fecha_vencimiento: currentFactura.fecha_vencimiento
        ? new Date(currentFactura.fecha_vencimiento)
        : null,
    });

    if (!validatedFields.success) {
      console.error(
        "Error de validación de Zod al actualizar totales:",
        validatedFields.error
      );
      throw new Error(
        "Datos de factura inválidos al recalcular totales. " +
          formatZodErrors(validatedFields.error)
      );
    }

    const dataToSubmit = {
      ...validatedFields.data,
      fecha_emision: format(validatedFields.data.fecha_emision, "yyyy-MM-dd"),
      fecha_vencimiento: validatedFields.data.fecha_vencimiento
        ? format(validatedFields.data.fecha_vencimiento, "yyyy-MM-dd")
        : null,
      usuario_modificacion: 1, // Mock user ID
    };

    // 5. Realizar la solicitud PUT para actualizar la factura
    const response = await fetch(`${FACTURAS_API_URL}/${facturaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(
        response,
        "Error al actualizar los totales de la factura."
      );
    }
  } catch (error) {
    console.error("Fallo al actualizar totales de factura:", error);
    // Propagar el error para que la acción principal pueda manejarlo y notificar al usuario.
    // Esto evita fallos silenciosos donde el total no se actualiza pero el usuario no recibe feedback.
    if (error instanceof Error) {
      throw new Error(
        `Fallo al actualizar totales de factura: ${error.message}`
      );
    }
    throw new Error(
      "Un error desconocido ocurrió al actualizar los totales de la factura."
    );
  }
}

export async function addDetalle(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    factura_id: Number(formData.get("factura_id")),
    producto_id: Number(formData.get("producto_id")),
    cantidad: formData.get("cantidad"),
    precio_unitario: formData.get("precio_unitario"),
    aplica_iva: formData.get("aplica_iva") === "on",
  };

  const validatedFields = FacturaDetalleSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: formatZodErrors(validatedFields.error) };
  }

  const nombre_producto = formData.get("nombre_producto") as string | null;
  if (!nombre_producto || nombre_producto === "Desconocido") {
    return {
      success: false,
      message: "No se pudo encontrar el nombre del producto.",
    };
  }

  const { cantidad, precio_unitario, aplica_iva } = validatedFields.data;
  const subtotal = cantidad * precio_unitario;
  const iva = aplica_iva ? subtotal * IVA_RATE : 0;
  const total = subtotal + iva;

  const dataToSubmit = {
    ...validatedFields.data,
    nombre_producto,
    subtotal,
    iva,
    total,
    usuario_creacion: 1,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(response, "Error al crear el detalle.");
    }

    await updateFacturaTotals(dataToSubmit.factura_id);

    revalidatePath(`/detalles-factura?factura_id=${dataToSubmit.factura_id}`);
    revalidatePath("/facturas");
    return { success: true, message: "Detalle añadido con éxito." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido.",
    };
  }
}

export async function updateDetalle(
  id: number,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    factura_id: Number(formData.get("factura_id")),
    producto_id: Number(formData.get("producto_id")),
    cantidad: formData.get("cantidad"),
    precio_unitario: formData.get("precio_unitario"),
    aplica_iva: formData.get("aplica_iva") === "on",
  };

  const validatedFields = FacturaDetalleSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, message: formatZodErrors(validatedFields.error) };
  }

  const nombre_producto = formData.get("nombre_producto") as string | null;
  if (!nombre_producto || nombre_producto === "Desconocido") {
    return {
      success: false,
      message: "No se pudo encontrar el nombre del producto.",
    };
  }

  const { cantidad, precio_unitario, aplica_iva } = validatedFields.data;
  const subtotal = cantidad * precio_unitario;
  const iva = aplica_iva ? subtotal * IVA_RATE : 0;
  const total = subtotal + iva;

  const dataToSubmit = {
    ...validatedFields.data,
    nombre_producto,
    subtotal,
    iva,
    total,
    usuario_modificacion: 1,
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(response, "Error al actualizar el detalle.");
    }

    await updateFacturaTotals(dataToSubmit.factura_id);

    revalidatePath(`/detalles-factura?factura_id=${dataToSubmit.factura_id}`);
    revalidatePath("/facturas");
    return { success: true, message: "Detalle actualizado con éxito." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido.",
    };
  }
}

export async function deleteDetalle(
  id: number,
  factura_id: number
): Promise<ActionResponse> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await handleApiError(response, "Error al eliminar el detalle.");
    }

    await updateFacturaTotals(factura_id);

    revalidatePath(`/detalles-factura?factura_id=${factura_id}`);
    revalidatePath("/facturas");
    return { success: true, message: "Detalle eliminado con éxito." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido.",
    };
  }
}
