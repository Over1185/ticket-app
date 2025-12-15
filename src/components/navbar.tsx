'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUsuario } from '@/app/actions/users'

interface SessionUser {
    id: number
    email: string
    nombre: string
    rol: 'cliente' | 'operador' | 'admin'
}

export function Navbar() {
    const router = useRouter()
    const [user, setUser] = useState<SessionUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        async function loadUser() {
            try {
                const currentUser = await getCurrentUser()
                setUser(currentUser)
            } catch (error) {
                console.error('Error loading user:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadUser()
    }, [])

    const handleLogout = async () => {
        try {
            await logoutUsuario()
            setUser(null)
            setShowDropdown(false)
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    const getRoleBadge = (rol: string) => {
        switch (rol) {
            case 'admin':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Admin</span>
            case 'operador':
                return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Operador</span>
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Cliente</span>
        }
    }

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
                            <Link
                                href="/metrics"
                                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                            >
                                Métricas
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {isLoading ? (
                            <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                        {user.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                            <div className="mt-2">
                                                {getRoleBadge(user.rol)}
                                            </div>
                                        </div>
                                        <Link
                                            href="/tickets"
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            📋 Mis Tickets
                                        </Link>
                                        {(user.rol === 'admin' || user.rol === 'operador') && (
                                            <Link
                                                href="/metrics"
                                                onClick={() => setShowDropdown(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                📊 Métricas
                                            </Link>
                                        )}
                                        <hr className="my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            🚪 Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
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
