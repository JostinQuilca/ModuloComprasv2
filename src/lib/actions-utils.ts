
"use server";
import { z } from "zod";

/**
 * A generic response type for server actions.
 * Can include an optional data payload.
 */
export type ActionResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * Formats Zod validation errors into a single, user-friendly string.
 * @param error The ZodError object.
 * @returns A formatted string of validation errors.
 */
export function formatZodErrors(error: z.ZodError): string {
    const { fieldErrors } = error.flatten();
    const errorMessages = Object.entries(fieldErrors)
        .map(([fieldName, errors]) => `${fieldName}: ${errors?.join(', ')}`)
        .join('; ');
    return `Datos de formulario no válidos: ${errorMessages}`;
}


/**
 * Handles API errors by parsing the response and throwing a formatted error.
 * This is intended to be used within a try...catch block in the server action.
 * @param response The raw fetch Response object.
 * @param defaultMessage A fallback error message if parsing fails.
 */
export async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
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
