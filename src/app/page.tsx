import Link from "next/link";

export default function Home() {
  return (
    <div className="py-12">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Sistema de Gestión de
            <span className="text-blue-600"> Tickets de Soporte</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Una solución completa para gestionar tickets de soporte con arquitectura moderna,
            transacciones seguras y monitoreo en tiempo real.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/tickets"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ver Tickets
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Crear Cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Características Principales</h2>
          <p className="mt-4 text-lg text-gray-500">
            Construido con las mejores tecnologías para un rendimiento óptimo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🗄️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Base de Datos Turso</h3>
            <p className="text-gray-500">
              SQLite distribuido con transacciones ACID, índices optimizados y replicación automática.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Caché con Redis</h3>
            <p className="text-gray-500">
              Upstash Redis para caché de datos, colas de tareas y reducción de latencia.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguridad Robusta</h3>
            <p className="text-gray-500">
              Roles y permisos, validación con Zod, prepared statements y hashing bcrypt.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Transacciones ACID</h3>
            <p className="text-gray-500">
              Operaciones atómicas que garantizan consistencia en actualizaciones complejas.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Monitoreo en Tiempo Real</h3>
            <p className="text-gray-500">
              Métricas de base de datos, Redis y rendimiento de la aplicación.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Server Actions</h3>
            <p className="text-gray-500">
              Next.js 16 con Server Actions para mutaciones seguras sin exponer endpoints.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="mt-24 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Stack Tecnológico</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl mb-2">⚛️</div>
              <h4 className="font-semibold">Next.js 16</h4>
              <p className="text-sm text-gray-500">App Router + Server Actions</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🗃️</div>
              <h4 className="font-semibold">Turso</h4>
              <p className="text-sm text-gray-500">SQLite Distribuido</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🔴</div>
              <h4 className="font-semibold">Upstash Redis</h4>
              <p className="text-sm text-gray-500">Caché + Colas</p>
            </div>
            <div>
              <div className="text-4xl mb-2">📘</div>
              <h4 className="font-semibold">TypeScript</h4>
              <p className="text-sm text-gray-500">Tipado Estricto</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Explora la aplicación, revisa las métricas del sistema y crea tickets de prueba.
          </p>
          <Link
            href="/tickets"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Explorar Tickets →
          </Link>
        </div>
      </div>
    </div>
  );
}
