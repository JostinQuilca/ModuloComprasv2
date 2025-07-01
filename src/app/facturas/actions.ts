"use server";

import { revalidatePath } from "next/cache";
import { FacturaCompra, FacturaCompraSchema } from "@/lib/types";
import { format } from "date-fns";
import {
  formatZodErrors,
  handleApiError,
  type ActionResponse,
} from "@/lib/actions-utils";
import { getFacturas } from "@/lib/data";

const API_URL = "https://modulocompras.onrender.com/api/facturas";

export async function addFactura(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<FacturaCompra>> {
  const fechaVencimientoValue = formData.get("fecha_vencimiento");
  const rawData = {
    proveedor_cedula_ruc: formData.get("proveedor_cedula_ruc"),
    numero_factura_proveedor: formData.get("numero_factura_proveedor"),
    fecha_emision: new Date(formData.get("fecha_emision") as string),
    fecha_vencimiento: fechaVencimientoValue
      ? new Date(fechaVencimientoValue as string)
      : null,
    estado: formData.get("estado"),
    tipo_pago: formData.get("tipo_pago"),
    subtotal: Number(formData.get("subtotal") ?? 0),
    iva: Number(formData.get("iva") ?? 0),
    total: Number(formData.get("total") ?? 0),
  };

  const validatedFields = FacturaCompraSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: formatZodErrors(validatedFields.error),
    };
  }

  // Check for duplicate invoice number for the same provider
  const { proveedor_cedula_ruc, numero_factura_proveedor } =
    validatedFields.data;
  try {
    const allFacturas = await getFacturas();
    const existingFactura = allFacturas.find(
      (f) =>
        f.proveedor_cedula_ruc === proveedor_cedula_ruc &&
        f.numero_factura_proveedor === numero_factura_proveedor
    );

    if (existingFactura) {
      return {
        success: false,
        message: `Ya existe una factura con el número "${numero_factura_proveedor}" para este proveedor.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al verificar facturas existentes.",
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
      await handleApiError(response, "Error al crear la factura.");
    }

    const newFactura = await response.json();

    revalidatePath("/facturas");
    return {
      success: true,
      message: "Factura creada con éxito.",
      data: newFactura,
    };
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

export async function updateFactura(
  id: number,
  prevState: any,
  formData: FormData
): Promise<ActionResponse<FacturaCompra>> {
  const fechaVencimientoValue = formData.get("fecha_vencimiento");
  const rawData = {
    proveedor_cedula_ruc: formData.get("proveedor_cedula_ruc"),
    numero_factura_proveedor: formData.get("numero_factura_proveedor"),
    fecha_emision: new Date(formData.get("fecha_emision") as string),
    fecha_vencimiento: fechaVencimientoValue
      ? new Date(fechaVencimientoValue as string)
      : null,
    estado: formData.get("estado"),
    tipo_pago: formData.get("tipo_pago"),
    subtotal: Number(formData.get("subtotal") ?? 0),
    iva: Number(formData.get("iva") ?? 0),
    total: Number(formData.get("total") ?? 0),
  };

  const validatedFields = FacturaCompraSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: formatZodErrors(validatedFields.error),
    };
  }

  // Check for duplicate invoice number for the same provider, excluding the current invoice
  const { proveedor_cedula_ruc, numero_factura_proveedor } =
    validatedFields.data;
  try {
    const allFacturas = await getFacturas();
    const existingFactura = allFacturas.find(
      (f) =>
        f.id !== id &&
        f.proveedor_cedula_ruc === proveedor_cedula_ruc &&
        f.numero_factura_proveedor === numero_factura_proveedor
    );

    if (existingFactura) {
      return {
        success: false,
        message: `Ya existe otra factura con el número "${numero_factura_proveedor}" para este proveedor.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al verificar facturas existentes.",
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
      await handleApiError(response, "Error al actualizar la factura.");
    }

    const updatedFactura = await response.json();

    revalidatePath("/facturas");
    revalidatePath(`/detalles-factura?factura_id=${id}`);
    revalidatePath(`/facturas/vista?factura_id=${id}`);
    return {
      success: true,
      message: "Factura actualizada con éxito.",
      data: updatedFactura,
    };
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

export async function cancelFactura(id: number): Promise<ActionResponse> {
  let currentFactura;
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) {
      await handleApiError(
        res,
        "Error al obtener los datos de la factura para cancelar."
      );
    }
    currentFactura = await res.json();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al buscar la factura.",
    };
  }

  const validatedFields = FacturaCompraSchema.safeParse({
    ...currentFactura,
    subtotal: parseFloat(currentFactura.subtotal) || 0,
    iva: parseFloat(currentFactura.iva) || 0,
    total: parseFloat(currentFactura.total) || 0,
    fecha_emision: new Date(currentFactura.fecha_emision),
    fecha_vencimiento: currentFactura.fecha_vencimiento
      ? new Date(currentFactura.fecha_vencimiento)
      : null,
    estado: "Cancelada",
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        "Los datos de la factura existente son inválidos. " +
        formatZodErrors(validatedFields.error),
    };
  }

  const finalDataToSubmit = {
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
      body: JSON.stringify(finalDataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(response, "Error al cancelar la factura.");
    }

    revalidatePath("/facturas");
    revalidatePath(`/detalles-factura?factura_id=${id}`);
    revalidatePath(`/facturas/vista?factura_id=${id}`);
    return {
      success: true,
      message: "Factura cancelada con éxito.",
    };
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

export async function printFactura(id: number): Promise<ActionResponse> {
  let currentFactura;
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) {
      await handleApiError(
        res,
        "Error al obtener los datos de la factura para imprimir."
      );
    }
    currentFactura = await res.json();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al buscar la factura.",
    };
  }

  const validatedFields = FacturaCompraSchema.safeParse({
    ...currentFactura,
    subtotal: parseFloat(currentFactura.subtotal) || 0,
    iva: parseFloat(currentFactura.iva) || 0,
    total: parseFloat(currentFactura.total) || 0,
    fecha_emision: new Date(currentFactura.fecha_emision),
    fecha_vencimiento: currentFactura.fecha_vencimiento
      ? new Date(currentFactura.fecha_vencimiento)
      : null,
    estado: "Impresa",
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        "Los datos de la factura existente son inválidos. " +
        formatZodErrors(validatedFields.error),
    };
  }

  const finalDataToSubmit = {
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
      body: JSON.stringify(finalDataToSubmit),
    });

    if (!response.ok) {
      await handleApiError(
        response,
        "Error al cambiar el estado de la factura a Impresa."
      );
    }

    revalidatePath("/facturas");
    revalidatePath(`/detalles-factura?factura_id=${id}`);
    revalidatePath(`/facturas/vista?factura_id=${id}`);
    return {
      success: true,
      message: "Factura marcada como Impresa.",
    };
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
