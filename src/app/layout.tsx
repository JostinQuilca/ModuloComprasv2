import type { Metadata } from "next";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/logo";
import {
  Settings,
  FileText,
  ListChecks,
  DollarSign,
  ShieldCheck,
  Scale,
  KeyRound,
  Users,
  Home,
} from "lucide-react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Módulo Compras",
  description: "App de Gestión de Proveedores",
  icons: {
    icon: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke-width='2.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cdefs%3E%3ClinearGradient%20id='logoGradient'%20x1='0%25'%20y1='0%25'%20x2='100%25'%20y2='100%25'%3E%3Cstop%20offset='0%25'%20stop-color='%23fa7e1e'%3E%3C/stop%3E%3Cstop%20offset='100%25'%20stop-color='%23d62976'%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath%20d='M17.5%205H9.5L6.5%2012H14.5L11.5%2019H17.5'%20stroke='url(%23logoGradient)'%3E%3C/path%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-semibold text-xl group-data-[collapsible=icon]:hidden">
                  Módulo Compras
                </span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link href="/">
                      <Home />
                      Dashboard
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Proveedores">
                    <Link href="/proveedores">
                      <Users />
                      Proveedores
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Facturas">
                    <Link href="/facturas">
                      <FileText />
                      Facturas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Configuraciones">
                    <Link href="/configuraciones">
                      <Settings />
                      Configuraciones
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Pagos a Proveedores">
                    <Link href="/pagos">
                      <DollarSign />
                      Pagos a Proveedores
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Auditoría">
                    <Link href="/auditoria">
                      <ShieldCheck />
                      Auditoría
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Saldos de Proveedor">
                    <Link href="/saldos">
                      <Scale />
                      Saldos de Proveedor
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Tokens API">
                    <Link href="/tokens">
                      <KeyRound />
                      Tokens API
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
              <SidebarTrigger />
            </header>
            <div className="min-h-[calc(100vh-4rem)] w-full">{children}</div>
            <Toaster />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
