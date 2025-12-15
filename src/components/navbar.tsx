import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/users'
import { NavbarClient } from './navbar-client'

export async function Navbar() {
    const user = await getCurrentUser()

    return (
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
                            {user?.rol === 'admin' && (
                                <Link
                                    href="/metrics"
                                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    Métricas
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <NavbarClient user={user} />
                        ) : (
                            <Link
                                href="/login"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
