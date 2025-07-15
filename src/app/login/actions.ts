"use server";

import { z } from "zod";
import { type ActionResponse } from "@/lib/actions-utils"; // Define esta utilidad si no lo has hecho

const loginSchema = z.object({
  usuario: z.string().min(1, "El nombre de usuario es requerido."),
  contrasena: z.string().min(1, "La contraseña es requerida."),
});

export type LoginResponse = {
  token: string;
  rol_nombre: string;
  rol_id: string;
  usuario: string;
};

export async function loginAction(
  formData: FormData
): Promise<ActionResponse<LoginResponse>> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = loginSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Datos de formulario no válidos.",
    };
  }

  const { usuario, contrasena } = validatedFields.data;
  const id_modulo = "COM";

  try {
    const response = await fetch(
      "https://aplicacion-de-seguridad-v2.onrender.com/api/usuarios/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena, id_modulo }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        message:
          errorData?.message ||
          "Credenciales incorrectas o usuario no autorizado.",
      };
    }

    const loginData: LoginResponse = await response.json();

    return {
      success: true,
      message: "Inicio de sesión exitoso.",
      data: loginData,
    };
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Un error inesperado ocurrió en el servidor.",
    };
  }
}
