import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Tickets - Soporte Técnico",
  description: "Sistema de gestión de tickets de soporte técnico con Next.js 16, Turso y Redis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-blue-600">🎫 TicketApp</span>
                </Link>
                <div className="hidden md:flex ml-10 space-x-8">
                  <Link
                    href="/tickets"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Tickets
                  </Link>
                  <Link
                    href="/metrics"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Métricas
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© 2024 Sistema de Tickets. Construido con Next.js 16, Turso y Redis.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
