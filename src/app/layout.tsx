import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import OfflineProvider from "@/components/providers/offline-provider";

export const metadata: Metadata = {
  title: "Licor System - Control de Inventario",
  description: "Sistema de control de inventario para licorería",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Licor System",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <OfflineProvider>
          {children}
        </OfflineProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #27272a",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
