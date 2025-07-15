"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginAction } from "./actions";
import { AtSign, KeyRound } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  usuario: z.string().min(1, { message: "El nombre de usuario es requerido." }),
  contrasena: z.string().min(1, { message: "La contraseña es requerida." }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      contrasena: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("usuario", values.usuario);
    formData.append("contrasena", values.contrasena);

    try {
      const result = await loginAction(formData);

      if (result.success && result.data) {
        toast({
          title: "Inicio de Sesión Exitoso",
          description: `Bienvenido, ${result.data?.rol_nombre}.`,
        });
        router.push("/");
      } else {
        toast({
          title: "Error de Inicio de Sesión",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Inesperado",
        description:
          "Ocurrió un problema en el servidor. Por favor, intente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a092d] p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
        <div id="stars-container">
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative rounded-xl border border-blue-500/20 bg-white/5 p-8 shadow-2xl shadow-blue-500/20 backdrop-blur-lg before:absolute before:-inset-px before:rounded-xl before:border before:border-blue-500/50 before:animate-pulse">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              Módulo Compras
            </h1>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Usuario</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
                        <Input
                          placeholder="su-usuario"
                          {...field}
                          className="bg-purple-900/20 border-purple-500/30 text-white placeholder:text-purple-400/50 focus:border-purple-400 pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contrasena"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-purple-900/20 border-purple-500/30 text-white placeholder:text-purple-400/50 focus:border-purple-400 pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6 shadow-lg shadow-blue-600/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Iniciando Sesión..." : "Acceder"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Link
              href="#"
              className="text-purple-300 hover:text-white transition-colors"
            >
              ¿Olvidó su contraseña?
            </Link>
            <span className="mx-2 text-purple-500">|</span>
            <Link
              href="#"
              className="text-purple-300 hover:text-white transition-colors"
            >
              Centro de Ayuda
            </Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        #stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        #stars {
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          animation: animStar 50s linear infinite;
        }
        #stars2 {
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          animation: animStar 100s linear infinite;
        }
        #stars3 {
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          animation: animStar 150s linear infinite;
        }
        @keyframes animStar {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-1000px);
          }
        }
      `}</style>
    </div>
  );
}
